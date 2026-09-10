import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusMark } from "@/components/capability/status-mark";
import { getPublishedBySlug } from "@/lib/data/public-data";
import { localRecord } from "@/lib/data/public-data";
import { EVIDENCE_LABEL, STATUS_HINT, SUPERVISION_LABEL } from "@/lib/domain";
import { formatCost, formatPercent, formatRuntime, formatTestedDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const capability = await getPublishedBySlug(slug);
  if (!capability) return { title: "Capability" };
  return {
    title: `Can AI ${capability.title}? Current Capability Test`,
    description: capability.shortDescription,
  };
}

export default async function CapabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const capability = await getPublishedBySlug(slug);
  if (!capability) notFound();
  const record = localRecord(slug);
  const results = record?.suite?.results ?? [];

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
      <p className="mt-6 max-w-2xl text-lg leading-8">
        Under our current test conditions, AI completed {capability.currentSuccesses} of {capability.currentTotal} scenarios correctly.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">{STATUS_HINT[capability.status]}</p>
      <dl className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-4">
        <Stat label="Success" value={`${formatPercent(capability.currentScore)} · ${capability.currentSuccesses}/${capability.currentTotal}`} />
        <Stat label="Last tested" value={formatTestedDate(capability.lastTestedAt)} />
        <Stat label="Evidence" value={EVIDENCE_LABEL[capability.evidenceLevel]} />
        <Stat label="Supervision" value={SUPERVISION_LABEL[capability.supervisionLevel]} />
      </dl>

      <Section title="What AI can currently do">
        <ul className="list-disc space-y-2 pl-5 leading-7">
          {capability.whatAiCanDo.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">These are scenarios the latest accepted run completed. They are not a claim about every business.</p>
      </Section>

      <Section title="Keep a human involved when">
        <ul className="list-disc space-y-2 pl-5 leading-7">
          {capability.humanRequiredWhen.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="What we tested">
        <p className="leading-7">
          Each scenario starts from the Acme Services fixture, version {record?.suite?.fixtureVersion ?? "acme-v1"}. The agent gets only the tools for that task. Software then checks what actually changed. A confident message is not a pass.
        </p>
        <ul className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {results.map((result) => (
            <li key={result.scenarioId} className="py-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{result.title}</p>
                  <p className="text-[var(--muted)]">{result.scenarioId}</p>
                </div>
                <span className={result.success ? "text-[var(--green)]" : "text-[var(--red)]"}>{result.success ? "Pass" : "Fail"}</span>
              </div>
              {!result.success && result.failureExplanation ? <p className="mt-2 text-[var(--muted)]">{result.failureExplanation}</p> : null}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Results">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Successful scenarios" value={String(capability.currentSuccesses)} />
          <Stat label="Failed scenarios" value={String((capability.currentTotal ?? 0) - (capability.currentSuccesses ?? 0))} />
          <Stat label="Critical failures" value={String(capability.currentCriticalFailures)} />
          <Stat label="Median runtime" value={formatRuntime(capability.currentRuntimeSeconds)} />
          <Stat label="Model/API cost" value={formatCost(capability.currentCostUsd)} />
          <Stat label="Configuration" value={capability.modelName ?? "Not recorded"} />
        </div>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Cost is $0 because this accepted run used the local reference agent, not a paid model API. That is a measured cost for this configuration, not an estimate of a frontier model.
        </p>
      </Section>

      <Section title="Common failure modes">
        {capability.commonFailureModes.length === 0 ? (
          <p>The latest accepted run did not record a failed scenario.</p>
        ) : (
          <ol className="list-decimal space-y-3 pl-5 leading-7">
            {capability.commonFailureModes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Evidence strength">
        <p className="leading-7">
          Evidence: {EVIDENCE_LABEL[capability.evidenceLevel]}. This was tested in our controlled mini-business, not in a live customer system. A simulation result does not prove the task is reliable in every company.
        </p>
      </Section>

      <Section title="History">
        <p className="leading-7">One accepted run is on record. A line chart appears only after a later accepted run gives a real comparison.</p>
      </Section>

      <Section title="Current tested configuration">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-5">
          <p className="font-medium">Configuration A</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Model: {capability.modelName}. Tools: simulated business systems for this task. Success: {capability.currentSuccesses}/{capability.currentTotal}. Cost: {formatCost(capability.currentCostUsd)}.
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">We do not publish provider rankings from a single configuration.</p>
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
        <Link href="/request" className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm text-white">
          Request another capability
        </Link>
        <Link href={`/request?intent=implementation&capability=${capability.slug}`} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4">
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="num mt-1 text-sm">{value}</dd>
    </div>
  );
}
