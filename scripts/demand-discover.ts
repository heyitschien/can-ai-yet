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
  const seed = String(args.seed ?? "").trim();
  if (!seed) {
    throw new DemandError('Missing required --seed "keyword".', { className: "config" });
  }

  const mode = resolveDemandMode({
    command: "discover",
    liveFlag: wantsLive(args),
    forceMock: wantsMock(args),
  });
  const target = resolveTarget(args);
  const source = createDemandSource({ mode, refresh: wantsRefresh(args) });
  const ideas = await source.discoverIdeas({ keyword: seed }, target);
  const report = buildDemandReport({
    mode,
    operation: "generateKeywordIdeas",
    target,
    seed: { keyword: seed },
    ideas,
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
