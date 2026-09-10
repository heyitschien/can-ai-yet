import { notFound, redirect } from "next/navigation";
import { loadEvidence } from "@/lib/evidence/load";
import { isAdmin } from "@/lib/security/admin";

export const dynamic = "force-dynamic";

export default async function AdminRunPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const suite = loadEvidence()?.suites.find((item) => item.capabilityCode === id);
  if (!suite) notFound();
  return (
    <div className="site-wrap py-14">
      <h1 className="serif text-3xl">{suite.capabilityCode}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{suite.gitSha} · {suite.fixtureVersion} · {suite.environmentVersion}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {suite.results.map((result) => (
          <li key={result.scenarioId}>{result.success ? "PASS" : "FAIL"} {result.scenarioId} {result.failureExplanation ?? ""}</li>
        ))}
      </ul>
    </div>
  );
}
