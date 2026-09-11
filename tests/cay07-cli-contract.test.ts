/** Offline invocation of the real CLI with HTTP and artifact writes mocked.
 * Synthetic authorization is scoped to this test. No model request or run file.
 */
import { afterEach, expect, it, vi } from "vitest";
import type { SuiteResult } from "@/evals/types";
import { buildPersistPayload } from "@/evals/persistence/persist-run";
import { leadScenarios } from "@/evals/capabilities/lead-followup/scenarios";
const originalArgv = [...process.argv];
afterEach(() => {
  process.argv = originalArgv;
  vi.doUnmock("@/evals/persistence/persist-run");
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
});
it.fails("R4: paid CLI carries scenario provenance into its run-level persistence configuration", async () => {
  vi.resetModules();
  for (const [key,value] of Object.entries({ CI:"false",GITHUB_ACTIONS:"false",VERCEL:"0",NODE_ENV:"development",
    CANAIYET_PAID_RUN:"1",OPENROUTER_API_KEY:"synthetic-key",OPENROUTER_MODEL:"review/exact-model",
    OPENROUTER_MAX_SPEND_USD:"0.01",OPENROUTER_MAX_SCENARIOS:"1",OPENROUTER_MAX_RETRIES:"0" })) vi.stubEnv(key,value);
  vi.stubGlobal("fetch",vi.fn(async () => new Response(JSON.stringify({id:"gen-cli-review",model:"review/exact-model",provider:"route-review",
    choices:[{finish_reason:"stop",message:{role:"assistant",content:"Done"}}],usage:{cost:0.001,prompt_tokens:10,completion_tokens:1},
  }))));
  const write = vi.fn<(suite: SuiteResult) => string>(() => "mock-artifact-no-file-written");
  vi.doMock("@/evals/persistence/persist-run", async (importOriginal) => ({
    ...await importOriginal<typeof import("@/evals/persistence/persist-run")>(), writeLocalRunArtifact:write,
  }));
  vi.spyOn(console,"log").mockImplementation(()=>{});
  process.argv=["node","scripts/run-openrouter-cap001.ts","--execute"];
  await import("@/scripts/run-openrouter-cap001");
  await vi.waitFor(()=>expect(write).toHaveBeenCalledOnce());
  const suite=write.mock.calls[0]![0];
  expect(suite.results[0]?.provenance?.generationIds).toEqual(["gen-cli-review"]);
  expect(buildPersistPayload(suite,leadScenarios.slice(0,1)).run.toolConfiguration.generationIds).toEqual(["gen-cli-review"]);
});
