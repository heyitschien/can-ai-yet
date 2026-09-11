import { createClient } from "@supabase/supabase-js";

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
  if (!process.env.CANAIYET_REVIEWED_BY?.trim()) {
    throw new Error("CANAIYET_REVIEWED_BY is required. Acceptance records who reviewed the run.");
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
  const accepted = await client.rpc("accept_benchmark_run", {
    p_run_id: runId,
    p_replace: process.argv.includes("--replace-accepted"),
    p_verified_by: process.env.CANAIYET_REVIEWED_BY,
  });
  if (accepted.error) throw new Error(accepted.error.message);
  console.log(`Accepted run ${runId} in one database transaction. Public pages should now read headline and detail from this run only.`);
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
