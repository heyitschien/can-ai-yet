/** CAY-20260910-05: execute the real acceptance script against an in-memory
 * Supabase double. No database, model, or network access. Expected failures
 * assert the desired atomicity contract, not that the defects are acceptable.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Operation = { table: string; patch: Record<string, unknown>; filters: Record<string, unknown> };
const originalArgv = [...process.argv];

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("CI", "false");
  vi.stubEnv("GITHUB_ACTIONS", "false");
  vi.stubEnv("VERCEL", "0");
  vi.stubEnv("CANAIYET_ACCEPT_RUN", "1");
  vi.stubEnv("SUPABASE_SECRET_KEY", "synthetic-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://review.invalid");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("REVIEW: network is blocked"); }));
});
afterEach(() => {
  process.argv = [...originalArgv];
  vi.doUnmock("@supabase/supabase-js");
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
});

function fakeClient(options: { failPointer?: boolean; concurrent?: boolean } = {}) {
  const published = new Set<string>();
  const operations: Operation[] = [];
  let accepted: string | null = null;
  let readers = 0;
  let release: () => void = () => {};
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  return {
    published, operations, accepted: () => accepted,
    from(table: string) {
      let patch: Record<string, unknown> | null = null;
      const filters: Record<string, unknown> = {};
      const query = {
        select() { return query; },
        eq(key: string, value: unknown) { filters[key] = value; return query; },
        update(value: Record<string, unknown>) { patch = value; return query; },
        async maybeSingle() {
          if (table === "test_runs") return { data: { id: filters.id, status: "completed", capability_id: "cap-1", published: false }, error: null };
          const snapshot = accepted;
          if (options.concurrent) { if (++readers === 2) release(); await barrier; }
          return { data: { id: "cap-1", accepted_test_run_id: snapshot }, error: null };
        },
        then(resolve: (value: unknown) => unknown) {
          operations.push({ table, patch: patch ?? {}, filters: { ...filters } });
          if (table === "test_runs") published.add(String(filters.id));
          if (table === "capabilities") {
            if (options.failPointer) return Promise.resolve(resolve({ error: { message: "synthetic pointer-write failure" } }));
            accepted = String(patch?.accepted_test_run_id);
          }
          return Promise.resolve(resolve({ error: null }));
        },
      };
      return query;
    },
  };
}

async function executeAccept(runId: string) {
  process.argv = ["node", "scripts/publish-results.ts", "--accept", "--run-id", runId];
  await import("@/scripts/publish-results");
}

describe("CAY review: acceptance atomicity (expected failures)", () => {
  it.fails("F7: pointer-write failure must not leave the unaccepted run public", async () => {
    const db = fakeClient({ failPointer: true });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: () => db }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    await executeAccept("run-a");
    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(db.published.has("run-a")).toBe(false); // Actual: true; RLS exposes it.
  });

  it.fails("F7: concurrent acceptances cannot replace each other without --replace-accepted", async () => {
    const db = fakeClient({ concurrent: true });
    vi.doMock("@supabase/supabase-js", () => ({ createClient: () => db }));
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await executeAccept("run-a");
    vi.resetModules();
    await executeAccept("run-b");
    await vi.waitFor(() => expect(log).toHaveBeenCalledTimes(2));
    expect(db.operations.filter((op) => op.table === "capabilities")).toHaveLength(1);
    // Actual: both update by capability ID only; the second silently replaces the first.
  });
});
