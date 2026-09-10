import Link from "next/link";
import { CapabilityCard } from "@/components/capability/capability-card";
import { SearchForm } from "@/components/search/search-form";
import { listPublished } from "@/lib/data/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const capabilities = await listPublished();
  const featured = [...capabilities].sort((a, b) => (b.currentScore ?? 0) - (a.currentScore ?? 0)).slice(0, 6);

  return (
    <div className="site-wrap py-16 sm:py-24">
      <section className="mx-auto max-w-[760px]">
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[var(--muted)]">CAPABILITY LABORATORY</p>
        <h1 className="serif mt-4 text-5xl leading-[1.05] tracking-tight sm:text-6xl">What can AI actually do now?</h1>
        <p className="mt-5 max-w-[38rem] text-lg leading-8 text-[var(--muted)]">
          We test real work so you don’t have to guess.
        </p>
        <div className="mt-8">
          <p className="mb-2 text-sm font-medium">What do you want AI to do?</p>
          <SearchForm large />
        </div>
      </section>

      <section className="mt-20">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="serif text-3xl">What AI can do today</h2>
          <Link href="/capabilities" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">
            All capabilities
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-[var(--muted)]">Testing in progress. No scored capability is published yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {featured.map((capability) => (
              <CapabilityCard key={capability.slug} capability={capability} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-6">
        <h2 className="serif text-2xl">Changing fastest</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          No material score change is on record yet. A change appears here only after a later accepted test run moves a published result.
        </p>
      </section>
    </div>
  );
}
