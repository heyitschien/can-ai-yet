import {
  DEFAULT_DEMAND_TARGET,
  type DemandTarget,
} from "@/lib/demand/types";

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
  return {
    ...DEFAULT_DEMAND_TARGET,
    country,
    language,
    geoTargetConstant:
      country === "US" ? "geoTargetConstants/2840" : DEFAULT_DEMAND_TARGET.geoTargetConstant,
    languageConstant:
      language === "en" ? "languageConstants/1000" : DEFAULT_DEMAND_TARGET.languageConstant,
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
