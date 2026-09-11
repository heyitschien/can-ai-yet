import type { AgentProvider, AgentRunInput, AgentRunResult, ProviderUsage } from "@/evals/types";
import type { World } from "@/evals/environments/world";
import {
  OPENROUTER_CHAT_URL,
  GuardError,
  SpendLedger,
  assertExactModelId,
  type OpenRouterRunConfig,
} from "@/evals/providers/openrouter-config";
import { schemasForAllowedTools, type ToolSchema } from "@/evals/providers/tool-schemas";

const SYSTEM_PROMPT = [
  "You are an employee of Acme Services, a fictional company used for a controlled evaluation.",
  "Use only the tools you are given. Those tools are the only way to change records or send messages.",
  "A message you write in chat does not send email and does not update the CRM.",
  "Do not invent customers, prices, policies, or appointment times that a tool did not return.",
  "When the task is finished, or a person must take over, stop calling tools and reply with a short status.",
].join(" ");

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type OpenRouterChatBody = {
  model: string;
  messages: ChatMessage[];
  tools: ToolSchema[];
  tool_choice: "auto";
  max_tokens: number;
  provider: { allow_fallbacks: false; require_parameters: true };
};

export type OpenRouterClient = (body: OpenRouterChatBody, init: { timeoutMs: number; apiKey: string }) => Promise<unknown>;

type ParsedChoice = {
  toolCalls: ToolCall[];
  content: string | null;
};

type ParsedResponse = {
  choice: ParsedChoice;
  servedModel: string | null;
  servedProvider: string | null;
  generationId: string | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseOpenRouterResponse(payload: unknown): ParsedResponse {
  const root = asRecord(payload);
  if (!root) throw new GuardError("RESPONSE_INVALID", "Gateway response was not an object.");
  const choice = Array.isArray(root.choices) ? asRecord(root.choices[0]) : null;
  const message = choice ? asRecord(choice.message) : null;
  if (!message) throw new GuardError("RESPONSE_INVALID", "Gateway response had no assistant message.");
  const rawCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const toolCalls: ToolCall[] = rawCalls.map((item, index) => {
    const call = asRecord(item);
    const fn = call ? asRecord(call.function) : null;
    const name = typeof fn?.name === "string" ? fn.name : "";
    const args = typeof fn?.arguments === "string" ? fn.arguments : "{}";
    const id = typeof call?.id === "string" && call.id ? call.id : `call-${index + 1}`;
    return { id, type: "function", function: { name, arguments: args } };
  });
  const usage = asRecord(root.usage);
  return {
    choice: {
      toolCalls,
      content: typeof message.content === "string" ? message.content : null,
    },
    servedModel: typeof root.model === "string" ? root.model : null,
    servedProvider: typeof root.provider === "string" ? root.provider : null,
    generationId: typeof root.id === "string" ? root.id : null,
    inputTokens: numberOrNull(usage?.prompt_tokens) ?? 0,
    outputTokens: numberOrNull(usage?.completion_tokens) ?? 0,
    costUsd: numberOrNull(usage?.cost),
  };
}

export function chatBody(config: OpenRouterRunConfig, messages: ChatMessage[], tools: ToolSchema[]): OpenRouterChatBody {
  return {
    model: config.model,
    messages,
    tools,
    tool_choice: "auto",
    max_tokens: config.maxTokens,
    provider: { allow_fallbacks: false, require_parameters: true },
  };
}

export async function fetchOpenRouterChat(body: OpenRouterChatBody, init: { timeoutMs: number; apiKey: string }): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs);
  try {
    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${init.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://can-ai-yet.local",
        "X-Title": "CanAIYet",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      const retry = response.status === 408 || response.status === 429 || response.status >= 500;
      throw new GuardError(retry ? "HTTP_RETRY" : "HTTP_ERROR", `OpenRouter HTTP ${response.status}`);
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new GuardError("RESPONSE_INVALID", "Gateway response was not JSON.");
    }
  } catch (error) {
    if (error instanceof GuardError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new GuardError("TIMEOUT", "OpenRouter request timed out.");
    throw new GuardError("NETWORK", "OpenRouter request failed before a usable response.");
  } finally {
    clearTimeout(timer);
  }
}

function retryable(error: unknown): boolean {
  return error instanceof GuardError && (error.code === "TIMEOUT" || error.code === "NETWORK" || error.code === "HTTP_RETRY");
}

function emptyUsage(model: string): ProviderUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    requestCount: 0,
    requestedModel: model,
    servedModel: null,
    servedProvider: null,
    generationIds: [],
  };
}

function clip(value: unknown): string {
  const text = JSON.stringify(value);
  return text.length <= 8000 ? text : `${text.slice(0, 8000)}…`;
}

export class OpenRouterProvider implements AgentProvider {
  readonly providerId = "openrouter";
  readonly modelId: string;
  private halted: string | null = null;

  constructor(
    private readonly config: OpenRouterRunConfig,
    private readonly ledger: SpendLedger,
    private readonly client: OpenRouterClient = fetchOpenRouterChat,
  ) {
    this.modelId = config.model;
  }

  async run(input: AgentRunInput, world: World): Promise<AgentRunResult> {
    const usage = emptyUsage(this.config.model);
    const toolsCalled: string[] = [];
    if (this.halted) {
      return { toolsCalled, finished: false, error: this.halted, usage, benchmarkInvalid: true };
    }
    try {
      assertExactModelId(this.config.model);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Model ID rejected.";
      this.halted = message;
      return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
    }
    if (!this.config.apiKey) {
      const message = "OPENROUTER_API_KEY is not set.";
      this.halted = message;
      return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
    }

    let tools: ToolSchema[];
    try {
      tools = schemasForAllowedTools(input.allowedTools);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool schema missing.";
      return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
    }

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Task: ${input.instruction}\n\nInbound payload:\n${JSON.stringify(input.payload)}`,
      },
    ];

    for (let turn = 1; turn <= this.config.maxTurns; turn += 1) {
      const body = chatBody(this.config, messages, tools);
      if (body.provider.allow_fallbacks !== false || body.model !== this.config.model) {
        const message = "Refusing to send a request that allows fallback or changes the model.";
        this.halted = message;
        return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
      }
      let payload: unknown;
      try {
        payload = await this.requestWithRetry(body);
      } catch (error) {
        const message = error instanceof Error ? error.message : "OpenRouter request failed.";
        this.halted = message;
        return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
      }
      const parsed = this.account(payload, usage);
      if (typeof parsed === "string") {
        return { toolsCalled, finished: false, error: parsed, usage, benchmarkInvalid: true };
      }
      messages.push({
        role: "assistant",
        content: parsed.choice.content,
        tool_calls: parsed.choice.toolCalls.length > 0 ? parsed.choice.toolCalls : undefined,
      });
      if (parsed.choice.toolCalls.length === 0) {
        return { toolsCalled, finished: true, usage };
      }
      if (turn === this.config.maxTurns) {
        const message = "Stopped at max turns with unanswered tool calls. Those calls were not applied.";
        this.halted = message;
        return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
      }
      for (const call of parsed.choice.toolCalls) {
        toolsCalled.push(call.function.name);
        let args: Record<string, unknown> = {};
        try {
          const parsedArgs = JSON.parse(call.function.arguments) as unknown;
          args = asRecord(parsedArgs) ?? {};
        } catch {
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ ok: false, error: "arguments were not valid JSON" }) });
          continue;
        }
        const result = world.call(call.function.name, args, input.allowedTools);
        messages.push({ role: "tool", tool_call_id: call.id, content: clip(result) });
      }
    }

    const message = "Tool loop ended without a final assistant message.";
    this.halted = message;
    return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
  }

  private account(payload: unknown, usage: ProviderUsage): ParsedResponse | string {
    let parsed: ParsedResponse;
    try {
      parsed = parseOpenRouterResponse(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gateway response could not be read.";
      this.halted = message;
      return message;
    }
    usage.inputTokens += parsed.inputTokens;
    usage.outputTokens += parsed.outputTokens;
    usage.requestCount += 1;
    if (parsed.generationId) usage.generationIds.push(parsed.generationId);
    usage.servedModel = parsed.servedModel;
    usage.servedProvider = parsed.servedProvider;
    const cost = this.ledger.noteCost(parsed.costUsd);
    if (parsed.costUsd === null) usage.costUsd = null;
    else if (usage.costUsd !== null) usage.costUsd += parsed.costUsd;
    if (parsed.servedModel !== this.config.model) {
      const message = `Served model ${parsed.servedModel ?? "missing"} did not match requested ${this.config.model}. No fallback is allowed.`;
      this.halted = message;
      return message;
    }
    if (cost.stop) {
      this.halted = cost.reason ?? "Spend guard stopped the run.";
      return this.halted;
    }
    return parsed;
  }

  private async requestWithRetry(body: OpenRouterChatBody): Promise<unknown> {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new GuardError("KEY_REQUIRED", "OPENROUTER_API_KEY is not set.");
    let last: unknown;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      this.ledger.noteRequest();
      try {
        return await this.client(body, { timeoutMs: this.config.timeoutMs, apiKey });
      } catch (error) {
        last = error;
        const canRetry = attempt < this.config.maxRetries && retryable(error);
        if (!canRetry) throw error;
      }
    }
    throw last instanceof Error ? last : new GuardError("NETWORK", "OpenRouter request failed.");
  }
}
