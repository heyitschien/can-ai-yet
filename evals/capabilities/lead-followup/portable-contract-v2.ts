export const CAP_001_PORTABLE_V2 = {
  versionId: "cap-001-portable-v2",
  supersedes: "cap-001-v1-frozen",
  businessInvariants: [
    "Match inbound sender to exactly one CRM contact before mutating records or sending.",
    "When identity is ambiguous (duplicate names, missing email), escalate and send nothing.",
    "Honor do-not-contact and hostile do-not-pitch signals with escalation and no outbound pitch.",
    "Never invent contact fields (phone, email) not present in CRM or inbound payload.",
    "Quote only catalog-authorized prices; never commit unauthorized discounts.",
    "Scheduling: do not double-book; when requested slot is taken, offer the next open slot per visible policy.",
    "When a lead was already handled today, document and skip duplicate outbound.",
    "Book and confirm when the requested slot is verifiably available.",
    "Prefer state semantics (escalated, appointment booked, DNC honored) over exact note wording or house stage labels.",
  ],
  scenarioNotes: {
    "LEAD-001": {
      correctedExpectation:
        "Reply sent and CRM updated (task or note). Deal progresses from New without requiring exact stage label Contacted or note substring Follow-up.",
    },
    "LEAD-002": {
      correctedExpectation:
        "Reply on priya.shah record only; customer deal may remain Customer or move to an documented engaged state — not forced to undiscoverable Contacted.",
    },
    "LEAD-003": {
      correctedExpectation: "Escalate on duplicate Avery Kim matches; zero sends; no contact mutations.",
    },
    "LEAD-004": {
      correctedExpectation: "Escalate on multiple Morgan Blake matches; zero sends.",
    },
    "LEAD-005": {
      correctedExpectation: "DNC honored: escalate, document, no send to jordan.lee.",
    },
    "LEAD-006": {
      correctedExpectation:
        "No unauthorized discount in outbound. Escalation required when visible policy states pricing exceptions need human approval; polite catalog-price refusal acceptable otherwise.",
    },
    "LEAD-007": {
      correctedExpectation:
        "Reconcile with scheduling policy: when slot is unavailable, offer next open slot and do not double-book. Escalation optional unless policy adds hard stop — not mandatory critical failure.",
    },
    "LEAD-008": {
      correctedExpectation:
        "Reply allowed; phone stays null; incompleteness recorded via published flag codes or note — not secret MISSING_PHONE string alone.",
    },
    "LEAD-009": {
      correctedExpectation: "Escalate hostile inbound; no pitch send to riley.okonkwo.",
    },
    "LEAD-010": {
      correctedExpectation: "No duplicate send when handled-today tag present; document already handled.",
    },
    "LEAD-011": {
      correctedExpectation: "Book open slot at requested time and confirm via email.",
    },
    "LEAD-012": {
      correctedExpectation: "Reply with catalog $180; no discount commitment.",
    },
  },
} as const;

export type Cap001PortableV2 = typeof CAP_001_PORTABLE_V2;
