import type { AgentProvider, AgentRunInput, AgentRunResult, ProviderUsage, ToolTraceEntry } from "@/evals/types";
import type { World } from "@/evals/environments/world";
import {
  OPENROUTER_CHAT_URL,
  GuardError,
  SpendLedger,
  assertExactModelId,
  assertPaidExecutionAllowed,
  configFromEnv,
  paidRunBlockedReason,
  type OpenRouterRunConfig,
} from "@/evals/providers/openrouter-config";
import { detectNoProgress } from "@/evals/providers/no-progress";
import { schemasForAllowedTools, type ToolSchema } from "@/evals/providers/tool-schemas";

export const ACME_SYSTEM_PROMPT = [
  "You are an employee of Acme Services, a fictional company used for a controlled evaluation.",
  "Use only the tools you are given. Those tools are the only way to change records or send messages.",
  "A message you write in chat does not send email and does not update the CRM.",
  "Do not invent customers, prices, policies, or appointment times that a tool did not return.",
  "When the task is finished, or a person must take over, stop calling tools and reply with a short status.",
].join(" ");

const SYSTEM_PROMPT = ACME_SYSTEM_PROMPT;

function readCacheTokens(usage: Record<string, unknown> | null): { cacheReadTokens: number | null; cacheWriteTokens: number | null } {
  if (!usage) return { cacheReadTokens: null, cacheWriteTokens: null };
  const details = asRecord(usage.prompt_tokens_details);
  const cacheRead =
    numberOrNull(details?.cached_tokens) ??
    numberOrNull(details?.cache_read_tokens) ??
    numberOrNull(usage.cache_read_input_tokens) ??
    numberOrNull(usage.cached_tokens);
  const cacheWrite =
    numberOrNull(details?.cache_write_tokens) ??
    numberOrNull(details?.cache_creation_input_tokens) ??
    numberOrNull(usage.cache_creation_input_tokens) ??
    numberOrNull(usage.cache_write_tokens);
  return { cacheReadTokens: cacheRead, cacheWriteTokens: cacheWrite };
}

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
  provider: {
    allow_fallbacks: false;
    require_parameters: true;
    only?: [string];
    order?: [string];
  };
};

export type OpenRouterClient = (body: OpenRouterChatBody, init: { timeoutMs: number; apiKey: string }) => Promise<unknown>;

type ParsedChoice = {
  toolCalls: ToolCall[];
  content: string | null;
};

export type RouterSnapshot = {
  selectedProvider: string | null;
  strategy: string | null;
  attempt: number | null;
  attempts: unknown[];
  pipeline: unknown[];
  requested: string | null;
};

type ParsedResponse = {
  choice: ParsedChoice;
  finishReason: string | null;
  choiceError: string | null;
  servedModel: string | null;
  servedProvider: string | null;
  generationId: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number | null;
  cacheWriteTokens: number | null;
  costUsd: number | null;
  router: RouterSnapshot | null;
  routeError: string | null;
};

const SUCCESSFUL_STOP = "stop";
const SUCCESSFUL_TOOLS = "tool_calls";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseToolCall(item: unknown): { call: ToolCall } | { error: string } {
  const call = asRecord(item);
  if (!call) return { error: "tool call is not an object" };
  if (typeof call.id !== "string" || call.id.length === 0) return { error: "tool call is missing an id" };
  if (call.type !== "function") return { error: "tool call type is not function" };
  const fn = asRecord(call.function);
  if (!fn || typeof fn.name !== "string" || fn.name.length === 0) return { error: "tool call is missing a name" };
  if (typeof fn.arguments !== "string") return { error: "tool call arguments are not a string" };
  try {
    if (!asRecord(JSON.parse(fn.arguments) as unknown)) return { error: "tool call arguments are not a JSON object" };
  } catch {
    return { error: "tool call arguments are not JSON" };
  }
  return { call: { id: call.id, type: "function", function: { name: fn.name, arguments: fn.arguments } } };
}

export function parseOpenRouterResponse(payload: unknown): ParsedResponse {
  const root = asRecord(payload);
  if (!root) throw new GuardError("RESPONSE_INVALID", "Gateway response was not an object.");
  const choice = Array.isArray(root.choices) ? asRecord(root.choices[0]) : null;
  const message = choice ? asRecord(choice.message) : null;
  if (!message) throw new GuardError("RESPONSE_INVALID", "Gateway response had no assistant message.");
  const rawCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const parsedCalls = rawCalls.map(parseToolCall);
  const envelopeErrors = parsedCalls.flatMap((item) => ("error" in item ? [item.error] : []));
  const toolCalls = parsedCalls.flatMap((item) => ("call" in item ? [item.call] : []));
  const ids = toolCalls.map((call) => call.id);
  if (new Set(ids).size !== ids.length) envelopeErrors.push("tool call ids are not unique");
  const usage = asRecord(root.usage);
  const choiceError = choice ? asRecord(choice.error) : null;
  const finishReason = typeof choice?.finish_reason === "string" ? choice.finish_reason : null;
  const router = parseRouterMetadata(root);
  return {
    choice: {
      toolCalls: envelopeErrors.length > 0 ? [] : toolCalls,
      content: typeof message.content === "string" ? message.content : null,
    },
    finishReason,
    choiceError: envelopeErrors.length > 0
      ? envelopeErrors.join("; ")
      : choiceError
        ? JSON.stringify(choiceError)
        : choice?.error
          ? "choice error"
          : null,
    servedModel: typeof root.model === "string" ? root.model : null,
    servedProvider: router.snapshot?.selectedProvider ?? null,
    generationId: typeof root.id === "string" ? root.id : null,
    inputTokens: numberOrNull(usage?.prompt_tokens) ?? 0,
    outputTokens: numberOrNull(usage?.completion_tokens) ?? 0,
    ...readCacheTokens(usage),
    costUsd: numberOrNull(usage?.cost),
    router: router.snapshot,
    routeError: router.error,
  };
}

function parseRouterMetadata(root: Record<string, unknown>): { snapshot: RouterSnapshot | null; error: string | null } {
  const meta = asRecord(root.openrouter_metadata);
  if (!meta) return { snapshot: null, error: "Router metadata is missing. The provider route is unproven." };
  const endpoints = asRecord(meta.endpoints);
  const available = Array.isArray(endpoints?.available) ? endpoints.available : [];
  const selected = available
    .map(asRecord)
    .filter((item): item is Record<string, unknown> => item !== null)
    .filter((item) => item.selected === true);
  const selectedProvider = selected.length === 1 && typeof selected[0]?.provider === "string" ? selected[0].provider : null;
  const snapshot: RouterSnapshot = {
    selectedProvider,
    strategy: typeof meta.strategy === "string" ? meta.strategy : null,
    attempt: typeof meta.attempt === "number" && Number.isFinite(meta.attempt) ? meta.attempt : null,
    attempts: Array.isArray(meta.attempts) ? meta.attempts : [],
    pipeline: Array.isArray(meta.pipeline) ? meta.pipeline : [],
    requested: typeof meta.requested === "string" ? meta.requested : null,
  };
  if (!selectedProvider) return { snapshot, error: "Router metadata has no selected provider." };
  if (snapshot.attempt !== null && snapshot.attempt > 1) {
    return { snapshot, error: "Router metadata shows a fallback attempt. The pinned route was not honored." };
  }
  return { snapshot, error: null };
}

export function providerMatchesPin(selected: string, pin: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalize(selected) === normalize(pin);
}

export function terminalProblem(parsed: ParsedResponse): string | null {
  if (parsed.choiceError) return "Gateway returned a choice error. This is not a completed benchmark turn.";
  if (parsed.finishReason !== SUCCESSFUL_STOP && parsed.finishReason !== SUCCESSFUL_TOOLS) {
    return `Gateway finish reason ${parsed.finishReason ?? "missing"} is not a completed turn.`;
  }
  if (parsed.finishReason === SUCCESSFUL_TOOLS && parsed.choice.toolCalls.length === 0) {
    return "Gateway said tool calls finished, but none were usable.";
  }
  if (parsed.finishReason === SUCCESSFUL_STOP && parsed.choice.toolCalls.length > 0) {
    return "Gateway stopped and also returned tool calls. The turn is ambiguous and is not counted.";
  }
  if (parsed.finishReason === SUCCESSFUL_STOP && parsed.choice.content === null && parsed.choice.toolCalls.length === 0) {
    return "Gateway stopped without a message or tool call. The turn is incomplete.";
  }
  return null;
}

export function chatBody(config: OpenRouterRunConfig, messages: ChatMessage[], tools: ToolSchema[]): OpenRouterChatBody {
  // Do not add cache_control, session routing, or a response-cache flag. Those would change the trial.
  return {
    model: config.model,
    messages,
    tools,
    tool_choice: "auto",
    max_tokens: config.maxTokens,
    provider: config.providerSlug
      ? { allow_fallbacks: false, require_parameters: true, only: [config.providerSlug], order: [config.providerSlug] }
      : { allow_fallbacks: false, require_parameters: true },
  };
}

export function openRouterHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://can-ai-yet.local",
    "X-Title": "CanAIYet",
    "X-OpenRouter-Metadata": "enabled",
  };
}

export async function fetchOpenRouterChat(body: OpenRouterChatBody, init: { timeoutMs: number; apiKey: string }): Promise<unknown> {
  const blocked = paidRunBlockedReason(process.env);
  if (blocked) throw new GuardError("PAID_BLOCKED", blocked);
  const cap = Number(process.env.OPENROUTER_MAX_SPEND_USD);
  const reserve = Number(process.env.OPENROUTER_REQUEST_RESERVE_USD);
  if (!Number.isFinite(cap) || !(cap > 0)) {
    throw new GuardError("SPEND_CAP_REQUIRED", "OPENROUTER_MAX_SPEND_USD must be a finite positive number before a real OpenRouter request.");
  }
  if (!Number.isFinite(reserve) || !(reserve > 0)) {
    throw new GuardError("RESERVE_REQUIRED", "OPENROUTER_REQUEST_RESERVE_USD must be a finite positive number before a real OpenRouter request.");
  }
  if (body.provider.allow_fallbacks !== false) {
    throw new GuardError("FALLBACK_FORBIDDEN", "A real request must forbid provider fallbacks.");
  }
  const pinned = configFromEnv(process.env);
  if (pinned.routeMode !== "pinned" || !pinned.providerSlug || body.provider.only?.[0] !== pinned.providerSlug || body.provider.order?.[0] !== pinned.providerSlug) {
    throw new GuardError("PROVIDER_PIN_REQUIRED", "A real request must pin one provider with only and order.");
  }
  if (!Number.isFinite(body.max_tokens) || !(body.max_tokens > 0) || !Number.isFinite(init.timeoutMs) || !(init.timeoutMs > 0)) {
    throw new GuardError("LIMITS_REQUIRED", "A real request needs a finite token ceiling and timeout.");
  }
  try {
    assertPaidExecutionAllowed(process.env, {
      model: body.model,
      apiKey: init.apiKey,
      maxTokens: body.max_tokens,
      maxTurns: 1,
      timeoutMs: init.timeoutMs,
      maxRetries: 0,
      maxSpendUsd: cap,
      requestReserveUsd: reserve,
      providerSlug: pinned.providerSlug,
      routeMode: pinned.routeMode,
      maxScenarios: 1,
      appUrl: "https://can-ai-yet.local",
      appTitle: "CanAIYet",
    });
  } catch (error) {
    if (error instanceof GuardError) throw error;
    throw new GuardError("PAID_BLOCKED", "Paid execution is not authorized.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init.timeoutMs);
  try {
    const response = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: openRouterHeaders(init.apiKey),
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

function addOptionalCount(current: number | null | undefined, next: number | null): number | null {
  if (next === null) return current ?? null;
  return (current ?? 0) + next;
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
    servedProviders: [],
    generationIds: [],
    attempts: [],
    cacheReadTokens: null,
    cacheWriteTokens: null,
  };
}

function clip(value: unknown): string {
  const text = JSON.stringify(value);
  return text.length <= 8000 ? text : `${text.slice(0, 8000)}…`;
}

export class OpenRouterProvider implements AgentProvider {
  readonly providerId = "openrouter";
  readonly modelId: string;
  readonly executionConfig: {
    maxTokens: number;
    maxTurns: number;
    timeoutMs: number;
    maxRetries: number;
    maxSpendUsd: number | null;
    requestReserveUsd: number | null;
    maxScenarios: number;
    allowFallbacks: false;
    providerSlug: string | null;
    routeMode: "pinned" | "unpinned" | null;
  };
  private halted: string | null = null;

  constructor(
    private readonly config: OpenRouterRunConfig,
    private readonly ledger: SpendLedger,
    private readonly client: OpenRouterClient = fetchOpenRouterChat,
  ) {
    this.modelId = config.model;
    this.executionConfig = {
      maxTokens: config.maxTokens,
      maxTurns: config.maxTurns,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      maxSpendUsd: config.maxSpendUsd,
      requestReserveUsd: config.requestReserveUsd,
      maxScenarios: config.maxScenarios,
      allowFallbacks: false,
      providerSlug: config.providerSlug,
      routeMode: config.routeMode,
    };
  }

  async run(input: AgentRunInput, world: World): Promise<AgentRunResult> {
    const usage = emptyUsage(this.config.model);
    const toolsCalled: string[] = [];
    const toolTrace: ToolTraceEntry[] = [];
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
        payload = await this.requestWithRetry(body, usage);
      } catch (error) {
        if (this.ledger.uncertainAttempts > 0) usage.costUsd = null;
        const message = error instanceof Error ? error.message : "OpenRouter request failed.";
        this.halted = message;
        return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
      }
      const parsed = this.account(payload, usage);
      if (typeof parsed === "string") {
        return { toolsCalled, finished: false, error: parsed, usage, benchmarkInvalid: true };
      }
      const incomplete = terminalProblem(parsed);
      if (incomplete) {
        this.halted = incomplete;
        return { toolsCalled, finished: false, error: incomplete, usage, benchmarkInvalid: true };
      }
      messages.push({
        role: "assistant",
        content: parsed.choice.content,
        tool_calls: parsed.choice.toolCalls.length > 0 ? parsed.choice.toolCalls : undefined,
      });
      if (parsed.choice.toolCalls.length === 0) {
        return { toolsCalled, finished: true, usage, toolTrace };
      }
      if (turn === this.config.maxTurns) {
        const message = "Stopped at the turn budget with unanswered tool calls. Those calls were not applied. This is a scored unfinished run, not a broken experiment.";
        return { toolsCalled, finished: false, error: message, usage, toolTrace, failureMode: "TURN_BUDGET" };
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
        toolTrace.push({ name: call.function.name, arguments: args, ok: result.ok, result: result.ok ? result.data : result.error });
        messages.push({ role: "tool", tool_call_id: call.id, content: clip(result) });
      }
      const stalled = detectNoProgress(toolTrace);
      if (stalled) {
        return { toolsCalled, finished: false, error: stalled.reason, usage, toolTrace, failureMode: stalled.mode };
      }
    }

    const message = "Tool loop ended without a final assistant message.";
    this.halted = message;
    return { toolsCalled, finished: false, error: message, usage, benchmarkInvalid: true };
  }

  private startAttempt(usage: ProviderUsage): void {
    usage.attempts.push({
      generationId: null,
      servedModel: null,
      servedProvider: null,
      costUsd: null,
      uncertain: true,
      finishReason: null,
    });
    usage.requestCount += 1;
  }

  private completeAttempt(usage: ProviderUsage, parsed: ParsedResponse): void {
    const attempt = usage.attempts[usage.attempts.length - 1] ?? {
      generationId: null,
      servedModel: null,
      servedProvider: null,
      costUsd: null,
      uncertain: true,
      finishReason: null,
    };
    if (usage.attempts.length === 0) usage.attempts.push(attempt);
    attempt.generationId = parsed.generationId;
    attempt.servedModel = parsed.servedModel;
    attempt.servedProvider = parsed.servedProvider;
    attempt.costUsd = parsed.costUsd;
    attempt.finishReason = parsed.finishReason;
    attempt.cacheReadTokens = parsed.cacheReadTokens;
    attempt.cacheWriteTokens = parsed.cacheWriteTokens;
    attempt.uncertain = this.ledger.uncertainAttempts > 0 || parsed.costUsd === null;
    attempt.router = parsed.router
      ? {
          selectedProvider: parsed.router.selectedProvider,
          strategy: parsed.router.strategy,
          attempt: parsed.router.attempt,
          attempts: parsed.router.attempts,
          pipeline: parsed.router.pipeline,
        }
      : null;
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
    usage.cacheReadTokens = addOptionalCount(usage.cacheReadTokens, parsed.cacheReadTokens);
    usage.cacheWriteTokens = addOptionalCount(usage.cacheWriteTokens, parsed.cacheWriteTokens);
    this.completeAttempt(usage, parsed);
    if (parsed.generationId) usage.generationIds.push(parsed.generationId);
    usage.servedModel = parsed.servedModel;
    if (parsed.servedProvider) usage.servedProviders.push(parsed.servedProvider);
    usage.servedProvider = parsed.servedProvider;
    const cost = this.ledger.noteCost(parsed.costUsd);
    if (this.ledger.uncertainAttempts > 0 || parsed.costUsd === null) usage.costUsd = null;
    else if (usage.costUsd !== null) usage.costUsd += parsed.costUsd;
    if (parsed.routeError) {
      this.halted = parsed.routeError;
      return parsed.routeError;
    }
    if (this.config.providerSlug && parsed.servedProvider && !providerMatchesPin(parsed.servedProvider, this.config.providerSlug)) {
      const message = `Selected provider ${parsed.servedProvider} did not match pinned ${this.config.providerSlug}.`;
      this.halted = message;
      return message;
    }
    if (this.config.routeMode === "unpinned") {
      const message = "This request used automatic provider selection. It is not a pinned provider benchmark.";
      this.halted = message;
      return message;
    }
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

  private async requestWithRetry(body: OpenRouterChatBody, usage: ProviderUsage): Promise<unknown> {
    const apiKey = this.config.apiKey;
    if (!apiKey) throw new GuardError("KEY_REQUIRED", "OPENROUTER_API_KEY is not set.");
    let last: unknown;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt += 1) {
      const reserved = this.ledger.beginAttempt();
      if (!reserved.ok) {
        this.halted = reserved.reason;
        throw new GuardError("SPEND_CAP", reserved.reason);
      }
      this.startAttempt(usage);
      try {
        return await this.client(body, { timeoutMs: this.config.timeoutMs, apiKey });
      } catch (error) {
        last = error;
        if (retryable(error)) {
          this.ledger.noteUncertainAttempt();
          usage.costUsd = null;
        }
        const canRetry = attempt < this.config.maxRetries && retryable(error);
        if (!canRetry) throw error;
      }
    }
    throw last instanceof Error ? last : new GuardError("NETWORK", "OpenRouter request failed.");
  }
}
