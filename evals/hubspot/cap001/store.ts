import {
  CAP001_SEED_APPOINTMENTS,
  CAP001_SEED_CONTACTS,
  CAP001_SEED_DEALS,
} from "@/evals/hubspot/cap001/seed-graph";
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

/**
 * In-memory HubSpot CAP-001 environment store.
 * Models HubSpot object graphs for no-model calibration without live CRM writes.
 */
export class HubSpotCap001Store {
  private runId = "unseeded";
  private contacts: HubSpotCap001Contact[] = [];
  private deals: HubSpotCap001Deal[] = [];
  private notes: HubSpotCap001Note[] = [];
  private tasks: HubSpotCap001Task[] = [];
  private outbounds: HubSpotCap001Outbound[] = [];
  private escalations: HubSpotCap001Escalation[] = [];
  private flags: HubSpotCap001Flag[] = [];
  private appointments: HubSpotCap001Appointment[] = [];
  /** Simulates eventual-consistency lag for bounded retry tests. */
  private snapshotLagReadsRemaining = 0;

  get currentRunId(): string {
    return this.runId;
  }

  /** Seed/reset shared baseline keyed by cay_fixture_id (idempotent upsert). */
  seedBaseline(runId: string): void {
    this.runId = runId;
    this.archiveByRunIdExcept(runId);
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
    // Clear scenario-owned activity for a clean baseline.
    this.notes = this.notes.filter((row) => !row.archived && row.cayRunId === runId && row.cayScenarioId === null);
    this.tasks = this.tasks.filter((row) => !row.archived && row.cayRunId === runId && row.cayScenarioId === null);
    this.outbounds = [];
    this.escalations = [];
    this.flags = [];
  }

  reset(runId: string): void {
    this.seedBaseline(runId);
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

  /** Inject N inconsistent snapshot reads before returning authoritative state. */
  setSnapshotLag(reads: number): void {
    this.snapshotLagReadsRemaining = Math.max(0, reads);
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
    return {
      runId: this.runId,
      contacts: this.contacts.filter((row) => !row.archived).map((row) => structuredClone(row)),
      deals: this.deals.filter((row) => !row.archived).map((row) => structuredClone(row)),
      notes: this.notes.filter((row) => !row.archived).map((row) => structuredClone(row)),
      tasks: this.tasks.filter((row) => !row.archived).map((row) => structuredClone(row)),
      outbounds: this.outbounds.filter((row) => !row.archived).map((row) => structuredClone(row)),
      escalations: this.escalations.filter((row) => !row.archived).map((row) => structuredClone(row)),
      flags: this.flags.filter((row) => !row.archived).map((row) => structuredClone(row)),
      appointments: this.appointments.filter((row) => !row.archived).map((row) => structuredClone(row)),
    };
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

  private archiveByRunIdExcept(keepRunId: string): void {
    const archive = <T extends { cayRunId: string; archived: boolean }>(rows: T[]) => {
      for (const row of rows) {
        if (row.cayRunId !== keepRunId) row.archived = true;
      }
    };
    archive(this.contacts);
    archive(this.deals);
    archive(this.notes);
    archive(this.tasks);
    archive(this.outbounds);
    archive(this.escalations);
    archive(this.flags);
    archive(this.appointments);
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
