import Link from "next/link";
import { StatusMark } from "@/components/capability/status-mark";
import type { PublicCapability } from "@/lib/domain";
import { EVIDENCE_LABEL } from "@/lib/domain";
import type { Cap001FirstFinding, FirstFindingScenario } from "@/lib/evidence/first-finding";
import { formatTestedDate } from "@/lib/format";

function formatExactCost(value: number): string {
  return `$${value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
}

/** Rows that deserve emphasis inside the single canonical scenario list. */
const EMPHASIZED = new Set(["LEAD-003", "LEAD-006", "LEAD-007", "LEAD-009"]);

export function Cap001FirstFindingView({
  capability,
  finding,
}: {
  capability: PublicCapability;
  finding: Cap001FirstFinding;
}) {
  const suite = finding.suite;
  const passed = suite.results.filter((row) => row.success);
  const humanNeeded = [
    "Identity was ambiguous or matched more than one CRM record (LEAD-003 / LEAD-004 contrast).",
    "A person asked not to be contacted or said not to be pitched (LEAD-005 pass · LEAD-009 fail).",
    "Policy exceptions or unavailable appointments still required escalation, not just a polite reply (LEAD-006 · LEAD-007).",
    "A lead already handled today should not restart outreach (LEAD-010).",
  ];

  return (
    <article className="site-wrap py-14">
      <p className="text-sm text-[var(--muted)]">
        <Link href={`/categories/${capability.categorySlug}`}>{capability.categoryName}</Link>
        {" · "}
        {capability.code}
      </p>

      <h1 className="serif mt-3 max-w-3xl text-4xl leading-tight sm:text-5xl">{capability.title}</h1>

      <div className="mt-5">
        <StatusMark status={capability.status} />
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">Latest accepted observation · Claude Sonnet 4.6</p>

      <p className="mt-6 max-w-2xl text-lg leading-8">
        In one frozen run, Claude Sonnet 4.6 completed {suite.successCount} of {suite.totalCount} scenarios correctly.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">Single frozen run · not a reliability estimate</p>

      <dl className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-4">
        <SummaryCard label="Observed result" value={`${suite.successCount} / ${suite.totalCount} passed`} />
        <SummaryCard label="Frozen-critical failures" value={`${suite.criticalFailureCount} observed`} />
        <SummaryCard label="Last tested" value={formatTestedDate(suite.completedAt)} />
        <SummaryCard label="Evidence" value={EVIDENCE_LABEL[capability.evidenceLevel]} />
      </dl>
      <p className="mt-4 max-w-3xl text-sm text-[var(--muted)]">
        Model {suite.model} · measured API cost {formatExactCost(suite.totalCostUsd)} · wall time ~3.3 minutes
      </p>

      <Section title="What worked in this run">
        <ul className="list-disc space-y-2 pl-5 leading-7">
          {passed.map((row) => (
            <li key={row.scenarioId}>
              <span className="font-medium">{row.title}</span>
              <span className="text-[var(--muted)]"> — {row.fairnessNote}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">
          These are behaviors observed in this single frozen run. They are not a claim about every business or every
          future trial.
        </p>
      </Section>

      <Section title="Where this run showed a human was needed">
        <ul className="list-disc space-y-2 pl-5 leading-7">
          {humanNeeded.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Failures are not equally severe. Safety and escalation misses differ from CRM-hygiene misses.
        </p>
      </Section>

      <Section title="What we tested">
        <p className="leading-7">
          Each scenario starts from the Acme Services fixture ({suite.fixtureVersion}). The agent gets only the tools
          for that task. Software then checks what actually changed. A confident message is not a pass.
        </p>
        <ul className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {suite.results.map((row) => (
            <ScenarioRow key={row.scenarioId} row={row} emphasized={EMPHASIZED.has(row.scenarioId)} />
          ))}
        </ul>
      </Section>

      <Section title="Results">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Passed" value={String(suite.successCount)} />
          <SummaryCard label="Failed" value={String(suite.failureCount)} />
          <SummaryCard label="Frozen-critical" value={String(suite.criticalFailureCount)} />
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Measured model/API cost {formatExactCost(suite.totalCostUsd)} · wall time ~3.3 minutes · {suite.provenance.requestCount}{" "}
          provider requests. We do not convert 4/12 into a reliability or failure percentage.
        </p>
        <details className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4 text-sm text-[var(--muted)]">
          <summary className="cursor-pointer text-[var(--ink)]">View technical details</summary>
          <div className="mt-3 space-y-1 leading-6">
            <p>
              Tokens in/out: {suite.inputTokens.toLocaleString()} / {suite.outputTokens.toLocaleString()}
            </p>
            <p>
              Run head: <span className="num">{suite.gitSha}</span>
            </p>
            <p>
              Environment: {suite.fixtureVersion} / {suite.environmentVersion}
            </p>
            <p>
              Provider path: {suite.provider} · served {suite.provenance.servedProviderUnique.join(", ")}
            </p>
            <p>
              Receipts: {finding.receipts.run} · {finding.receipts.wrap} · fairness {finding.receipts.fairnessGate} ·
              publication {finding.receipts.publication}
            </p>
            <p>
              Source artifact: <span className="num">{finding.sourceArtifact}</span>
            </p>
          </div>
        </details>
      </Section>

      <Section title="Evidence strength">
        <div className="space-y-5 leading-7">
          <div>
            <h3 className="font-medium">What we observed</h3>
            <p className="mt-2 text-[var(--muted)]">
              In this frozen simulated run, the model completed some ordinary booking and pricing cases, respected some
              do-not-contact and ambiguity paths, and also produced wrong-person, opt-out, and missed-escalation
              failures under the suite’s critical criteria.
            </p>
          </div>
          <div>
            <h3 className="font-medium">What it suggests</h3>
            <p className="mt-2 text-[var(--muted)]">
              The useful signal is the failure-mode map: identity ambiguity, opt-out handling, and escalation
              discipline are boundaries worth retesting and comparing across models and versions.
            </p>
          </div>
          <div>
            <h3 className="font-medium">What it does not prove</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-[var(--muted)]">
              <li>No real-world reliability estimate from one run.</li>
              <li>No cross-model ranking yet.</li>
              <li>No production guarantee for Salesforce, HubSpot, or other live CRMs.</li>
              <li>No commercial-demand or willingness-to-pay proof.</li>
            </ul>
          </div>
          <p>
            <Link href="/methodology" className="underline">
              How a scenario passes or fails
            </Link>
            {" · "}
            <span className="text-sm text-[var(--muted)]">docs/public/CAP-001-SONNET-4.6-FIRST-FINDING.md</span>
          </p>
        </div>
      </Section>

      <Section title="History">
        <p className="leading-7">
          One accepted frontier-model observation is on record for this capability. A comparison chart appears after a
          later accepted run gives a real second point.
        </p>
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4 text-sm leading-6">
          <p className="font-medium">2026-09-11 · Claude Sonnet 4.6</p>
          <p className="mt-1 text-[var(--muted)]">
            {suite.successCount}/{suite.totalCount} passed · {suite.criticalFailureCount} frozen-critical ·{" "}
            {formatExactCost(suite.totalCostUsd)}
          </p>
        </div>
      </Section>

      <Section title="Tested configuration">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
          <p className="font-medium">Claude Sonnet 4.6</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            OpenRouter path pinned to Anthropic · controlled Acme Services simulation · frozen CAP-001 suite · 12
            scenarios · single run · fairness gate {finding.receipts.fairnessGate} accepted for evidence use.
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            We do not publish provider rankings from a single configuration.
          </p>
        </div>
      </Section>

      <Section title="Implementation blueprint">
        <ol className="space-y-2">
          {capability.implementationBlueprint.map((step, index) => (
            <li key={step.label} className="flex items-center gap-3 text-sm">
              <span className="num w-6 text-[var(--muted)]">{index + 1}</span>
              {step.label}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Methodology">
        <p>
          <Link href="/methodology" className="underline">
            How a scenario passes or fails
          </Link>
        </p>
      </Section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/request" className="solid-control rounded-xl px-4 py-3 text-sm">
          Request another capability
        </Link>
        <Link
          href={`/request?intent=implementation&capability=${capability.slug}`}
          className="quiet-control rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
        >
          I want to implement this
        </Link>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 max-w-3xl">
      <h2 className="serif text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4">
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="num mt-1 text-sm">{value}</dd>
    </div>
  );
}

function ScenarioRow({ row, emphasized }: { row: FirstFindingScenario; emphasized: boolean }) {
  const tone = row.success ? "pass" : row.critical ? "critical" : "fail";
  const label = row.success ? "Pass" : row.critical ? "Critical fail" : "Fail";
  return (
    <li className={`py-3 text-sm ${emphasized ? "bg-[var(--paper-2)]/70" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">
            {row.scenarioId} · {row.title}
          </p>
          <p className="mt-1 text-[var(--muted)]">{row.setup}</p>
        </div>
        <OutcomeBadge tone={tone} label={label} />
      </div>
      <p className="mt-2 leading-6 text-[var(--muted)]">{row.fairnessNote}</p>
      {!row.success && row.failureExplanation ? (
        <p className="mt-1 leading-6 text-[var(--muted)]">Judge: {row.failureExplanation}</p>
      ) : null}
    </li>
  );
}

function OutcomeBadge({ tone, label }: { tone: "pass" | "fail" | "critical"; label: string }) {
  const className =
    tone === "pass"
      ? "bg-[var(--green-bg)] text-[var(--green)]"
      : tone === "critical"
        ? "bg-[var(--red-bg)] text-[var(--red)]"
        : "bg-[var(--yellow-bg)] text-[var(--yellow)]";
  return <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
