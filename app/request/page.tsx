import type { Metadata } from "next";
import { RequestForm } from "@/components/request/request-form";

export const metadata: Metadata = { title: "Request a test", description: "Ask us to test a capability we have not published yet." };

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ q?: string; intent?: string; capability?: string }> }) {
  const params = await searchParams;
  return (
    <div className="site-wrap max-w-2xl py-14">
      <h1 className="serif text-4xl">Request a test</h1>
      <p className="mt-3 text-[var(--muted)]">We use requests like this to decide what to test next. We do not promise a date.</p>
      <RequestForm initialQuery={params.q ?? ""} intent={params.intent === "implementation" ? "implementation" : "test"} capability={params.capability ?? ""} />
    </div>
  );
}
