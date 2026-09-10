import type { CapabilityStatus } from "@/lib/domain";

export function formatPercent(score: number | null): string {
  if (score === null) return "Not scored";
  return `${Math.round(score * 100)}%`;
}

export function formatTestedDate(value: string | null): string {
  if (!value) return "Not tested";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function formatCost(value: number | null): string {
  if (value === null) return "Not measured";
  if (value === 0) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function formatRuntime(seconds: number | null): string {
  if (seconds === null) return "Not measured";
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  return `${seconds.toFixed(2)} s`;
}

export function statusGlyph(status: CapabilityStatus): string {
  switch (status) {
    case "green":
      return "●";
    case "yellow":
      return "▲";
    case "red":
      return "■";
    case "gray":
      return "○";
    default: {
      const never: never = status;
      return never;
    }
  }
}
