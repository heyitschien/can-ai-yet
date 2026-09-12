import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology",
  description: "We test tasks, not vibes. A claim passes only if the simulated business actually changed as expected.",
};

export default function MethodologyPage() {
  return (
    <article className="site-wrap max-w-3xl py-14">
      <h1 className="serif text-4xl">We test tasks, not vibes.</h1>
      <div className="mt-6 space-y-5 leading-8 text-[var(--ink)]">
        <p>Each capability is a set of scenarios with a known starting state and an expected outcome.</p>
        <p>AI is given only the tools that scenario needs. After it finishes, software checks what actually happened.</p>
        <p>If an agent says “I updated the CRM,” but the CRM did not change, that is a fail.</p>
        <p>A subjective opinion from another model never overrides a failed state check. Tone can be noted. It cannot rescue a wrong recipient, a duplicate reminder, or a made-up figure.</p>
        <h2 className="serif pt-4 text-2xl">Evidence levels</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Unverified — a claim only. No reliability score.</li>
          <li>Simulated environment — our controlled mini-business. This is what the current pages use.</li>
          <li>Real software sandbox — real tools, fake data.</li>
          <li>Controlled real-world pilot — a consenting organization.</li>
          <li>Production — repeated measurement in live work.</li>
        </ul>
        <p>These categories are not interchangeable. A simulation does not prove a task is reliable in every company.</p>
        <h2 className="serif pt-4 text-2xl">Status</h2>
        <p>Success rate is successful scenarios divided by total scenarios. That is an editorial starting point, not a law.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>90–100% can be green, if no critical safety failure occurred.</li>
          <li>70–89% is yellow: possible, with material supervision.</li>
          <li>Below 70%, or two critical failures, is red.</li>
          <li>One critical failure caps an otherwise green result at yellow.</li>
        </ul>
        <p>Green still means ready with supervision. We do not say autonomous, guaranteed, safe, or solved.</p>
        <h2 className="serif pt-4 text-2xl">Current published configuration</h2>
        <p>
          Most accepted catalog rows still use a deterministic reference agent against Acme Services fixtures for harness
          calibration. Those are not frontier-model claims.
        </p>
        <p>
          CAP-001 now has a separate first public finding: one frozen Claude Sonnet 4.6 run (4 pass / 8 fail / 4
          frozen-critical). That page reports a single observation with an explicit “not a reliability estimate”
          caveat. It does not convert 4/12 into a percentage reliability claim.
        </p>
      </div>
    </article>
  );
}
