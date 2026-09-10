import Link from "next/link";
import { redirect } from "next/navigation";
import { listPublished } from "@/lib/data/public-data";
import { formatPercent, formatTestedDate } from "@/lib/format";
import { adminConfigured, isAdmin, passwordsMatch, signSession, sessionCookie } from "@/lib/security/admin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (email !== process.env.ADMIN_EMAIL || !passwordsMatch(password)) return;
  const store = await cookies();
  const cookie = sessionCookie(signSession(email));
  store.set(cookie.name, cookie.value, cookie.options);
  redirect("/admin");
}

export default async function AdminPage() {
  if (!adminConfigured()) {
    return <div className="site-wrap py-14">Admin sign-in is not configured.</div>;
  }
  if (!(await isAdmin())) {
    return (
      <form action={login} className="site-wrap max-w-md space-y-3 py-14">
        <h1 className="serif text-3xl">Admin</h1>
        <input name="email" type="email" required className="field" placeholder="Email" />
        <input name="password" type="password" required className="field" placeholder="Password" />
        <button className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm text-white">Sign in</button>
      </form>
    );
  }
  const capabilities = await listPublished();
  return (
    <div className="site-wrap py-14">
      <h1 className="serif text-3xl">Laboratory</h1>
      <div className="mt-4 flex gap-4 text-sm">
        <Link href="/admin/capabilities">Capabilities</Link>
        <Link href="/admin/test-runs">Test runs</Link>
        <Link href="/admin/requests">Requests</Link>
      </div>
      <table className="mt-8 w-full text-left text-sm">
        <thead className="text-[var(--muted)]">
          <tr>
            <th className="py-2">Capability</th>
            <th>Status</th>
            <th>Score</th>
            <th>Last tested</th>
            <th>Evidence</th>
          </tr>
        </thead>
        <tbody>
          {capabilities.map((item) => (
            <tr key={item.slug} className="border-t border-[var(--line)]">
              <td className="py-2">{item.title}</td>
              <td>{item.status}</td>
              <td>{formatPercent(item.currentScore)}</td>
              <td>{formatTestedDate(item.lastTestedAt)}</td>
              <td>{item.evidenceLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
