import { GoogleAdsDemandSource } from "@/lib/demand/google-ads";
import { MockDemandSource } from "@/lib/demand/mock";
import type { DemandSource } from "@/lib/demand/source";
import { DEFAULT_API_VERSION, DemandError } from "@/lib/demand/types";
import { FileSystemDemandCache } from "@/lib/demand/cache";

export type DemandMode = "mock" | "live";

export function resolveDemandMode(options: {
  command: "discover" | "history" | "smoke";
  liveFlag: boolean;
  forceMock: boolean;
}): DemandMode {
  if (options.forceMock) return "mock";
  if (options.command === "smoke") return "live";
  if (options.liveFlag) return "live";
  return "mock";
}

export function createDemandSource(options: {
  mode: DemandMode;
  refresh?: boolean;
  cacheDir?: string;
}): DemandSource {
  const cache = new FileSystemDemandCache(
    options.cacheDir ?? undefined,
  );

  if (options.mode === "mock") {
    return new MockDemandSource(cache, Boolean(options.refresh));
  }

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID ?? "";
  const serviceAccountJson = process.env.GOOGLE_ADS_SERVICE_ACCOUNT_JSON ?? "";
  const apiVersion = process.env.GOOGLE_ADS_API_VERSION ?? DEFAULT_API_VERSION;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || undefined;

  if (!customerId || !serviceAccountJson) {
    throw new DemandError(
      "Live Demand Scout requires GOOGLE_ADS_CUSTOMER_ID and GOOGLE_ADS_SERVICE_ACCOUNT_JSON.",
      { className: "config" },
    );
  }

  // Explicitly reject legacy developer-token configuration.
  if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    throw new DemandError(
      "GOOGLE_ADS_DEVELOPER_TOKEN is obsolete (sunset 2026-09-09). Remove it; Demand Scout uses service-account auth only.",
      { className: "config" },
    );
  }

  return new GoogleAdsDemandSource({
    apiVersion,
    customerId,
    serviceAccountJson,
    loginCustomerId,
    cache,
    refresh: Boolean(options.refresh),
  });
}

export * from "@/lib/demand/types";
export * from "@/lib/demand/source";
export * from "@/lib/demand/normalize";
export * from "@/lib/demand/cluster";
export * from "@/lib/demand/report";
export * from "@/lib/demand/cache";
export { MockDemandSource } from "@/lib/demand/mock";
export {
  GoogleAdsDemandSource,
  classifyGoogleAdsHttpError,
  parseMonthOfYear,
  parseMonthlyVolumes,
  parseServiceAccountJson,
  redactSecrets,
  resetPlanningThrottleForTests,
} from "@/lib/demand/google-ads";
export { resolveTarget, parseArgs } from "@/lib/demand/cli";
