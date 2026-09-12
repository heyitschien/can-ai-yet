import {
  createDemandSource,
  resolveDemandMode,
} from "@/lib/demand";
import {
  parseArgs,
  resolveTarget,
  wantsJson,
  wantsLive,
  wantsMock,
  wantsRefresh,
} from "@/lib/demand/cli";
import { buildDemandReport, formatDemandReportText } from "@/lib/demand/report";
import { DemandError } from "@/lib/demand/types";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const raw = String(args.keywords ?? "").trim();
  if (!raw) {
    throw new DemandError('Missing required --keywords "a,b,c".', { className: "config" });
  }
  const keywords = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (keywords.length === 0) {
    throw new DemandError("Provide at least one keyword in --keywords.", { className: "config" });
  }

  const mode = resolveDemandMode({
    command: "history",
    liveFlag: wantsLive(args),
    forceMock: wantsMock(args),
  });
  const target = resolveTarget(args);
  const source = createDemandSource({ mode, refresh: wantsRefresh(args) });
  const metrics = await source.getHistoricalMetrics(keywords, target);
  const report = buildDemandReport({
    mode,
    operation: "generateKeywordHistoricalMetrics",
    target,
    keywords,
    metrics,
  });

  if (wantsJson(args)) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(formatDemandReportText(report));
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
