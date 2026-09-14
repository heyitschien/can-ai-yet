import {
  CAP001_SEED_APPOINTMENTS,
  CAP001_SEED_CONTACTS,
  CAP001_SEED_DEALS,
} from "@/evals/hubspot/cap001/seed-graph";
import type {
  Cap001ObjectFamily,
  HubSpotCap001EnvironmentPort,
  HubSpotCap001EnvResult,
} from "@/evals/hubspot/cap001/port";
import type {
  HubSpotCap001Appointment,
  HubSpotCap001Contact,
  HubSpotCap001Deal,
  HubSpotCap001Escalation,
  HubSpotCap001Flag,
  HubSpotCap001Note,
  HubSpotCap001Outbound,
  HubSpotCap001State,
  HubSpotCap001Task,
} from "@/evals/hubspot/cap001/types";

const BASELINE_CONTACT_IDS = new Set(CAP001_SEED_CONTACTS.map((row) => row.cayFixtureId));
const BASELINE_DEAL_IDS = new Set(CAP001_SEED_DEALS.map((row) => row.cayFixtureId));
const BASELINE_APPT_IDS = new Set(CAP001_SEED_APPOINTMENTS.map((row) => row.cayFixtureId));

/**
 * In-memory mock HubSpot CAP-001 environment (calibration harness).
 * Not a live HubSpot adapter — see LiveHubSpotCap001Adapter for the live port.
 */
export class HubSpotCap001Store implements HubSpotCap001EnvironmentPort {
  readonly kind = "mock" as const;
  private runId = "unseeded";
  private contacts: HubSpotCap001Contact[] = [];
  private deals: HubSpotCap001Deal[] = [];
  private notes: HubSpotCap001Note[] = [];
  private tasks: HubSpotCap001Task[] = [];
  private outbounds: HubSpotCap001Outbound[] = [];
  private escalations: HubSpotCap001Escalation[] = [];
  private flags: HubSpotCap001Flag[] = [];
  private appointments: HubSpotCap001Appointment[] = [];
  private snapshotLagReadsRemaining = 0;
  private omitFamiliesOnRead: Set<Cap001ObjectFamily> = new Set();

  get currentRunId(): string {
    return this.runId;
  }

  supportedFamilies(): ReadonlySet<Cap001ObjectFamily> {
    return new Set([
      "contacts",
      "deals",
      "notes",
      "tasks",
      "outbounds",
      "escalations",
      "flags",
      "appointments",
    ]);
  }

  /**
   * Seed/reset shared baseline.
   * Idempotent for the SAME runId: removes all scenario-owned mutable state
   * (including scenario appointments) and restores exact baseline fixtures.
   */
  async seedBaseline(runId: string): Promise<HubSpotCap001EnvResult<{ runId: string }>> {
    this.runId = runId;
    this.clearScenarioOwnedState();
    this.retainOnlyBaselineFixtures();

    for (const spec of CAP001_SEED_CONTACTS) {
      this.upsertContact({
        cayFixtureId: spec.cayFixtureId,
        cayRunId: runId,
        cayScenarioId: null,
        email: spec.email,
        firstName: spec.firstName,
        lastName: spec.lastName,
        phone: spec.phone,
        company: spec.company,
        status: spec.status,
        doNotContact: spec.doNotContact,
        tags: [...spec.tags],
        owner: "sam@acme.example",
        archived: false,
      });
    }
    for (const spec of CAP001_SEED_DEALS) {
      this.upsertDeal({
        cayFixtureId: spec.cayFixtureId,
        cayRunId: runId,
        cayScenarioId: null,
        name: spec.name,
        contactEmail: spec.contactEmail,
        stage: spec.stage,
        value: spec.value,
        archived: false,
      });
    }
    for (const spec of CAP001_SEED_APPOINTMENTS) {
      this.upsertAppointment({
        cayFixtureId: spec.cayFixtureId,
        cayRunId: runId,
        cayScenarioId: null,
        contactEmail: spec.contactEmail,
        title: spec.title,
        start: spec.start,
        end: spec.end,
        status: "booked",
        archived: false,
      });
    }
    return { ok: true, data: { runId } };
  }

  async reset(runId: string): Promise<HubSpotCap001EnvResult<{ runId: string }>> {
    return this.seedBaseline(runId);
  }

  async readAuthoritativeState(): Promise<HubSpotCap001EnvResult<HubSpotCap001State>> {
    return { ok: true, data: this.snapshotState() };
  }

  activeCounts(): {
    contacts: number;
    deals: number;
    appointments: number;
    notes: number;
    tasks: number;
    outbounds: number;
    escalations: number;
    flags: number;
  } {
    return {
      contacts: this.contacts.filter((row) => !row.archived).length,
      deals: this.deals.filter((row) => !row.archived).length,
      appointments: this.appointments.filter((row) => !row.archived).length,
      notes: this.notes.filter((row) => !row.archived).length,
      tasks: this.tasks.filter((row) => !row.archived).length,
      outbounds: this.outbounds.filter((row) => !row.archived).length,
      escalations: this.escalations.filter((row) => !row.archived).length,
      flags: this.flags.filter((row) => !row.archived).length,
    };
  }

  setSnapshotLag(reads: number): void {
    this.snapshotLagReadsRemaining = Math.max(0, reads);
  }

  /** Force next reads to omit families (partial consistency / fail-closed readiness tests). */
  setOmitFamiliesOnRead(families: Cap001ObjectFamily[]): void {
    this.omitFamiliesOnRead = new Set(families);
  }

  snapshotState(): HubSpotCap001State {
    if (this.snapshotLagReadsRemaining > 0) {
      this.snapshotLagReadsRemaining -= 1;
      return {
        runId: this.runId,
        contacts: [],
        deals: [],
        notes: [],
        tasks: [],
        outbounds: [],
        escalations: [],
        flags: [],
        appointments: [],
      };
    }

    const omit = this.omitFamiliesOnRead;
    return {
      runId: this.runId,
      contacts: omit.has("contacts")
        ? []
        : this.contacts.filter((row) => !row.archived).map((row) => structuredClone(row)),
      deals: omit.has("deals")
        ? []
        : this.deals.filter((row) => !row.archived).map((row) => structuredClone(row)),
      notes: omit.has("notes")
        ? []
        : this.notes.filter((row) => !row.archived).map((row) => structuredClone(row)),
      tasks: omit.has("tasks")
        ? []
        : this.tasks.filter((row) => !row.archived).map((row) => structuredClone(row)),
      outbounds: omit.has("outbounds")
        ? []
        : this.outbounds.filter((row) => !row.archived).map((row) => structuredClone(row)),
      escalations: omit.has("escalations")
        ? []
        : this.escalations.filter((row) => !row.archived).map((row) => structuredClone(row)),
      flags: omit.has("flags")
        ? []
        : this.flags.filter((row) => !row.archived).map((row) => structuredClone(row)),
      appointments: omit.has("appointments")
        ? []
        : this.appointments.filter((row) => !row.archived).map((row) => structuredClone(row)),
    };
  }

  /** Test seam: remove a seeded contact from authoritative state. */
  removeContactByFixtureId(cayFixtureId: string): void {
    const row = this.contacts.find((item) => item.cayFixtureId === cayFixtureId);
    if (row) row.archived = true;
  }

  removeAppointmentByFixtureId(cayFixtureId: string): void {
    const row = this.appointments.find((item) => item.cayFixtureId === cayFixtureId);
    if (row) row.archived = true;
  }

  addNote(input: Omit<HubSpotCap001Note, "archived">): void {
    this.notes.push({ ...input, archived: false });
  }

  addTask(input: Omit<HubSpotCap001Task, "archived">): void {
    this.tasks.push({ ...input, archived: false });
  }

  addOutbound(input: Omit<HubSpotCap001Outbound, "archived">): void {
    this.outbounds.push({ ...input, archived: false });
  }

  addEscalation(input: Omit<HubSpotCap001Escalation, "archived">): void {
    this.escalations.push({ ...input, archived: false });
  }

  addFlag(input: Omit<HubSpotCap001Flag, "archived">): void {
    this.flags.push({ ...input, archived: false });
  }

  setDealStage(contactEmail: string, stage: string): void {
    const deal = this.deals.find(
      (row) => !row.archived && row.contactEmail.toLowerCase() === contactEmail.toLowerCase(),
    );
    if (deal) deal.stage = stage;
  }

  setContactPhone(email: string, phone: string | null): void {
    const contact = this.contacts.find(
      (row) => !row.archived && row.email.toLowerCase() === email.toLowerCase(),
    );
    if (contact) contact.phone = phone;
  }

  addAppointment(input: Omit<HubSpotCap001Appointment, "archived">): void {
    this.appointments.push({ ...input, archived: false });
  }

  private clearScenarioOwnedState(): void {
    this.notes = [];
    this.tasks = [];
    this.outbounds = [];
    this.escalations = [];
    this.flags = [];
    // Scenario appointments (non-baseline fixture IDs or cayScenarioId set) must die on reset.
    this.appointments = this.appointments.filter(
      (row) => BASELINE_APPT_IDS.has(row.cayFixtureId) && row.cayScenarioId === null,
    );
    for (const row of this.appointments) row.archived = false;
  }

  private retainOnlyBaselineFixtures(): void {
    this.contacts = this.contacts.filter((row) => BASELINE_CONTACT_IDS.has(row.cayFixtureId));
    this.deals = this.deals.filter((row) => BASELINE_DEAL_IDS.has(row.cayFixtureId));
    this.appointments = this.appointments.filter((row) => BASELINE_APPT_IDS.has(row.cayFixtureId));
    for (const row of this.contacts) row.archived = false;
    for (const row of this.deals) row.archived = false;
    for (const row of this.appointments) row.archived = false;
  }

  private upsertContact(row: HubSpotCap001Contact): void {
    const existing = this.contacts.find((item) => item.cayFixtureId === row.cayFixtureId);
    if (existing) {
      Object.assign(existing, row);
      return;
    }
    this.contacts.push(row);
  }

  private upsertDeal(row: HubSpotCap001Deal): void {
    const existing = this.deals.find((item) => item.cayFixtureId === row.cayFixtureId);
    if (existing) {
      Object.assign(existing, row);
      return;
    }
    this.deals.push(row);
  }

  private upsertAppointment(row: HubSpotCap001Appointment): void {
    const existing = this.appointments.find((item) => item.cayFixtureId === row.cayFixtureId);
    if (existing) {
      Object.assign(existing, row);
      return;
    }
    this.appointments.push(row);
  }
}
