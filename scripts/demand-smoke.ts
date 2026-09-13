import { createDemandSource } from "@/lib/demand";
import {
  parseArgs,
  resolveTarget,
  wantsJson,
  wantsRefresh,
} from "@/lib/demand/cli";
import { buildDemandReport, formatDemandReportText } from "@/lib/demand/report";
import { DemandError } from "@/lib/demand/types";

/**
 * Intentionally live commissioning command.
 * Do not run until Google credentials are configured and a human authorizes it.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const seed = String(args.seed ?? "").trim();
  if (!seed) {
    throw new DemandError('Missing required --seed "keyword".', { className: "config" });
  }

  const target = resolveTarget(args);
  const source = createDemandSource({ mode: "live", refresh: wantsRefresh(args) });
  const ideas = await source.discoverIdeas({ keyword: seed }, target);
  const report = buildDemandReport({
    mode: "live",
    operation: "smoke",
    target,
    seed: { keyword: seed },
    ideas,
  });

  if (wantsJson(args)) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(formatDemandReportText(report));
    process.stdout.write(
      "\nCommissioning note: review this live evidence before broader discovery or scheduling.\n",
    );
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
