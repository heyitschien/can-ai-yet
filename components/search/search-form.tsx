"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "Follow up with my leads",
  "Answer customer emails",
  "Update my CRM",
  "Reconcile invoices",
  "Schedule appointments",
  "Maintain my website",
];

export function SearchForm({ initialQuery = "", large = false }: { initialQuery?: string; large?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % EXAMPLES.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      action="/search"
      onSubmit={(event) => {
        event.preventDefault();
        const next = query.trim();
        if (!next) return;
        router.push(`/search?q=${encodeURIComponent(next)}`);
      }}
    >
      <label className="sr-only" htmlFor="capability-query">
        What do you want AI to do?
      </label>
      <input
        id="capability-query"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={EXAMPLES[index]}
        className={`w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-4 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] ${large ? "h-14 text-base" : "h-12"}`}
      />
      <button
        type="submit"
        className="solid-control h-14 shrink-0 rounded-xl px-5 text-sm font-medium"
      >
        Check capability
      </button>
    </form>
  );
}
