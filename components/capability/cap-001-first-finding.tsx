"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusMark } from "@/components/capability/status-mark";
import type { PublicCapability } from "@/lib/domain";
import { EVIDENCE_LABEL } from "@/lib/domain";
import type {
  Cap001ConfigObservation,
  Cap001ReportBundle,
  Cap001ReportView,
  Cap001ScenarioCompareRow,
} from "@/lib/evidence/cap-001-report";
import type { FirstFindingScenario } from "@/lib/evidence/first-finding";
import { formatTestedDate } from "@/lib/format";
import type { ConstructClass } from "@/evals/certification/cap-001-v1-matrix";

function formatExactCost(value: number): string {
  return `$${value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
}

const EMPHASIZED = new Set(["LEAD-003", "LEAD-005", "LEAD-006", "LEAD-007", "LEAD-009"]);

export function Cap001FirstFindingView({
  capability,
  bundle,
}: {
  capability: PublicCapability;
  bundle: Cap001ReportBundle;
}) {
  const [view, setView] = useState<Cap001ReportView>("overview");
  const suite = bundle.sonnet.suite;

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

      <p className="mt-4 text-sm text-[var(--muted)]">
        Capability report · CAP-001 v1 synthetic lab · configurations are single-run observations
      </p>

      <p className="mt-6 max-w-2xl text-lg leading-8">{bundle.framing}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">Not a reliability estimate · not a model ranking</p>

      <div className="mt-8 flex flex-wrap gap-2">
        <ViewTab active={view === "overview"} onClick={() => setView("overview")} label="Overview" />
        <ViewTab active={view === "compare"} onClick={() => setView("compare")} label="Compare configurations" />
      </div>

      {view === "overview" ? (
        <OverviewBody capability={capability} bundle={bundle} suite={suite} />
      ) : (
        <CompareBody bundle={bundle} />
      )}
    </article>
  );
}

function OverviewBody({
  capability,
  bundle,
  suite,
}: {
  capability: PublicCapability;
  bundle: Cap001ReportBundle;
  suite: Cap001ConfigObservation["suite"];
}) {
  const validCritical = bundle.compareRows.filter(
    (row) =>
      row.constructClass === "VALID" &&
      ((row.sonnet && !row.sonnet.success && row.sonnet.critical) ||
        (row.gpt && !row.gpt.success && row.gpt.critical)),
  );

  return (
    <>
      <dl className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-4">
        <SummaryCard label="Primary config" value="Sonnet 4.6" />
        <SummaryCard label="Historical raw result" value={`${suite.successCount} / ${suite.totalCount} passed`} />
        <SummaryCard label="Last tested" value={formatTestedDate(suite.completedAt)} />
        <SummaryCard label="Evidence" value={EVIDENCE_LABEL[capability.evidenceLevel]} />
      </dl>
      <p className="mt-4 max-w-3xl text-sm text-[var(--muted)]">
        Model {suite.model} · measured API cost {formatExactCost(suite.totalCostUsd)} · CAP-001 v1 historical suite
        labels retained
      </p>

      <Section title="Observed configurations">
        <div className="grid gap-4 sm:grid-cols-2">
          <ConfigCard config={bundle.sonnet} />
          {bundle.gpt ? <ConfigCard config={bundle.gpt} /> : null}
        </div>
      </Section>

      <Section title="What this run shows about trust boundaries">
        <ul className="list-disc space-y-2 pl-5 leading-7">
          {validCritical.map((row) => (
            <li key={row.scenarioId}>
              <span className="font-medium">
                {row.scenarioId} · {row.title}
              </span>
              <span className="text-[var(--muted)]"> — {row.businessQuestion}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Emphasizing VALID construct scenarios. House-convention and construct-defect fails are not treated as clean
          model verdicts here.
        </p>
      </Section>

      <Section title="Shared observations">
        <ul className="list-disc space-y-2 pl-5 leading-7">
          {bundle.sharedSafetyNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="Differences observed">
        <ul className="list-disc space-y-2 pl-5 leading-7">
          {bundle.differenceNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">Differences are inspectable; they are not a winner declaration.</p>
      </Section>

      <Section title="Known benchmark limitations">
        <ul className="list-disc space-y-2 pl-5 leading-7 text-[var(--muted)]">
          {bundle.limitationNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="What we tested (Sonnet historical list)">
        <p className="leading-7">
          Each scenario starts from the Acme Services fixture ({suite.fixtureVersion}). The agent gets only the tools
          for that task. Software then checks what actually changed. A confident message is not a pass.
        </p>
        <ul className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {suite.results.map((row) => (
            <ScenarioRow
              key={row.scenarioId}
              row={row}
              constructClass={bundle.compareRows.find((c) => c.scenarioId === row.scenarioId)?.constructClass}
              emphasized={EMPHASIZED.has(row.scenarioId)}
            />
          ))}
        </ul>
      </Section>

      <Section title="Technical receipts">
        <details className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4 text-sm text-[var(--muted)]">
          <summary className="cursor-pointer text-[var(--ink)]">Sonnet 4.6 receipt</summary>
          <ReceiptDetails config={bundle.sonnet} />
        </details>
        {bundle.gpt ? (
          <details className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4 text-sm text-[var(--muted)]">
            <summary className="cursor-pointer text-[var(--ink)]">GPT-5.5 receipt (unpublished)</summary>
            <ReceiptDetails config={bundle.gpt} />
          </details>
        ) : null}
      </Section>

      <Section title="Evidence strength">
        <div className="space-y-5 leading-7">
          <div>
            <h3 className="font-medium">What we observed</h3>
            <p className="mt-2 text-[var(--muted)]">
              Under CAP-001 v1, identity ambiguity and do-not-pitch handling remain the clearest VALID trust-boundary
              signals. Several other suite-labeled failures are known construct limitations.
            </p>
          </div>
          <div>
            <h3 className="font-medium">What it does not prove</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-[var(--muted)]">
              <li>No real-world reliability estimate from one run per configuration.</li>
              <li>No claim that one model beats another.</li>
              <li>No production guarantee for HubSpot or other live CRMs.</li>
            </ul>
          </div>
          <p>
            <Link href="/methodology" className="underline">
              How a scenario passes or fails
            </Link>
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
    </>
  );
}

function CompareBody({ bundle }: { bundle: Cap001ReportBundle }) {
  return (
    <>
      <Section title="Configuration cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <ConfigCard config={bundle.sonnet} />
          {bundle.gpt ? <ConfigCard config={bundle.gpt} /> : <p className="text-sm text-[var(--muted)]">GPT companion missing.</p>}
        </div>
      </Section>

      <Section title="Scenario comparison">
        <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {bundle.compareRows.map((row) => (
            <CompareRow key={row.scenarioId} row={row} />
          ))}
        </ul>
      </Section>

      <Section title="How to read this">
        <p className="leading-7 text-[var(--muted)]">
          Raw suite counts are historical CAP-001 v1 outputs. Construct badges mark whether the scenario is a fair
          business question (`VALID`), a known rubric/policy conflict (`CONSTRUCT_DEFECT`), hidden vocabulary
          (`HOUSE_CONVENTION`), or contested (`AMBIGUOUS`).
        </p>
      </Section>
    </>
  );
}

function ConfigCard({ config }: { config: Cap001ConfigObservation }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
      <p className="font-medium">{config.label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {config.badges.map((badge) => (
          <span key={badge} className="rounded-md border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
            {badge}
          </span>
        ))}
      </div>
      <p className="num mt-3 text-sm">
        Historical raw: {config.suite.successCount}/{config.suite.totalCount} passed · {config.suite.criticalFailureCount}{" "}
        suite-critical
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {formatExactCost(config.suite.totalCostUsd)} · {config.modelDisplay}
      </p>
    </div>
  );
}

function CompareRow({ row }: { row: Cap001ScenarioCompareRow }) {
  return (
    <li className={`py-4 text-sm ${EMPHASIZED.has(row.scenarioId) ? "bg-[var(--paper-2)]/70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="font-medium">
            {row.scenarioId} · {row.title}
          </p>
          <p className="mt-1 text-[var(--muted)]">{row.businessQuestion}</p>
        </div>
        <ConstructBadge constructClass={row.constructClass} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <OutcomeBlock label="Sonnet 4.6" row={row.sonnet} />
        <OutcomeBlock label="GPT-5.5" row={row.gpt} />
      </div>
      <p className="mt-3 leading-6 text-[var(--muted)]">{row.interpretation}</p>
    </li>
  );
}

function OutcomeBlock({ label, row }: { label: string; row: FirstFindingScenario | null }) {
  if (!row) return <p className="text-[var(--muted)]">{label}: n/a</p>;
  const tone = row.success ? "pass" : row.critical ? "critical" : "fail";
  const text = row.success ? "Pass" : row.critical ? "Critical fail" : "Fail";
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <OutcomeBadge tone={tone} label={text} />
        <span className="text-[var(--muted)]">{row.failureCode ?? "—"}</span>
      </div>
    </div>
  );
}

function ScenarioRow({
  row,
  constructClass,
  emphasized,
}: {
  row: FirstFindingScenario;
  constructClass?: ConstructClass;
  emphasized: boolean;
}) {
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
        <div className="flex flex-col items-end gap-2">
          <OutcomeBadge tone={tone} label={label} />
          {constructClass ? <ConstructBadge constructClass={constructClass} /> : null}
        </div>
      </div>
      <p className="mt-2 leading-6 text-[var(--muted)]">{row.fairnessNote}</p>
    </li>
  );
}

function ReceiptDetails({ config }: { config: Cap001ConfigObservation }) {
  const suite = config.suite;
  return (
    <div className="mt-3 space-y-1 leading-6">
      <p>Requested/served: {suite.provenance.requestedModel} / {suite.provenance.servedModelUnique.join(", ")}</p>
      <p>Provider: {suite.provider} · {suite.provenance.servedProviderUnique.join(", ")}</p>
      <p>
        Benchmark/version: CAP-001 v1 · fixture {suite.fixtureVersion} · env {suite.environmentVersion}
      </p>
      <p>
        Head: <span className="num">{suite.gitSha}</span>
      </p>
      <p>
        Tokens in/out: {suite.inputTokens.toLocaleString()} / {suite.outputTokens.toLocaleString()} · cost{" "}
        {formatExactCost(suite.totalCostUsd)}
      </p>
      <p>Execution valid flag: {String(suite.benchmarkValid)} · construct status: see certification matrix</p>
      <p>
        Source: <span className="num">{config.sourceArtifact}</span>
      </p>
    </div>
  );
}

function ViewTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm ${
        active ? "solid-control" : "quiet-control border border-[var(--line)]"
      }`}
    >
      {label}
    </button>
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

function ConstructBadge({ constructClass }: { constructClass: ConstructClass }) {
  const label =
    constructClass === "VALID"
      ? "valid"
      : constructClass === "CONSTRUCT_DEFECT"
        ? "known defect"
        : constructClass === "HOUSE_CONVENTION"
          ? "house convention"
          : "ambiguous";
  return (
    <span className="shrink-0 rounded-md border border-[var(--line)] px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
      {label}
    </span>
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
