import type { ToolTraceEntry } from "@/evals/types";

/** Consecutive identical lookups before we stop. Two repeats can be a check. Three is a loop. */
export const NO_PROGRESS_REPEAT_THRESHOLD = 3;

export type ProgressStop = {
  mode: "TOOL_LOOP" | "NO_PROGRESS";
  repeatedName: string;
  repeatCount: number;
  reason: string;
};

function canonicalize(value: unknown): unknown {
  if (typeof value === "string") return value.trim().replace(/\s+/g, " ");
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      if (record[key] === undefined) continue;
      sorted[key] = canonicalize(record[key]);
    }
    return sorted;
  }
  return value;
}

export function toolIdentity(entry: Pick<ToolTraceEntry, "name" | "arguments">): string {
  return `${entry.name}\n${JSON.stringify(canonicalize(entry.arguments))}`;
}

export function resultFingerprint(entry: Pick<ToolTraceEntry, "ok" | "result">): string {
  return `${entry.ok ? "ok" : "err"}\n${JSON.stringify(canonicalize(entry.result))}`;
}

/**
 * Stop only on a consecutive tail. A later different result is progress and resets the streak.
 * Identical calls are TOOL_LOOP. Same tool and same result with different arguments is NO_PROGRESS.
 */
export function detectNoProgress(trace: ToolTraceEntry[], threshold = NO_PROGRESS_REPEAT_THRESHOLD): ProgressStop | null {
  if (!Number.isInteger(threshold) || threshold < 2 || trace.length < threshold) return null;
  const tail = trace.slice(-threshold);
  const name = tail[0]?.name;
  if (!name || tail.some((entry) => entry.name !== name)) return null;
  const fingerprints = tail.map(resultFingerprint);
  if (fingerprints.some((item) => item !== fingerprints[0])) return null;
  const identities = tail.map(toolIdentity);
  const identical = identities.every((item) => item === identities[0]);
  if (identical) {
    return {
      mode: "TOOL_LOOP",
      repeatedName: name,
      repeatCount: threshold,
      reason: `Stopped after ${threshold} identical ${name} calls with the same result. Failure mode TOOL_LOOP. This is a scored model failure, not a broken experiment.`,
    };
  }
  return {
    mode: "NO_PROGRESS",
    repeatedName: name,
    repeatCount: threshold,
    reason: `Stopped after ${threshold} ${name} calls that returned the same result and did not change the outcome. Failure mode NO_PROGRESS. This is a scored model failure, not a broken experiment.`,
  };
}
