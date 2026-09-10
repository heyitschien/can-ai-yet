import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", description: "What Can AI Yet stores when you search or request a test." };

export default function PrivacyPage() {
  return (
    <article className="site-wrap max-w-3xl py-14">
      <h1 className="serif text-4xl">Privacy</h1>
      <div className="mt-6 space-y-5 leading-8">
        <p>Search queries and capability views can be stored so we can see which work people want tested. That includes zero-result searches. They are a demand signal, not a profile of you.</p>
        <p>A request form may include an optional email. We use it only to say when that capability is tested. We do not sell it.</p>
        <p>The laboratory uses fictional Acme Services records. It does not contain real customer data.</p>
        <p>We do not publish private traces, secrets, or model keys.</p>
      </div>
    </article>
  );
}
