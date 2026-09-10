import type { Metadata } from "next";

export const metadata: Metadata = { title: "Updates", description: "Published changes to tested capabilities." };

export default function UpdatesPage() {
  return (
    <div className="site-wrap max-w-3xl py-14">
      <h1 className="serif text-4xl">Updates</h1>
      <p className="mt-4 leading-7 text-[var(--muted)]">
        No later accepted run has changed a published score yet. This page stays empty rather than implying a trend.
      </p>
    </div>
  );
}
