import { gitProvenance, type GitProvenance } from "@/evals/provenance/git";

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
  requestReserveUsd: number | null;
  providerSlug: string | null;
  routeMode: "pinned" | "unpinned" | null;
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
  if (env.NODE_ENV === "test") return "NODE_ENV=test. Automated tests must use mocks, not the real transport.";
  if (env.CI === "true" || env.CI === "1") return "CI is set. Paid evals never run as ordinary CI.";
  if (env.GITHUB_ACTIONS === "true") return "GITHUB_ACTIONS is set. Paid evals never run as ordinary CI.";
  if (env.VERCEL === "1") return "VERCEL is set. Paid evals never run on deploy.";
  if (env.CANAIYET_PAID_RUN !== "1") return "CANAIYET_PAID_RUN is not 1. Paid execution is off.";
  return null;
}

export function assertPaidExecutionAllowed(
  env: Record<string, string | undefined>,
  config: OpenRouterRunConfig,
  git: GitProvenance = gitProvenance(),
): void {
  const blocked = paidRunBlockedReason(env);
  if (blocked) throw new GuardError("PAID_BLOCKED", blocked);
  if (!config.apiKey) throw new GuardError("KEY_REQUIRED", "OPENROUTER_API_KEY is required for a paid run.");
  if (config.maxSpendUsd === null || !Number.isFinite(config.maxSpendUsd) || !(config.maxSpendUsd > 0)) {
    throw new GuardError("SPEND_CAP_REQUIRED", "OPENROUTER_MAX_SPEND_USD must be a finite positive number before a paid run.");
  }
  if (config.requestReserveUsd === null || !Number.isFinite(config.requestReserveUsd) || !(config.requestReserveUsd > 0) || config.requestReserveUsd > config.maxSpendUsd) {
    throw new GuardError("RESERVE_REQUIRED", "OPENROUTER_REQUEST_RESERVE_USD must be a finite positive amount no larger than the spend cap.");
  }
  if (config.routeMode !== "pinned" || !config.providerSlug) {
    throw new GuardError("PROVIDER_PIN_REQUIRED", "Paid execution needs OPENROUTER_PROVIDER set to one provider slug. An unpinned route is not a pinned benchmark.");
  }
  if (git.dirty || !/^[0-9a-f]{40}$/.test(git.sha)) {
    throw new GuardError("DIRTY_WORKTREE", "Paid execution requires a clean worktree and the full commit SHA. A dirty tree is not that commit.");
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

function readProviderSlug(raw: string | undefined): string | null {
  if (raw === undefined || raw.trim() === "") return null;
  const slug = raw.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new GuardError("PROVIDER_PIN_INVALID", "OPENROUTER_PROVIDER must be one provider slug, such as openai. Not a display name or a list.");
  }
  return slug;
}

function readRouteMode(env: NodeJS.ProcessEnv): "pinned" | "unpinned" | null {
  const explicit = env.OPENROUTER_ROUTE?.trim() ?? "";
  const pinned = readProviderSlug(env.OPENROUTER_PROVIDER);
  if (explicit === "unpinned" && pinned) {
    throw new GuardError("PROVIDER_PIN_INVALID", "Do not set OPENROUTER_PROVIDER and OPENROUTER_ROUTE=unpinned together.");
  }
  if (explicit === "unpinned") return "unpinned";
  if (explicit !== "" && explicit !== "pinned") {
    throw new GuardError("PROVIDER_PIN_INVALID", "OPENROUTER_ROUTE must be pinned or unpinned.");
  }
  if (pinned) return "pinned";
  return null;
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
    requestReserveUsd: readSpend(env.OPENROUTER_REQUEST_RESERVE_USD),
    providerSlug: readProviderSlug(env.OPENROUTER_PROVIDER),
    routeMode: readRouteMode(env),
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
   * This is a client-side stop threshold, not a provider-side charge ceiling.
   * The gateway can still bill one in-flight request above the reserve. That run is invalid.
   */
  beginAttempt(): { ok: true } | { ok: false; reason: string } {
    if (this.requestReserveUsd === null || !Number.isFinite(this.requestReserveUsd) || !(this.requestReserveUsd > 0)) {
      return { ok: false, reason: "No verified per-request cost bound. Refusing dispatch." };
    }
    if (this.uncertainAttempts > 0) {
      return { ok: false, reason: "An earlier attempt may already have been billed. Remaining spend cannot be verified, so no further request is sent." };
    }
    if (this.maxSpendUsd === null || !Number.isFinite(this.maxSpendUsd) || !(this.maxSpendUsd > 0)) {
      return { ok: false, reason: "Spend cap is missing or not finite. Refusing dispatch." };
    }
    if (this.measuredUsd >= this.maxSpendUsd) {
      return { ok: false, reason: "Spend cap is exhausted. Refusing another request." };
    }
    const remaining = this.remainingUsd() ?? 0;
    if (remaining < this.requestReserveUsd) {
      return { ok: false, reason: "Remaining budget is below the request reserve. Refusing the request." };
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
    if (this.requestReserveUsd !== null && costUsd > this.requestReserveUsd) {
      return { stop: true, reason: "A response cost more than the reserved per-request bound. Stopping." };
    }
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
