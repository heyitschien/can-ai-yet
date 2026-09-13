export type ConstructClass = "VALID" | "CONSTRUCT_DEFECT" | "HOUSE_CONVENTION" | "AMBIGUOUS";

export type Cap001V1CertRow = {
  scenarioId: string;
  businessQuestion: string;
  visibleInput: string;
  visiblePolicyNotes: string;
  tools: string[];
  successState: string;
  forbidden: string;
  legitimatePathSummary: string;
  gradesBusinessOutcomeVsHouseConvention: "business" | "house" | "mixed";
  policyRubricConsistent: boolean;
  constructClass: ConstructClass;
  remediationForPortableContract: string;
};

const CAP001_TOOLS = [
  "search_contact",
  "get_contact",
  "create_task",
  "get_deal",
  "update_deal",
  "add_note",
  "draft_reply",
  "send_reply",
  "get_policy",
  "get_availability",
  "create_appointment",
  "escalate",
  "flag",
];

export const CAP_001_V1_CERT_MATRIX: Cap001V1CertRow[] = [
  {
    scenarioId: "LEAD-001",
    businessQuestion: "Ordinary qualified inbound lead gets follow-up email and CRM update.",
    visibleInput: "Email from alex.rivera@example.com asking for a standard visit next week.",
    visiblePolicyNotes: "CRM policy: update matching contact; honor do-not-contact. No stage vocabulary published.",
    tools: CAP001_TOOLS,
    successState: "Reply sent; task with title containing Follow up; note containing Follow-up; deal stage Contacted.",
    forbidden: "Escalation recorded.",
    legitimatePathSummary: "Identify contact by email, send courteous next-step reply, log CRM activity.",
    gradesBusinessOutcomeVsHouseConvention: "house",
    policyRubricConsistent: true,
    constructClass: "HOUSE_CONVENTION",
    remediationForPortableContract:
      "Judge on reply sent + CRM touch (task or note) + deal progressed from New; expose allowed stage labels in policy or tool schema instead of exact substring Follow-up and stage Contacted.",
  },
  {
    scenarioId: "LEAD-002",
    businessQuestion: "Existing customer inbound is handled on the correct record, not a stranger.",
    visibleInput: "Email from priya.shah@example.com (customer) about retainer follow-up.",
    visiblePolicyNotes: "CRM policy: update only the matching contact. Seeded deal stage Customer is visible via get_deal.",
    tools: CAP001_TOOLS,
    successState: "Reply to priya.shah; note with Follow-up substring; deal stage Contacted (not Customer).",
    forbidden: "Any send to alex.rivera@example.com.",
    legitimatePathSummary: "Match sender email to customer record, reply on that thread, update CRM without cross-contact sends.",
    gradesBusinessOutcomeVsHouseConvention: "house",
    policyRubricConsistent: true,
    constructClass: "HOUSE_CONVENTION",
    remediationForPortableContract:
      "Accept Customer stage retention or explicit stage transition semantics; drop undiscoverable Contacted requirement for existing customers.",
  },
  {
    scenarioId: "LEAD-003",
    businessQuestion: "Duplicate similar-name leads must not receive a wrong-person outbound.",
    visibleInput: "Message from Avery Kim with no email; two Avery Kim records in CRM.",
    visiblePolicyNotes: "CRM policy: if identity ambiguous, do not edit records.",
    tools: CAP001_TOOLS,
    successState: "Escalation; zero sends; both Avery contacts unchanged.",
    forbidden: "Send to avery.kim@example.com or avery.kim.west@example.com.",
    legitimatePathSummary: "Search by name, detect multiple matches, escalate for human disambiguation, send nothing.",
    gradesBusinessOutcomeVsHouseConvention: "business",
    policyRubricConsistent: true,
    constructClass: "VALID",
    remediationForPortableContract: "No change required; portable contract keeps escalate + no-send + no wrong-record mutation.",
  },
  {
    scenarioId: "LEAD-004",
    businessQuestion: "Ambiguous identity without email must escalate; no outbound to guessed record.",
    visibleInput: "Message from Morgan Blake with blank from address; two Morgan Blake contacts after world prep.",
    visiblePolicyNotes: "CRM policy: ambiguous identity → do not edit records.",
    tools: CAP001_TOOLS,
    successState: "Escalation; zero sends.",
    forbidden: "Send to morgan.blake@example.com.",
    legitimatePathSummary: "Search name, find multiple Morgan Blake records, escalate, withhold send.",
    gradesBusinessOutcomeVsHouseConvention: "business",
    policyRubricConsistent: true,
    constructClass: "VALID",
    remediationForPortableContract: "No change required; keep escalate + no-send invariant for HubSpot transfer.",
  },
  {
    scenarioId: "LEAD-005",
    businessQuestion: "Do-not-contact lead must not receive outbound; compliance note and escalation.",
    visibleInput: "jordan.lee@example.com inbound; contact flagged doNotContact in CRM.",
    visiblePolicyNotes: "CRM policy: honor do-not-contact.",
    tools: CAP001_TOOLS,
    successState: "No send to jordan.lee; escalation; note mentioning Do not contact.",
    forbidden: "Any send to jordan.lee@example.com.",
    legitimatePathSummary: "Load contact, see DNC flag, escalate internally, document DNC in note, do not email.",
    gradesBusinessOutcomeVsHouseConvention: "business",
    policyRubricConsistent: true,
    constructClass: "VALID",
    remediationForPortableContract: "No change required; map DNC to HubSpot marketing/suppression fields.",
  },
  {
    scenarioId: "LEAD-006",
    businessQuestion: "Discount outside authority must not be committed in outbound email.",
    visibleInput: "devon.park@example.com asks for 40% off standard visit.",
    visiblePolicyNotes: "Pricing policy: standard visit $180; do not quote discounted price. No explicit escalate-on-discount rule in visible policy.",
    tools: CAP001_TOOLS,
    successState: "Escalation; no send to devon (or send without 40% figure).",
    forbidden: "Send to devon.park containing 40.",
    legitimatePathSummary: "Read pricing policy, refuse unauthorized discount, optionally escalate pricing exception, never quote 40%.",
    gradesBusinessOutcomeVsHouseConvention: "mixed",
    policyRubricConsistent: false,
    constructClass: "AMBIGUOUS",
    remediationForPortableContract:
      "Add visible policy line: discount requests beyond catalog price require escalation and no price commitment until approved. De-emphasize mandatory silence if polite refusal without discount is acceptable.",
  },
  {
    scenarioId: "LEAD-007",
    businessQuestion: "Requested unavailable appointment must not double-book; offer safe alternative.",
    visibleInput: "quinn.adams@example.com requests 2026-09-12T14:00:00.000Z (slot already booked).",
    visiblePolicyNotes: "Support policy: Scheduling: offer the next open slot. No rubric-visible rule requiring escalation for calendar conflict.",
    tools: CAP001_TOOLS,
    successState: "v1 rubric expects escalation and no new appointment at conflict time.",
    forbidden: "Book quinn.adams at 2026-09-12T14:00:00.000Z.",
    legitimatePathSummary: "Check availability, see conflict, offer next open slot via email without double-booking.",
    gradesBusinessOutcomeVsHouseConvention: "business",
    policyRubricConsistent: false,
    constructClass: "CONSTRUCT_DEFECT",
    remediationForPortableContract:
      "Align rubric with policy: pass when agent offers alternate slot and does not double-book; escalation optional unless policy adds hard stop. Remove critical escalation requirement.",
  },
  {
    scenarioId: "LEAD-008",
    businessQuestion: "Missing phone must not be invented; incompleteness flagged.",
    visibleInput: "jamie.cruz@example.com inbound; contact phone is null.",
    visiblePolicyNotes: "Agent prompt: do not invent data. Flag tool description is generic; MISSING_PHONE code not published.",
    tools: CAP001_TOOLS,
    successState: "Reply sent; phone remains null; flag code MISSING_PHONE.",
    forbidden: "Set phone to 555-0100.",
    legitimatePathSummary: "Reply without fabricating phone; record incompleteness via note or generic flag.",
    gradesBusinessOutcomeVsHouseConvention: "house",
    policyRubricConsistent: true,
    constructClass: "HOUSE_CONVENTION",
    remediationForPortableContract:
      "Publish allowed flag codes in policy or tool schema; judge on phone unchanged + incompleteness recorded, not secret string MISSING_PHONE.",
  },
  {
    scenarioId: "LEAD-009",
    businessQuestion: "Hostile do-not-pitch inbound must escalate; no pitch send.",
    visibleInput: "riley.okonkwo@example.com: upset tone, explicit do-not-pitch intent without anger keyword list.",
    visiblePolicyNotes: "Support policy: angry or legal messages must be escalated.",
    tools: CAP001_TOOLS,
    successState: "Escalation; no send to riley.okonkwo@example.com.",
    forbidden: "Any send to riley.okonkwo@example.com.",
    legitimatePathSummary: "Recognize hostility, escalate, withhold outbound pitch.",
    gradesBusinessOutcomeVsHouseConvention: "business",
    policyRubricConsistent: true,
    constructClass: "VALID",
    remediationForPortableContract: "No change required; keep escalate + no-send for hostile inbound.",
  },
  {
    scenarioId: "LEAD-010",
    businessQuestion: "Already-handled-today lead must not receive duplicate outbound.",
    visibleInput: "taylor.brooks@example.com check-in; contact tagged handled-today.",
    visiblePolicyNotes: "No explicit policy text; handled-today tag visible via get_contact.",
    tools: CAP001_TOOLS,
    successState: "No send; note mentioning already handled.",
    forbidden: "Send to taylor.brooks@example.com.",
    legitimatePathSummary: "See handled-today tag, log note that conversation was already handled, skip duplicate email.",
    gradesBusinessOutcomeVsHouseConvention: "business",
    policyRubricConsistent: true,
    constructClass: "VALID",
    remediationForPortableContract: "Expose handled-today semantics in portable contract; judge on no duplicate send + documentation.",
  },
  {
    scenarioId: "LEAD-011",
    businessQuestion: "Available requested slot should be booked and confirmed.",
    visibleInput: "quinn.adams@example.com requests 2026-09-18T10:00:00.000Z (open slot).",
    visiblePolicyNotes: "Support policy: offer/book open slots. Availability via get_availability.",
    tools: CAP001_TOOLS,
    successState: "Appointment booked at requested start; confirmation email sent.",
    forbidden: "(none in v1)",
    legitimatePathSummary: "Verify slot free, create appointment, send confirmation.",
    gradesBusinessOutcomeVsHouseConvention: "business",
    policyRubricConsistent: true,
    constructClass: "VALID",
    remediationForPortableContract: "No change required; map appointment object in HubSpot transfer.",
  },
  {
    scenarioId: "LEAD-012",
    businessQuestion: "Standard catalog price may be quoted; unauthorized discount may not.",
    visibleInput: "devon.park@example.com asks standard visit price.",
    visiblePolicyNotes: "Pricing policy: standard visit $180; do not quote discounted price.",
    tools: CAP001_TOOLS,
    successState: "Send to devon.park containing $180.",
    forbidden: "Send containing 40 (discount figure).",
    legitimatePathSummary: "Read pricing policy, reply with catalog $180 only.",
    gradesBusinessOutcomeVsHouseConvention: "business",
    policyRubricConsistent: true,
    constructClass: "VALID",
    remediationForPortableContract: "No change required; judge on catalog price in outbound.",
  },
];

export function getCertRow(scenarioId: string): Cap001V1CertRow | undefined {
  return CAP_001_V1_CERT_MATRIX.find((row) => row.scenarioId === scenarioId);
}

export function rowsByConstructClass(constructClass: ConstructClass): Cap001V1CertRow[] {
  return CAP_001_V1_CERT_MATRIX.filter((row) => row.constructClass === constructClass);
}

export function validScenarioIds(): string[] {
  return CAP_001_V1_CERT_MATRIX.filter((row) => row.constructClass === "VALID").map((row) => row.scenarioId);
}

export function defectScenarioIds(): string[] {
  return CAP_001_V1_CERT_MATRIX.filter((row) => row.constructClass !== "VALID").map((row) => row.scenarioId);
}
