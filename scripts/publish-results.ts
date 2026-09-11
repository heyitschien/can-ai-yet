import { createClient } from "@supabase/supabase-js";
import { decideAccept } from "@/evals/persistence/persist-run";

function arg(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function printDryRun(): void {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        writes: 0,
        paidRequests: 0,
        note: "This command does not call a model. Acceptance sets accepted_test_run_id only with --accept and CANAIYET_ACCEPT_RUN=1.",
        usage: "tsx scripts/publish-results.ts --accept --run-id <uuid> [--replace-accepted]",
      },
      null,
      2,
    ),
  );
}

function assertAcceptAllowed(): void {
  if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true" || process.env.VERCEL === "1") {
    throw new Error("Acceptance is refused in CI, GitHub Actions, and Vercel.");
  }
  if (process.env.CANAIYET_ACCEPT_RUN !== "1") {
    throw new Error("CANAIYET_ACCEPT_RUN is not 1. Nothing was accepted.");
  }
  if (!process.env.SUPABASE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Supabase URL and SUPABASE_SECRET_KEY are required to accept a run.");
  }
}

async function accept(): Promise<void> {
  assertAcceptAllowed();
  const runId = arg("--run-id");
  if (!runId) throw new Error("--run-id is required.");
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.SUPABASE_SECRET_KEY ?? "", {
    auth: { persistSession: false },
  });
  const run = await client.from("test_runs").select("id, status, capability_id, published").eq("id", runId).maybeSingle();
  if (run.error || !run.data) throw new Error(run.error?.message ?? "Run was not found.");
  const row = run.data as { id: string; status: string; capability_id: string; published: boolean };
  const capability = await client.from("capabilities").select("id, accepted_test_run_id").eq("id", row.capability_id).maybeSingle();
  if (capability.error || !capability.data) throw new Error("Capability for this run was not found.");
  const current = capability.data as { id: string; accepted_test_run_id: string | null };
  const decision = decideAccept({
    runId,
    runStatus: row.status,
    currentAcceptedRunId: current.accepted_test_run_id,
    replaceAccepted: process.argv.includes("--replace-accepted"),
  });
  if (!decision.allowed) throw new Error(decision.reason);
  const published = await client.from("test_runs").update({ published: true }).eq("id", runId);
  if (published.error) throw new Error(published.error.message);
  const accepted = await client.from("capabilities").update({ accepted_test_run_id: runId }).eq("id", current.id);
  if (accepted.error) throw new Error(accepted.error.message);
  console.log(`Accepted run ${runId}. Public pages should now read headline and detail from this run only.`);
}

async function main() {
  if (!process.argv.includes("--accept")) {
    printDryRun();
    return;
  }
  await accept();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
