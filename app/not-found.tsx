import Link from "next/link";

export default function NotFound() {
  return (
    <div className="site-wrap py-20">
      <h1 className="serif text-4xl">Not on record</h1>
      <p className="mt-3 text-[var(--muted)]">That page is not a published test.</p>
      <Link href="/" className="mt-6 inline-block text-sm underline">Back to the search</Link>
    </div>
  );
}
