"use client";

import { useState } from "react";

export function RequestForm({ initialQuery, intent, capability }: { initialQuery: string; intent: "test" | "implementation"; capability: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [context, setContext] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, context, business, email, kind: intent, capability }),
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not save that request.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p className="mt-8 text-lg">Thanks. We’ll use requests like this to decide what to test next.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <Field label="What do you want AI to do?" required>
        <textarea required value={query} onChange={(event) => setQuery(event.target.value)} className="field" rows={4} />
      </Field>
      <Field label="Why would this help you?">
        <textarea value={context} onChange={(event) => setContext(event.target.value)} className="field" rows={3} />
      </Field>
      <Field label="What kind of work or business is this?">
        <input value={business} onChange={(event) => setBusiness(event.target.value)} className="field" />
      </Field>
      <Field label="Email me when you test it">
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field" />
      </Field>
      {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
      <button type="submit" className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm text-white">
        {intent === "implementation" ? "Send implementation interest" : "Request this test"}
      </button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
