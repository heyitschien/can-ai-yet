import type { Metadata } from "next";
import { CapabilityCard } from "@/components/capability/capability-card";
import { CATEGORIES } from "@/lib/content/catalog";
import { listPublished } from "@/lib/data/public-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Capabilities", description: "Tested business capabilities and the evidence behind each status." };

export default async function CapabilitiesPage() {
  const capabilities = await listPublished();
  return (
    <div className="site-wrap py-14">
      <h1 className="serif text-4xl">Capabilities</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Each page is a tested task, not a vendor claim. Scores come from the latest accepted run.
      </p>
      <div className="mt-8 flex flex-wrap gap-2 text-sm">
        {CATEGORIES.map((category) => (
          <a key={category.slug} href={`/categories/${category.slug}`} className="rounded-full border border-[var(--line)] px-3 py-1">
            {category.name}
          </a>
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.slug} capability={capability} />
        ))}
      </div>
    </div>
  );
}
