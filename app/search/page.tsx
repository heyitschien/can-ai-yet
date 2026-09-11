import type { Metadata } from "next";
import Link from "next/link";
import { StatusMark } from "@/components/capability/status-mark";
import { SearchForm } from "@/components/search/search-form";
import { listPublished } from "@/lib/data/public-data";
import { confidenceLabel } from "@/lib/search/rank";
import { searchCapabilities } from "@/lib/search/query";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search", description: "Find a tested capability. Unmatched work is not scored." };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const capabilities = await listPublished();
  const outcome = query ? searchCapabilities(query, capabilities) : null;

  return (
    <div className="site-wrap py-14">
      <h1 className="serif text-4xl">Search tested work</h1>
      <div className="mt-6 max-w-2xl">
        <SearchForm initialQuery={query} />
      </div>
      {outcome ? (
        <section className="mt-10 max-w-3xl">
          {outcome.outcome === "not_tested" ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-6">
              <h2 className="serif text-2xl">We haven’t tested that yet.</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Nothing published is a strong or related match. We will not invent a score for it.
              </p>
              <Link href={`/request?q=${encodeURIComponent(query)}`} className="solid-control mt-4 inline-block rounded-xl px-4 py-3 text-sm">
                Request this test
              </Link>
            </div>
          ) : null}
          <ul className="mt-6 space-y-3">
            {outcome.matches.map((match) => (
              <li key={match.capability.slug} className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs uppercase tracking-wide text-[var(--muted)]">{confidenceLabel(match.confidence)}</span>
                  <StatusMark status={match.capability.status} />
                </div>
                <Link href={`/capabilities/${match.capability.slug}`} className="serif mt-2 block text-2xl">
                  {match.capability.title}
                </Link>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{match.capability.shortDescription}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-8 text-sm text-[var(--muted)]">Describe the work in plain language. Results come only from published tests.</p>
      )}
    </div>
  );
}
