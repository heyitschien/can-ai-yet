import Link from "next/link";
import { redirect } from "next/navigation";
import { listPublished } from "@/lib/data/public-data";
import { formatPercent } from "@/lib/format";
import { isAdmin } from "@/lib/security/admin";

export const dynamic = "force-dynamic";

export default async function AdminCapabilitiesPage() {
  if (!(await isAdmin())) redirect("/admin");
  const capabilities = await listPublished();
  return (
    <div className="site-wrap py-14">
      <h1 className="serif text-3xl">Capabilities</h1>
      <ul className="mt-6 space-y-2 text-sm">
        {capabilities.map((item) => (
          <li key={item.code}>
            <Link href={`/admin/capabilities/${item.code}`}>{item.code} — {item.title} — {item.status} — {formatPercent(item.currentScore)}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
