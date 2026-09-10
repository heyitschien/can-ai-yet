import { mkdirSync, writeFileSync } from "node:fs";
import { allScenarios } from "@/evals/capabilities";
import { runAll, runCapability, runScenario } from "@/evals/runners/run-suite";
import { ReferenceAgent } from "@/evals/providers/reference-agent";

function printSuite(title: string, results: { scenarioId: string; success: boolean; failureExplanation: string | null }[]) {
  const passed = results.filter((result) => result.success).length;
  console.log(`\n${title}: ${passed}/${results.length}`);
  for (const result of results) {
    console.log(`  ${result.success ? "PASS" : "FAIL"} ${result.scenarioId}${result.failureExplanation ? ` — ${result.failureExplanation}` : ""}`);
  }
}

async function main() {
  const persist = process.argv.includes("--persist");
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const target = args[0] === "capability" ? args[1] : args[0] === "scenario" ? args[1] : args[0];
  const mode = args[0] === "capability" || args[0] === "scenario" || args[0] === "all" ? args[0] : "all";

  if (mode === "scenario" && target) {
    const scenario = allScenarios().find((item) => item.id === target || item.slug === target);
    if (!scenario) throw new Error(`Unknown scenario ${target}`);
    const result = await runScenario(scenario, new ReferenceAgent());
    printSuite(scenario.id, [result]);
    return;
  }

  if (mode === "capability" && target) {
    const suite = await runCapability(target.toUpperCase());
    printSuite(`${suite.capabilityCode} ${suite.status} ${Math.round((suite.score ?? 0) * 100)}%`, suite.results);
    if (persist) writeEvidence([suite]);
    return;
  }

  const suites = await runAll();
  for (const suite of suites) {
    printSuite(`${suite.capabilityCode} ${suite.status} ${suite.score === null ? "n/a" : Math.round(suite.score * 100) + "%"}`, suite.results);
  }
  if (persist) writeEvidence(suites);
}

function writeEvidence(suites: Awaited<ReturnType<typeof runAll>>) {
  mkdirSync("evals/accepted", { recursive: true });
  const artifact = {
    generatedAt: new Date().toISOString(),
    note: "Scores come from the reference agent running against Acme Services fixtures. They are not a frontier-model claim.",
    suites,
  };
  writeFileSync("evals/accepted/latest.json", `${JSON.stringify(artifact, null, 2)}\n`);
  console.log("\nWrote evals/accepted/latest.json");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
