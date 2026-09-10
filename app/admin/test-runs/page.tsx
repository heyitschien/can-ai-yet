import Link from "next/link";
import { redirect } from "next/navigation";
import { loadEvidence } from "@/lib/evidence/load";
import { isAdmin } from "@/lib/security/admin";

export const dynamic = "force-dynamic";

export default async function AdminRunsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const evidence = loadEvidence();
  return (
    <div className="site-wrap py-14">
      <h1 className="serif text-3xl">Test runs</h1>
      <ul className="mt-6 space-y-2 text-sm">
        {(evidence?.suites ?? []).map((suite) => (
          <li key={suite.capabilityCode}>
            <Link href={`/admin/test-runs/${suite.capabilityCode}`}>
              {suite.capabilityCode} · {suite.model} · {suite.successCount}/{suite.totalCount} · failures {suite.failureCount} · ${suite.totalCostUsd}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
