export const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
export const CAP001_SCENARIO_CEILING = 12;

export const OPENROUTER_DEFAULTS = {
  maxTokens: 800,
  maxTurns: 8,
  timeoutMs: 45_000,
  maxRetries: 1,
  maxScenarios: CAP001_SCENARIO_CEILING,
} as const;

export type OpenRouterRunConfig = {
  model: string;
  apiKey: string | null;
  maxTokens: number;
  maxTurns: number;
  timeoutMs: number;
  maxRetries: number;
  maxSpendUsd: number | null;
  maxScenarios: number;
  appUrl: string;
  appTitle: string;
};

export class GuardError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GuardError";
  }
}

export function assertExactModelId(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) throw new GuardError("MODEL_REQUIRED", "An exact OpenRouter model ID is required.");
  if (trimmed !== model) throw new GuardError("MODEL_INVALID", "Model ID must not have surrounding whitespace.");
  if (/\s/.test(trimmed)) throw new GuardError("MODEL_INVALID", "Model ID must not contain whitespace.");
  if (!trimmed.includes("/") || trimmed.split("/").some((part) => part.length === 0)) {
    throw new GuardError("MODEL_INVALID", "Model ID must be an exact provider/model ID, not a brand name.");
  }
  const forbidden =
    /^openrouter\//i.test(trimmed) ||
    /(^|\/)auto$/i.test(trimmed) ||
    /:(nitro|floor|free|online|thinking|flex)$/i.test(trimmed);
  if (forbidden) {
    throw new GuardError(
      "MODEL_FORBIDDEN",
      `Model ${trimmed} is forbidden. Use an exact model ID. No auto-router, fallback, or routing suffix.`,
    );
  }
  return trimmed;
}

export function paidRunBlockedReason(env: Record<string, string | undefined>): string | null {
  if (env.CI === "true" || env.CI === "1") return "CI is set. Paid evals never run as ordinary CI.";
  if (env.GITHUB_ACTIONS === "true") return "GITHUB_ACTIONS is set. Paid evals never run as ordinary CI.";
  if (env.VERCEL === "1") return "VERCEL is set. Paid evals never run on deploy.";
  if (env.CANAIYET_PAID_RUN !== "1") return "CANAIYET_PAID_RUN is not 1. Paid execution is off.";
  return null;
}

export function assertPaidExecutionAllowed(env: Record<string, string | undefined>, config: OpenRouterRunConfig): void {
  const blocked = paidRunBlockedReason(env);
  if (blocked) throw new GuardError("PAID_BLOCKED", blocked);
  if (!config.apiKey) throw new GuardError("KEY_REQUIRED", "OPENROUTER_API_KEY is required for a paid run.");
  if (config.maxSpendUsd === null || !(config.maxSpendUsd > 0)) {
    throw new GuardError("SPEND_CAP_REQUIRED", "OPENROUTER_MAX_SPEND_USD must be a positive number before a paid run.");
  }
  assertExactModelId(config.model);
  if (config.maxScenarios < 1 || config.maxScenarios > CAP001_SCENARIO_CEILING) {
    throw new GuardError("SCENARIO_CAP", `CAP-001 scenario cap must be between 1 and ${CAP001_SCENARIO_CEILING}.`);
  }
}

function readPositiveInt(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) throw new GuardError("CONFIG_INVALID", `${name} must be a non-negative integer.`);
  return value;
}

function readSpend(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new GuardError("CONFIG_INVALID", "OPENROUTER_MAX_SPEND_USD must be a non-negative number.");
  return value;
}

export function configFromEnv(env: NodeJS.ProcessEnv): OpenRouterRunConfig {
  const modelRaw = env.OPENROUTER_MODEL ?? "";
  const model = modelRaw.trim() === "" ? "" : assertExactModelId(modelRaw);
  const maxScenarios = readPositiveInt(env.OPENROUTER_MAX_SCENARIOS, OPENROUTER_DEFAULTS.maxScenarios, "OPENROUTER_MAX_SCENARIOS");
  if (maxScenarios < 1 || maxScenarios > CAP001_SCENARIO_CEILING) {
    throw new GuardError("SCENARIO_CAP", `OPENROUTER_MAX_SCENARIOS must be between 1 and ${CAP001_SCENARIO_CEILING}.`);
  }
  const maxTurns = readPositiveInt(env.OPENROUTER_MAX_TURNS, OPENROUTER_DEFAULTS.maxTurns, "OPENROUTER_MAX_TURNS");
  if (maxTurns < 1) throw new GuardError("CONFIG_INVALID", "OPENROUTER_MAX_TURNS must be at least 1.");
  return {
    model,
    apiKey: env.OPENROUTER_API_KEY?.trim() ? env.OPENROUTER_API_KEY.trim() : null,
    maxTokens: Math.max(1, readPositiveInt(env.OPENROUTER_MAX_TOKENS, OPENROUTER_DEFAULTS.maxTokens, "OPENROUTER_MAX_TOKENS")),
    maxTurns,
    timeoutMs: Math.max(1, readPositiveInt(env.OPENROUTER_TIMEOUT_MS, OPENROUTER_DEFAULTS.timeoutMs, "OPENROUTER_TIMEOUT_MS")),
    maxRetries: readPositiveInt(env.OPENROUTER_MAX_RETRIES, OPENROUTER_DEFAULTS.maxRetries, "OPENROUTER_MAX_RETRIES"),
    maxSpendUsd: readSpend(env.OPENROUTER_MAX_SPEND_USD),
    maxScenarios,
    appUrl: env.NEXT_PUBLIC_APP_URL?.trim() || "https://can-ai-yet.local",
    appTitle: "CanAIYet",
  };
}

export class SpendLedger {
  measuredUsd = 0;
  uncertainAttempts = 0;
  requests = 0;

  constructor(
    readonly maxSpendUsd: number | null,
    readonly requestReserveUsd: number | null = null,
  ) {}

  /** Remaining spend that can still be reserved. Null means no cap is configured. */
  remainingUsd(): number | null {
    if (this.maxSpendUsd === null) return null;
    return Math.max(0, this.maxSpendUsd - this.measuredUsd);
  }

  /**
   * Reserve the next attempt before dispatch.
   * With a cap, the whole remaining budget is held for this one in-flight request
   * unless a smaller per-request reserve was approved. A later request is refused
   * once the cap is exhausted or any attempt cost is unknown.
   */
  beginAttempt(options: { sameRequestRetry?: boolean } = {}): { ok: true } | { ok: false; reason: string } {
    if (this.maxSpendUsd !== null && this.uncertainAttempts > 0 && !options.sameRequestRetry) {
      return { ok: false, reason: "An earlier attempt may already have been billed. Remaining spend cannot be verified, so no further request is sent." };
    }
    if (this.maxSpendUsd !== null && this.measuredUsd >= this.maxSpendUsd) {
      return { ok: false, reason: "Spend cap is exhausted. Refusing another request." };
    }
    if (this.maxSpendUsd !== null) {
      const remaining = this.remainingUsd() ?? 0;
      const reserve = this.requestReserveUsd ?? remaining;
      if (!(reserve > 0) || remaining < reserve) {
        return { ok: false, reason: "Remaining budget is below the request reserve. Refusing the request." };
      }
    }
    this.requests += 1;
    return { ok: true };
  }

  noteUncertainAttempt(): void {
    this.uncertainAttempts += 1;
  }

  noteCost(costUsd: number | null): { stop: boolean; reason?: string } {
    if (this.uncertainAttempts > 0) {
      return { stop: this.maxSpendUsd !== null, reason: "Spend is unverified because an earlier attempt may already have been billed." };
    }
    if (costUsd === null) {
      this.uncertainAttempts += 1;
      if (this.maxSpendUsd !== null) {
        return { stop: true, reason: "Spend is unverified because the gateway did not return a cost. The run stops instead of continuing blind." };
      }
      return { stop: false };
    }
    if (!Number.isFinite(costUsd) || costUsd < 0) {
      return { stop: true, reason: "Gateway returned an unusable cost." };
    }
    this.measuredUsd += costUsd;
    if (this.maxSpendUsd !== null && this.measuredUsd > this.maxSpendUsd) {
      return { stop: true, reason: `Measured spend ${this.measuredUsd.toFixed(6)} exceeded the cap of ${this.maxSpendUsd}.` };
    }
    return { stop: false };
  }
}

export function maxHttpRequests(scenarioCount: number, config: OpenRouterRunConfig): number {
  return scenarioCount * config.maxTurns * (config.maxRetries + 1);
}

export function estimateOutputTokenCeiling(scenarioCount: number, config: OpenRouterRunConfig): number {
  return scenarioCount * config.maxTurns * config.maxTokens;
}
