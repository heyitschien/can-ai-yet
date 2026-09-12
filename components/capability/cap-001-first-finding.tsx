import Link from "next/link";
import { StatusMark } from "@/components/capability/status-mark";
import type { PublicCapability } from "@/lib/domain";
import { EVIDENCE_LABEL, SUPERVISION_LABEL } from "@/lib/domain";
import type { Cap001FirstFinding, FirstFindingScenario } from "@/lib/evidence/first-finding";
import { formatCost, formatRuntime, formatTestedDate } from "@/lib/format";

const REPRESENTATIVE_IDS = [
  "LEAD-003",
  "LEAD-004",
  "LEAD-005",
  "LEAD-006",
  "LEAD-007",
  "LEAD-009",
  "LEAD-010",
] as const;

export function Cap001FirstFindingView({
  capability,
  finding,
}: {
  capability: PublicCapability;
  finding: Cap001FirstFinding;
}) {
  const suite = finding.suite;
  const wording = finding.publicWording;
  const byId = new Map(suite.results.map((row) => [row.scenarioId, row]));
  const representative = REPRESENTATIVE_IDS.map((id) => byId.get(id)).filter(
    (row): row is FirstFindingScenario => Boolean(row),
  );

  return (
    <article className="site-wrap py-14">
      <p className="text-sm text-[var(--muted)]">
        <Link href={`/categories/${capability.categorySlug}`}>{capability.categoryName}</Link>
        {" · "}
        {capability.code}
        {" · "}
        First public finding
      </p>

      <h1 className="serif mt-3 max-w-4xl text-4xl leading-tight sm:text-5xl">{wording.headline}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">{wording.observationLine}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <StatusMark status={capability.status} />
        <p className="num text-2xl sm:text-3xl">{wording.scoreLine}</p>
      </div>
      <p className="mt-3 inline-block rounded-lg border border-[var(--line)] bg-[var(--yellow-bg)] px-3 py-2 text-sm text-[var(--yellow)]">
        {wording.caveat}
      </p>

      <section className="mt-10 max-w-3xl">
        <h2 className="serif text-2xl">Plain-language verdict</h2>
        <p className="mt-4 leading-8">{wording.summary}</p>
        <p className="mt-4 leading-8">
          This run showed that the model could complete some ordinary cases, but it also produced serious
          identity, opt-out, and escalation failures. Based on one run, CanAIYet cannot recommend unsupervised
          delegation. More repetitions and broader coverage are required before any reliability claim.
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="serif text-2xl">What we tested</h2>
        <p className="mt-4 leading-8">
          Synthetic Acme Services environment ({suite.fixtureVersion} / {suite.environmentVersion}). The agent
          received controlled CRM, email, calendar, and policy tools for CAP-001. Software judged actual state
          changes, not prose quality alone. A confident email is not a pass if the wrong person was contacted or
          policy/state was violated.
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Frozen 12-scenario suite at run head <span className="num">{suite.gitSha.slice(0, 12)}</span>.
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="serif text-2xl">Observed result</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Passed" value={String(suite.successCount)} tone="pass" />
          <Stat label="Failed" value={String(suite.failureCount)} tone="fail" />
          <Stat label="Frozen-critical failures" value={String(suite.criticalFailureCount)} tone="critical" />
          <Stat label="Model/API cost" value={formatCost(suite.totalCostUsd)} />
          <Stat label="Provider requests" value={String(suite.provenance.requestCount)} />
          <Stat label="Tokens in / out" value={`${suite.inputTokens.toLocaleString()} / ${suite.outputTokens.toLocaleString()}`} />
          <Stat label="Median scenario runtime" value={formatRuntime(suite.medianRuntimeSeconds)} />
          <Stat label="Wall time" value="~3.3 minutes" />
          <Stat label="Last tested" value={formatTestedDate(suite.completedAt)} />
        </dl>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Counts and economics match the saved run artifact. We do not convert 4/12 into a reliability or failure
          percentage.
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="serif text-2xl">Representative failure evidence</h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Failures are not equally severe. Safety misses differ from CRM-hygiene misses.
        </p>
        <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {representative.map((row) => (
            <ScenarioRow key={row.scenarioId} row={row} />
          ))}
        </ul>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="serif text-2xl">All 12 scenario results</h2>
        <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {suite.results.map((row) => (
            <ScenarioRow key={row.scenarioId} row={row} />
          ))}
        </ul>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="serif text-2xl">Evidence and methodology</h2>
        <div className="mt-4 space-y-2 text-sm leading-7 text-[var(--muted)]">
          <p>Model: {suite.model} · Provider path: {suite.provider} pinned to Anthropic per run provenance</p>
          <p>Configuration: {capability.configurationLabel}</p>
          <p>Evidence level: {EVIDENCE_LABEL[capability.evidenceLevel]} · Supervision: {SUPERVISION_LABEL[capability.supervisionLevel]}</p>
          <p>
            Receipts: {finding.receipts.run} · {finding.receipts.wrap} · fairness {finding.receipts.fairnessGate} ·
            publication {finding.receipts.publication}
          </p>
          <p>
            Source artifact: <span className="num">{finding.sourceArtifact}</span>
          </p>
          <p>
            Durable report:{" "}
            <Link href="/methodology" className="underline">
              Methodology
            </Link>
            {" · "}
            <span className="num">docs/public/CAP-001-SONNET-4.6-FIRST-FINDING.md</span>
          </p>
        </div>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="serif text-2xl">What this does not tell us</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-7">
          <li>No real-world reliability estimate from N=1.</li>
          <li>No cross-model ranking yet.</li>
          <li>No willingness-to-pay or commercial-demand proof.</li>
          <li>No guarantee the synthetic Acme environment transfers perfectly to Salesforce, HubSpot, or other CRMs.</li>
        </ul>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="serif text-2xl">Why this finding matters</h2>
        <p className="mt-4 leading-8">
          The valuable information is not the number 4/12 by itself. The value is that we observed specific failure
          modes under controlled conditions and can show exactly what the agent changed in the simulated business
          world. That creates hypotheses we can retest and compare over time.
        </p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="serif text-2xl">Keep a human involved when</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 leading-7">
          {capability.humanRequiredWhen.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

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

function ScenarioRow({ row }: { row: FirstFindingScenario }) {
  const tone = row.success ? "pass" : row.critical ? "critical" : "fail";
  const label = row.success ? "Pass" : row.critical ? "Critical fail" : "Fail";
  return (
    <li className="py-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">
            {row.scenarioId} · {row.title}
          </p>
          <p className="mt-1 text-[var(--muted)]">{row.setup}</p>
        </div>
        <OutcomeBadge tone={tone} label={label} />
      </div>
      <p className="mt-2 text-[var(--muted)]">
        Class: {row.fairnessClass}
        {row.failureCode ? ` · ${row.failureCode}` : ""}
      </p>
      <p className="mt-1 leading-6 text-[var(--muted)]">{row.fairnessNote}</p>
      {!row.success && row.failureExplanation ? (
        <p className="mt-2 leading-6">Judge: {row.failureExplanation}</p>
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pass" | "fail" | "critical";
}) {
  const toneClass =
    tone === "pass"
      ? "border-[var(--green)]/30"
      : tone === "fail"
        ? "border-[var(--yellow)]/30"
        : tone === "critical"
          ? "border-[var(--red)]/30"
          : "border-[var(--line)]";
  return (
    <div className={`rounded-xl border bg-[var(--paper-2)] p-4 ${toneClass}`}>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="num mt-1 text-sm">{value}</dd>
    </div>
  );
}
