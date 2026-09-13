import {
  DEFAULT_DEMAND_TARGET,
  DemandError,
  type DemandTarget,
} from "@/lib/demand/types";

/** Explicit v1 mappings only. Never label one locale while querying another. */
const SUPPORTED_TARGETS: Record<
  string,
  { country: string; language: string; geoTargetConstant: string; languageConstant: string }
> = {
  "US|en": {
    country: "US",
    language: "en",
    geoTargetConstant: "geoTargetConstants/2840",
    languageConstant: "languageConstants/1000",
  },
};

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]!;
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

export function resolveTarget(args: Record<string, string | boolean>): DemandTarget {
  const country = String(args.country ?? DEFAULT_DEMAND_TARGET.country).toUpperCase();
  const language = String(args.language ?? DEFAULT_DEMAND_TARGET.language).toLowerCase();
  const mapped = SUPPORTED_TARGETS[`${country}|${language}`];
  if (!mapped) {
    throw new DemandError(
      `Unsupported Demand Scout target country=${country} language=${language}. v1 supports only US/en. Refusing to mislabel Google geo/language constants.`,
      { className: "config" },
    );
  }
  return {
    ...DEFAULT_DEMAND_TARGET,
    country: mapped.country,
    language: mapped.language,
    geoTargetConstant: mapped.geoTargetConstant,
    languageConstant: mapped.languageConstant,
  };
}

export function wantsJson(args: Record<string, string | boolean>): boolean {
  return Boolean(args.json);
}

export function wantsRefresh(args: Record<string, string | boolean>): boolean {
  return Boolean(args.refresh);
}

export function wantsLive(args: Record<string, string | boolean>): boolean {
  return Boolean(args.live);
}

export function wantsMock(args: Record<string, string | boolean>): boolean {
  return Boolean(args.mock);
}
