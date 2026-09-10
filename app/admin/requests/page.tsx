import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/security/admin";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return <div className="site-wrap py-14">Request review needs the server secret. Public visitors can still submit requests.</div>;
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await client.from("capability_requests").select("id, query, status, kind, created_at").order("created_at", { ascending: false }).limit(100);
  const groups = new Map<string, number>();
  for (const row of data ?? []) groups.set(row.query, (groups.get(row.query) ?? 0) + 1);
  return (
    <div className="site-wrap py-14">
      <h1 className="serif text-3xl">Requests</h1>
      <ul className="mt-6 space-y-3 text-sm">
        {(data ?? []).map((row) => (
          <li key={row.id} className="border-b border-[var(--line)] pb-3">
            <p>{row.query}</p>
            <p className="text-[var(--muted)]">{row.status} · {row.kind} · similar {groups.get(row.query)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
