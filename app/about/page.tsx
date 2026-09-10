import type { Metadata } from "next";

export const metadata: Metadata = { title: "About", description: "Can AI Yet tests whether current systems can do specific work, under stated conditions." };

export default function AboutPage() {
  return (
    <article className="site-wrap max-w-3xl py-14">
      <h1 className="serif text-4xl">We measure.</h1>
      <div className="mt-6 space-y-5 leading-8">
        <p>Capability is moving faster than most people can track. Rankings and vendor pages answer a different question than the one a business actually has.</p>
        <p>The question here is simpler: can AI reliably perform this real task today, under defined conditions?</p>
        <p>We are not an AI cheerleader. We are not an AI skeptic. If a test fails, the failure stays on the page. If we have not tested something, we say so.</p>
        <p>The long-term asset is the dataset: capabilities, repeatable tests, failures, cost, time, and the evidence behind each status. The website is the public window.</p>
      </div>
    </article>
  );
}
