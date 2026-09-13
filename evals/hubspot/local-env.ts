import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const HUBSPOT_LOCAL_ENV_FILENAME = ".env.local";
export const HUBSPOT_SERVICE_KEY_ENV = "HUBSPOT_SERVICE_KEY";

export type LoadRepoEnvLocalResult = {
  /** True when the env file existed and was parsed. */
  fileLoaded: boolean;
  /** Absolute path that was considered (never logged with contents). */
  path: string;
  /** True when HUBSPOT_SERVICE_KEY is non-empty after load. Never includes the value. */
  serviceKeyConfigured: boolean;
};

/**
 * Deterministically load repo-local `.env.local` into `process.env`.
 * - Does not override keys already set in the environment (shell wins).
 * - Never returns or logs secret values.
 * - Missing file is a no-op (caller fail-closes on missing key).
 */
export function loadRepoEnvLocal(options: {
  cwd?: string;
  filename?: string;
  env?: Record<string, string | undefined>;
} = {}): LoadRepoEnvLocalResult {
  const cwd = options.cwd ?? process.cwd();
  const filename = options.filename ?? HUBSPOT_LOCAL_ENV_FILENAME;
  const env = options.env ?? process.env;
  const path = resolve(cwd, filename);

  if (!existsSync(path)) {
    return {
      fileLoaded: false,
      path,
      serviceKeyConfigured: Boolean(env[HUBSPOT_SERVICE_KEY_ENV]?.trim()),
    };
  }

  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match) continue;

    const key = match[1];
    let value = match[2] ?? "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (env[key] === undefined) {
      env[key] = value;
    }
  }

  return {
    fileLoaded: true,
    path,
    serviceKeyConfigured: Boolean(env[HUBSPOT_SERVICE_KEY_ENV]?.trim()),
  };
}

/** Presence check only — never returns the secret value. */
export function isHubSpotServiceKeyConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(env[HUBSPOT_SERVICE_KEY_ENV]?.trim());
}
