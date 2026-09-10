import { notFound, redirect } from "next/navigation";
import { listPublished } from "@/lib/data/public-data";
import { isAdmin } from "@/lib/security/admin";

export const dynamic = "force-dynamic";

export default async function AdminCapabilityPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const capability = (await listPublished()).find((item) => item.code === id || item.slug === id);
  if (!capability) notFound();
  return (
    <div className="site-wrap max-w-3xl py-14">
      <h1 className="serif text-3xl">{capability.title}</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">Published: yes. Evidence: {capability.evidenceLevel}. Model: {capability.modelName}.</p>
      <pre className="mt-6 overflow-auto rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4 text-xs">{JSON.stringify(capability.commonFailureModes, null, 2)}</pre>
    </div>
  );
}
