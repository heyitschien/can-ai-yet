import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CapabilityCard } from "@/components/capability/capability-card";
import { CATEGORIES } from "@/lib/content/catalog";
import { listPublished } from "@/lib/data/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((item) => item.slug === slug);
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = CATEGORIES.find((item) => item.slug === slug);
  if (!category) notFound();
  const capabilities = (await listPublished()).filter((item) => item.categorySlug === slug);
  return (
    <div className="site-wrap py-14">
      <h1 className="serif text-4xl">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">{category.description}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.slug} capability={capability} />
        ))}
      </div>
    </div>
  );
}
