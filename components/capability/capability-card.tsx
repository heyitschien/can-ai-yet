import Link from "next/link";
import { EVIDENCE_LABEL, SUPERVISION_LABEL, type PublicCapability } from "@/lib/domain";
import { formatPercent, formatTestedDate } from "@/lib/format";
import { StatusMark } from "@/components/capability/status-mark";
import { CAP_001_FIRST_FINDING_SLUG } from "@/lib/evidence/first-finding";

export function CapabilityCard({ capability }: { capability: PublicCapability }) {
  const isFirstFinding = capability.slug === CAP_001_FIRST_FINDING_SLUG;
  const scoreLabel = isFirstFinding ? "Observed" : "Score";
  const scoreValue =
    isFirstFinding && capability.currentSuccesses != null && capability.currentTotal != null
      ? `${capability.currentSuccesses}/${capability.currentTotal}`
      : formatPercent(capability.currentScore);

  return (
    <Link
      href={`/capabilities/${capability.slug}`}
      className="surface-card block rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="serif text-xl leading-tight">{capability.title}</h3>
        <StatusMark status={capability.status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{capability.shortDescription}</p>
      {isFirstFinding ? (
        <p className="mt-3 text-xs text-[var(--yellow)]">Single frozen run — not a reliability estimate</p>
      ) : null}
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[var(--muted)]">{scoreLabel}</dt>
          <dd className="num mt-1 text-lg">{scoreValue}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Supervision</dt>
          <dd className="mt-1">{SUPERVISION_LABEL[capability.supervisionLevel]}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Last tested</dt>
          <dd className="mt-1">{formatTestedDate(capability.lastTestedAt)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Evidence</dt>
          <dd className="mt-1">{EVIDENCE_LABEL[capability.evidenceLevel]}</dd>
        </div>
      </dl>
    </Link>
  );
}
