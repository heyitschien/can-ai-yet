/**
 * Live HubSpot CAP-001 environment adapter (CAY-10).
 *
 * Default grantedScopes = contacts.read + contacts.write only.
 * Full seed/reset/readAuthoritativeState require deals scopes → SCOPE_GAP without them.
 * Contact-scoped helpers dry-certify READY families via injected HTTP (no live network in tests).
 * Service Key is unchanged; deals grants appear only when tests inject fake scopes.
 */

import {
  Cap001HubSpotHttpClient,
  mapClientFailureToEnv,
  type Cap001HubSpotObject,
} from "@/evals/hubspot/cap001/http-client";
import {
  CAP001_PROP_CONTACT_EMAIL,
  CAP001_PROP_DO_NOT_CONTACT,
  CAP001_PROP_ESCALATION_REASON,
  CAP001_PROP_FIXTURE_ID,
  CAP001_PROP_FLAG_CODE,
  CAP001_PROP_FLAG_MESSAGE,
  CAP001_PROP_KIND,
  CAP001_PROP_OWNER,
  CAP001_PROP_RUN_ID,
  CAP001_PROP_SCENARIO_ID,
  CAP001_PROP_STATUS,
  CAP001_PROP_TAGS,
  SCOPE_CONTACTS_READ,
  SCOPE_CONTACTS_WRITE,
  SCOPE_DEALS_READ,
  SCOPE_DEALS_WRITE,
} from "@/evals/hubspot/cap001/paths";
import type {
  Cap001ObjectFamily,
  HubSpotCap001EnvironmentPort,
  HubSpotCap001EnvResult,
} from "@/evals/hubspot/cap001/port";
import {
  CAP001_SEED_APPOINTMENTS,
  CAP001_SEED_CONTACTS,
  CAP001_SEED_DEALS,
} from "@/evals/hubspot/cap001/seed-graph";
import { CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER } from "@/evals/hubspot/cap001/scope-matrix";
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
import type { HubSpotFailureClass } from "@/evals/hubspot/types";

const BASELINE_CONTACT_IDS = new Set(CAP001_SEED_CONTACTS.map((row) => row.cayFixtureId));
const BASELINE_DEAL_IDS = new Set(CAP001_SEED_DEALS.map((row) => row.cayFixtureId));
const BASELINE_APPT_IDS = new Set(CAP001_SEED_APPOINTMENTS.map((row) => row.cayFixtureId));

const CONTACT_SCOPED_FAMILIES: readonly Cap001ObjectFamily[] = [
  "contacts",
  "notes",
  "tasks",
  "outbounds",
  "escalations",
  "flags",
  "appointments",
];

export type LiveHubSpotCap001AdapterOptions = {
  client?: Cap001HubSpotHttpClient;
  grantedScopes?: readonly string[];
  fetchImpl?: typeof fetch;
  accessToken?: string;
  baseUrl?: string;
};

function prop(obj: Cap001HubSpotObject, name: string): string {
  const value = obj.properties?.[name];
  return value == null ? "" : String(value);
}

function parseTags(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function contactPropertiesFromSeed(
  spec: (typeof CAP001_SEED_CONTACTS)[number],
  runId: string,
): Record<string, string> {
  return {
    email: spec.email,
    firstname: spec.firstName,
    lastname: spec.lastName,
    phone: spec.phone ?? "",
    company: spec.company,
    [CAP001_PROP_FIXTURE_ID]: spec.cayFixtureId,
    [CAP001_PROP_RUN_ID]: runId,
    [CAP001_PROP_SCENARIO_ID]: "",
    [CAP001_PROP_STATUS]: spec.status,
    [CAP001_PROP_DO_NOT_CONTACT]: spec.doNotContact ? "true" : "false",
    [CAP001_PROP_TAGS]: spec.tags.join(";"),
    [CAP001_PROP_OWNER]: "sam@acme.example",
  };
}

function mapContact(obj: Cap001HubSpotObject): HubSpotCap001Contact | null {
  const cayFixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  if (!cayFixtureId) return null;
  const statusRaw = prop(obj, CAP001_PROP_STATUS);
  const status = statusRaw === "customer" ? "customer" : "lead";
  return {
    cayFixtureId,
    cayRunId: prop(obj, CAP001_PROP_RUN_ID),
    cayScenarioId: prop(obj, CAP001_PROP_SCENARIO_ID) || null,
    email: prop(obj, "email"),
    firstName: prop(obj, "firstname"),
    lastName: prop(obj, "lastname"),
    phone: prop(obj, "phone") || null,
    company: prop(obj, "company"),
    status,
    doNotContact: prop(obj, CAP001_PROP_DO_NOT_CONTACT) === "true",
    tags: parseTags(prop(obj, CAP001_PROP_TAGS)),
    owner: prop(obj, CAP001_PROP_OWNER) || "sam@acme.example",
    archived: Boolean(obj.archived),
  };
}

function mapDeal(obj: Cap001HubSpotObject): HubSpotCap001Deal | null {
  const cayFixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  if (!cayFixtureId) return null;
  const amount = Number(prop(obj, "amount") || "0");
  return {
    cayFixtureId,
    cayRunId: prop(obj, CAP001_PROP_RUN_ID),
    cayScenarioId: prop(obj, CAP001_PROP_SCENARIO_ID) || null,
    name: prop(obj, "dealname"),
    contactEmail: prop(obj, CAP001_PROP_CONTACT_EMAIL),
    stage: prop(obj, "dealstage") || "New",
    value: Number.isFinite(amount) ? amount : 0,
    archived: Boolean(obj.archived),
  };
}

function mapNote(obj: Cap001HubSpotObject): HubSpotCap001Note | null {
  const kind = prop(obj, CAP001_PROP_KIND);
  if (kind === "flag") return null;
  const cayFixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  if (!cayFixtureId) return null;
  return {
    cayFixtureId,
    cayRunId: prop(obj, CAP001_PROP_RUN_ID),
    cayScenarioId: prop(obj, CAP001_PROP_SCENARIO_ID) || null,
    contactEmail: prop(obj, CAP001_PROP_CONTACT_EMAIL),
    body: prop(obj, "hs_note_body"),
    archived: Boolean(obj.archived),
  };
}

function mapFlag(obj: Cap001HubSpotObject): HubSpotCap001Flag | null {
  if (prop(obj, CAP001_PROP_KIND) !== "flag") return null;
  const cayFixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  if (!cayFixtureId) return null;
  return {
    cayFixtureId,
    cayRunId: prop(obj, CAP001_PROP_RUN_ID),
    cayScenarioId: prop(obj, CAP001_PROP_SCENARIO_ID) || null,
    code: prop(obj, CAP001_PROP_FLAG_CODE),
    message: prop(obj, CAP001_PROP_FLAG_MESSAGE) || prop(obj, "hs_note_body"),
    archived: Boolean(obj.archived),
  };
}

function mapTask(obj: Cap001HubSpotObject): HubSpotCap001Task | null {
  const kind = prop(obj, CAP001_PROP_KIND);
  if (kind === "escalation") return null;
  const cayFixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  if (!cayFixtureId) return null;
  return {
    cayFixtureId,
    cayRunId: prop(obj, CAP001_PROP_RUN_ID),
    cayScenarioId: prop(obj, CAP001_PROP_SCENARIO_ID) || null,
    contactEmail: prop(obj, CAP001_PROP_CONTACT_EMAIL) || null,
    title: prop(obj, "hs_task_subject"),
    archived: Boolean(obj.archived),
  };
}

function mapEscalation(obj: Cap001HubSpotObject): HubSpotCap001Escalation | null {
  if (prop(obj, CAP001_PROP_KIND) !== "escalation") return null;
  const cayFixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  if (!cayFixtureId) return null;
  return {
    cayFixtureId,
    cayRunId: prop(obj, CAP001_PROP_RUN_ID),
    cayScenarioId: prop(obj, CAP001_PROP_SCENARIO_ID) || null,
    reason: prop(obj, CAP001_PROP_ESCALATION_REASON) || prop(obj, "hs_task_subject"),
    archived: Boolean(obj.archived),
  };
}

function mapOutbound(obj: Cap001HubSpotObject): HubSpotCap001Outbound | null {
  const cayFixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  if (!cayFixtureId) return null;
  return {
    cayFixtureId,
    cayRunId: prop(obj, CAP001_PROP_RUN_ID),
    cayScenarioId: prop(obj, CAP001_PROP_SCENARIO_ID) || null,
    to: prop(obj, CAP001_PROP_CONTACT_EMAIL),
    body: prop(obj, "hs_email_text"),
    archived: Boolean(obj.archived),
  };
}

function mapAppointment(obj: Cap001HubSpotObject): HubSpotCap001Appointment | null {
  const cayFixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  if (!cayFixtureId) return null;
  const startMs = prop(obj, "hs_meeting_start_time");
  const endMs = prop(obj, "hs_meeting_end_time");
  const start = startMs ? new Date(Number(startMs)).toISOString() : "";
  const end = endMs ? new Date(Number(endMs)).toISOString() : "";
  return {
    cayFixtureId,
    cayRunId: prop(obj, CAP001_PROP_RUN_ID),
    cayScenarioId: prop(obj, CAP001_PROP_SCENARIO_ID) || null,
    contactEmail: prop(obj, CAP001_PROP_CONTACT_EMAIL),
    title: prop(obj, "hs_meeting_title"),
    start,
    end,
    status: "booked",
    archived: Boolean(obj.archived),
  };
}

type SeedAttemptTracker = {
  createdContactIds: string[];
  createdMeetingIds: string[];
  createdDealIds: string[];
};

function emptySeedTracker(): SeedAttemptTracker {
  return { createdContactIds: [], createdMeetingIds: [], createdDealIds: [] };
}

function withCleanupFailures(primary: string, cleanupFailures: string[]): string {
  if (cleanupFailures.length === 0) return primary;
  return `${primary}; cleanupFailures: ${cleanupFailures.join("; ")}`;
}

/**
 * Authoritative ownership = HubSpot association, not cay_contact_email alone.
 * CAP-001 one-person activities/deals: require exactly one contact association total,
 * and that contact's email must match cay_contact_email. Extra associations fail closed
 * as ambiguous even when one of them matches the label.
 */
function verifyContactAssociation(
  record: Cap001HubSpotObject,
  contactIdToEmail: Map<string, string>,
  family: Cap001ObjectFamily,
): HubSpotCap001EnvResult<string> {
  const labeledEmail = prop(record, CAP001_PROP_CONTACT_EMAIL).trim();
  const assocResults = record.associations?.contacts?.results ?? [];
  if (assocResults.length === 0) {
    return {
      ok: false,
      failureClass: "INTEGRATION_FAILURE",
      message: `Missing contact association on ${family} ${record.id} (cay_contact_email is auxiliary only)`,
      family,
    };
  }

  if (assocResults.length !== 1) {
    const associatedEmails = assocResults
      .map((row) => contactIdToEmail.get(row.id) ?? `(unknown:${row.id})`)
      .join(", ");
    return {
      ok: false,
      failureClass: "INTEGRATION_FAILURE",
      message: `Ambiguous contact associations on ${family} ${record.id}: expected exactly one contact association, found ${assocResults.length} associations=[${associatedEmails}]`,
      family,
    };
  }

  const only = assocResults[0];
  const associatedEmail = contactIdToEmail.get(only.id);
  if (
    associatedEmail &&
    labeledEmail &&
    associatedEmail.toLowerCase() === labeledEmail.toLowerCase()
  ) {
    return { ok: true, data: labeledEmail };
  }

  return {
    ok: false,
    failureClass: "INTEGRATION_FAILURE",
    message: `Contact association mismatch on ${family} ${record.id}: cay_contact_email=${labeledEmail || "(empty)"} associations=[${associatedEmail ?? `(unknown:${only.id})`}]`,
    family,
  };
}

/**
 * Cross-run scenario cleanup ownership (test-account-only, least-authority).
 * Archive any non-baseline CanAIYet-tagged object (cay_fixture_id OR cay_run_id OR
 * cay_scenario_id set) that is NOT a baseline fixture ID, regardless of runId.
 * Cleanup is bounded to objects carrying CanAIYet `cay_*` namespace properties; never
 * archive HubSpot objects lacking those tags.
 */
function isCanAiYetTagged(obj: Cap001HubSpotObject): boolean {
  return Boolean(
    prop(obj, CAP001_PROP_FIXTURE_ID) ||
      prop(obj, CAP001_PROP_RUN_ID) ||
      prop(obj, CAP001_PROP_SCENARIO_ID),
  );
}

function isPreservedBaseline(
  obj: Cap001HubSpotObject,
  baselineIds: ReadonlySet<string>,
): boolean {
  const fixtureId = prop(obj, CAP001_PROP_FIXTURE_ID);
  const scenarioId = prop(obj, CAP001_PROP_SCENARIO_ID);
  return Boolean(fixtureId) && baselineIds.has(fixtureId) && !scenarioId;
}

function shouldArchiveScenarioTagged(
  obj: Cap001HubSpotObject,
  baselineIds: ReadonlySet<string>,
): boolean {
  if (!isCanAiYetTagged(obj)) return false;
  if (isPreservedBaseline(obj, baselineIds)) return false;
  return true;
}

function failFromClient<T>(
  result: {
    ok: false;
    failureClass: HubSpotFailureClass | "SCOPE_GAP" | "ADAPTER_GAP";
    message: string;
    family?: Cap001ObjectFamily;
  },
  family?: Cap001ObjectFamily,
  cleanupFailures: string[] = [],
): HubSpotCap001EnvResult<T> {
  const mapped =
    result.failureClass === "SCOPE_GAP" || result.failureClass === "ADAPTER_GAP"
      ? result.failureClass
      : mapClientFailureToEnv(result.failureClass, result.message);
  return {
    ok: false,
    failureClass: mapped,
    message: withCleanupFailures(result.message, cleanupFailures),
    family: family ?? result.family,
  };
}
export class LiveHubSpotCap001Adapter implements HubSpotCap001EnvironmentPort {
  readonly kind = "live" as const;
  private readonly client: Cap001HubSpotHttpClient | null;

  constructor(options: LiveHubSpotCap001AdapterOptions = {}) {
    if (options.client) {
      this.client = options.client;
      return;
    }
    if (options.accessToken) {
      this.client = new Cap001HubSpotHttpClient({
        accessToken: options.accessToken,
        fetchImpl: options.fetchImpl,
        baseUrl: options.baseUrl,
        grantedScopes: options.grantedScopes,
      });
      return;
    }
    this.client = null;
  }

  private requireClient(): HubSpotCap001EnvResult<Cap001HubSpotHttpClient> {
    if (!this.client) {
      return {
        ok: false,
        failureClass: "ADAPTER_GAP",
        message: "Live CAP-001 adapter has no HTTP client; refuse to invent CRM state.",
      };
    }
    return { ok: true, data: this.client };
  }

  private hasDealsScopes(client: Cap001HubSpotHttpClient): boolean {
    return client.hasAllScopes([SCOPE_DEALS_READ, SCOPE_DEALS_WRITE]);
  }

  private dealsScopeGap(runId: string, action: string): HubSpotCap001EnvResult<never> {
    return {
      ok: false,
      failureClass: "SCOPE_GAP",
      message: `Live CAP-001 ${action} blocked (runId=${runId}). ${CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER}`,
      family: "deals",
    };
  }

  supportedFamilies(): ReadonlySet<Cap001ObjectFamily> {
    if (!this.client) return new Set();
    const families = new Set<Cap001ObjectFamily>(CONTACT_SCOPED_FAMILIES);
    if (this.hasDealsScopes(this.client)) {
      families.add("deals");
    }
    return families;
  }

  requireFamily(family: Cap001ObjectFamily): HubSpotCap001EnvResult<true> {
    if (this.supportedFamilies().has(family)) {
      return { ok: true, data: true };
    }

    switch (family) {
      case "deals":
        return {
          ok: false,
          failureClass: "SCOPE_GAP",
          message:
            "Live CAP-001 deals require crm.objects.deals.read/write (verified missing on Service Key).",
          family,
        };
      case "contacts":
      case "notes":
      case "tasks":
      case "outbounds":
      case "escalations":
      case "flags":
      case "appointments":
        return {
          ok: false,
          failureClass: "ADAPTER_GAP",
          message: this.client
            ? `Live CAP-001 family '${family}' is not in supportedFamilies().`
            : `Live CAP-001 family '${family}' requires an HTTP client (accessToken/fetchImpl or injected client).`,
          family,
        };
      default: {
        const _exhaustive: never = family;
        return _exhaustive;
      }
    }
  }

  async seedBaseline(runId: string): Promise<HubSpotCap001EnvResult<{ runId: string }>> {
    const clientResult = this.requireClient();
    if (!clientResult.ok) return clientResult;
    if (!this.hasDealsScopes(clientResult.data)) {
      return this.dealsScopeGap(runId, "seedBaseline");
    }
    return this.seedFullGraph(clientResult.data, runId);
  }

  async reset(runId: string): Promise<HubSpotCap001EnvResult<{ runId: string }>> {
    const clientResult = this.requireClient();
    if (!clientResult.ok) return clientResult;
    if (!this.hasDealsScopes(clientResult.data)) {
      return this.dealsScopeGap(runId, "reset");
    }
    const cleared = await this.clearScenarioActivity(clientResult.data, runId, { includeDeals: true });
    if (!cleared.ok) return cleared;
    return this.seedFullGraph(clientResult.data, runId);
  }

  async readAuthoritativeState(): Promise<HubSpotCap001EnvResult<HubSpotCap001State>> {
    const clientResult = this.requireClient();
    if (!clientResult.ok) return clientResult;
    if (!this.hasDealsScopes(clientResult.data)) {
      return this.dealsScopeGap("unknown", "readAuthoritativeState");
    }
    return this.readFullState(clientResult.data);
  }

  /** Dry-certification path for contact-scoped families (no deals required). */
  async seedContactScopedBaseline(runId: string): Promise<HubSpotCap001EnvResult<{ runId: string }>> {
    const clientResult = this.requireClient();
    if (!clientResult.ok) return clientResult;
    const client = clientResult.data;
    if (!client.hasAllScopes([SCOPE_CONTACTS_READ, SCOPE_CONTACTS_WRITE])) {
      return {
        ok: false,
        failureClass: "SCOPE_GAP",
        message: "SCOPE_GAP: missing crm.objects.contacts.read/write",
        family: "contacts",
      };
    }
    const seeded = await this.seedContactFixtures(client, runId);
    if (!seeded.ok) return seeded;
    return { ok: true, data: { runId: seeded.data.runId } };
  }

  async resetContactScoped(runId: string): Promise<HubSpotCap001EnvResult<{ runId: string }>> {
    const clientResult = this.requireClient();
    if (!clientResult.ok) return clientResult;
    const cleared = await this.clearScenarioActivity(clientResult.data, runId, { includeDeals: false });
    if (!cleared.ok) return cleared;
    const seeded = await this.seedContactFixtures(clientResult.data, runId);
    if (!seeded.ok) return seeded;
    return { ok: true, data: { runId: seeded.data.runId } };
  }

  async readContactScopedState(runId: string): Promise<HubSpotCap001EnvResult<HubSpotCap001State>> {
    const clientResult = this.requireClient();
    if (!clientResult.ok) return clientResult;
    return this.readContactScoped(clientResult.data, runId);
  }

  private async seedContactFixtures(
    client: Cap001HubSpotHttpClient,
    runId: string,
    tracker: SeedAttemptTracker = emptySeedTracker(),
  ): Promise<HubSpotCap001EnvResult<{ runId: string; tracker: SeedAttemptTracker }>> {
    const failAndCleanup = async <T>(
      failure: {
        ok: false;
        failureClass: HubSpotFailureClass | "SCOPE_GAP" | "ADAPTER_GAP";
        message: string;
        family?: Cap001ObjectFamily;
      },
      family: Cap001ObjectFamily,
    ): Promise<HubSpotCap001EnvResult<T>> => {
      const cleanupFailures = await this.cleanupSeedAttempt(client, tracker, {
        includeDeals: false,
      });
      return failFromClient(failure, family, cleanupFailures);
    };

    try {
      for (const spec of CAP001_SEED_CONTACTS) {
        const existing = await this.findContactByFixtureId(client, spec.cayFixtureId);
        if (!existing.ok) {
          return failAndCleanup(existing, "contacts");
        }
        const properties = contactPropertiesFromSeed(spec, runId);
        if (existing.data) {
          const updated = await client.updateContact(existing.data.id, properties);
          if (!updated.ok) {
            return failAndCleanup(updated, "contacts");
          }
        } else {
          const created = await client.createContact(properties);
          if (!created.ok) {
            return failAndCleanup(created, "contacts");
          }
          tracker.createdContactIds.push(created.data.id);
        }
      }

      for (const spec of CAP001_SEED_APPOINTMENTS) {
        const contact = await this.findContactByEmail(client, spec.contactEmail);
        if (!contact.ok) {
          return failAndCleanup(contact, "appointments");
        }
        if (!contact.data) {
          return failAndCleanup(
            {
              ok: false,
              failureClass: "INTEGRATION_FAILURE",
              message: `Missing contact for appointment seed ${spec.cayFixtureId}`,
            },
            "appointments",
          );
        }
        const existingAppt = await this.findMeetingByFixtureId(client, spec.cayFixtureId);
        if (!existingAppt.ok) {
          return failAndCleanup(existingAppt, "appointments");
        }
        const meetingProperties = {
          hs_meeting_title: spec.title,
          hs_meeting_start_time: String(Date.parse(spec.start)),
          hs_meeting_end_time: String(Date.parse(spec.end)),
          hs_timestamp: String(Date.parse(spec.start)),
          [CAP001_PROP_FIXTURE_ID]: spec.cayFixtureId,
          [CAP001_PROP_RUN_ID]: runId,
          [CAP001_PROP_SCENARIO_ID]: "",
          [CAP001_PROP_CONTACT_EMAIL]: spec.contactEmail,
          [CAP001_PROP_KIND]: "appointment",
        };
        if (existingAppt.data) {
          const updated = await client.updateMeeting(existingAppt.data.id, meetingProperties);
          if (!updated.ok) {
            return failAndCleanup(updated, "appointments");
          }
        } else {
          const created = await client.createMeeting({
            contactId: contact.data.id,
            properties: meetingProperties,
          });
          if (!created.ok) {
            return failAndCleanup(created, "appointments");
          }
          tracker.createdMeetingIds.push(created.data.id);
        }
      }

      return { ok: true, data: { runId, tracker } };
    } catch (error) {
      const cleanupFailures = await this.cleanupSeedAttempt(client, tracker, {
        includeDeals: false,
      });
      return {
        ok: false,
        failureClass: "RUNTIME/API_FAILURE",
        message: withCleanupFailures(
          error instanceof Error ? error.message : "seedContactFixtures failed",
          cleanupFailures,
        ),
        family: "contacts",
      };
    }
  }

  private async seedFullGraph(
    client: Cap001HubSpotHttpClient,
    runId: string,
  ): Promise<HubSpotCap001EnvResult<{ runId: string }>> {
    const tracker = emptySeedTracker();
    const contactSeed = await this.seedContactFixtures(client, runId, tracker);
    if (!contactSeed.ok) return contactSeed;

    for (const spec of CAP001_SEED_DEALS) {
      const contact = await this.findContactByEmail(client, spec.contactEmail);
      if (!contact.ok) {
        const cleanupFailures = await this.cleanupSeedAttempt(client, tracker, {
          includeDeals: true,
        });
        return failFromClient(contact, "deals", cleanupFailures);
      }
      if (!contact.data) {
        const cleanupFailures = await this.cleanupSeedAttempt(client, tracker, {
          includeDeals: true,
        });
        return failFromClient(
          {
            ok: false,
            failureClass: "INTEGRATION_FAILURE",
            message: `Missing contact for deal seed ${spec.cayFixtureId}`,
          },
          "deals",
          cleanupFailures,
        );
      }
      const existing = await this.findDealByFixtureId(client, spec.cayFixtureId);
      if (!existing.ok) {
        const cleanupFailures = await this.cleanupSeedAttempt(client, tracker, {
          includeDeals: true,
        });
        return failFromClient(existing, "deals", cleanupFailures);
      }
      const properties = {
        dealname: spec.name,
        amount: String(spec.value),
        dealstage: spec.stage,
        [CAP001_PROP_FIXTURE_ID]: spec.cayFixtureId,
        [CAP001_PROP_RUN_ID]: runId,
        [CAP001_PROP_SCENARIO_ID]: "",
        [CAP001_PROP_CONTACT_EMAIL]: spec.contactEmail,
      };
      if (existing.data) {
        const updated = await client.updateDeal(existing.data.id, properties);
        if (!updated.ok) {
          const cleanupFailures = await this.cleanupSeedAttempt(client, tracker, {
            includeDeals: true,
          });
          return failFromClient(updated, "deals", cleanupFailures);
        }
        // Prefer create-with-association; for existing deals verify association or fail closed.
        const verified = verifyContactAssociation(
          existing.data,
          new Map([[contact.data.id, spec.contactEmail]]),
          "deals",
        );
        if (!verified.ok) {
          const cleanupFailures = await this.cleanupSeedAttempt(client, tracker, {
            includeDeals: true,
          });
          return failFromClient(verified, "deals", cleanupFailures);
        }
      } else {
        const created = await client.createDeal({
          contactId: contact.data.id,
          properties,
        });
        if (!created.ok) {
          const cleanupFailures = await this.cleanupSeedAttempt(client, tracker, {
            includeDeals: true,
          });
          return failFromClient(created, "deals", cleanupFailures);
        }
        tracker.createdDealIds.push(created.data.id);
      }
    }

    return { ok: true, data: { runId } };
  }

  private async clearScenarioActivity(
    client: Cap001HubSpotHttpClient,
    runId: string,
    options: { includeDeals: boolean },
  ): Promise<HubSpotCap001EnvResult<{ runId: string }>> {
    // Cross-run: archive scenario leftovers for any cay_run_id, not only current runId.
    // Bounded to CanAIYet-tagged objects (cay_fixture_id | cay_run_id | cay_scenario_id);
    // never archive HubSpot objects lacking those tags. Baseline fixture IDs are preserved.
    const notes = await client.listNotes();
    if (!notes.ok) return failFromClient(notes, "notes");
    for (const row of notes.data) {
      if (!shouldArchiveScenarioTagged(row, new Set())) continue;
      const archived = await client.archiveNote(row.id);
      if (!archived.ok && !archived.notFound) return failFromClient(archived, "notes");
    }

    const tasks = await client.listTasks();
    if (!tasks.ok) return failFromClient(tasks, "tasks");
    for (const row of tasks.data) {
      if (!shouldArchiveScenarioTagged(row, new Set())) continue;
      const archived = await client.archiveTask(row.id);
      if (!archived.ok && !archived.notFound) return failFromClient(archived, "tasks");
    }

    const emails = await client.listEmails();
    if (!emails.ok) return failFromClient(emails, "outbounds");
    for (const row of emails.data) {
      if (!shouldArchiveScenarioTagged(row, new Set())) continue;
      const archived = await client.archiveEmail(row.id);
      if (!archived.ok && !archived.notFound) return failFromClient(archived, "outbounds");
    }

    const meetings = await client.listMeetings();
    if (!meetings.ok) return failFromClient(meetings, "appointments");
    for (const row of meetings.data) {
      if (!shouldArchiveScenarioTagged(row, BASELINE_APPT_IDS)) continue;
      const archived = await client.archiveMeeting(row.id);
      if (!archived.ok && !archived.notFound) return failFromClient(archived, "appointments");
    }

    if (options.includeDeals) {
      const deals = await client.listDeals();
      if (!deals.ok) return failFromClient(deals, "deals");
      for (const row of deals.data) {
        if (!shouldArchiveScenarioTagged(row, BASELINE_DEAL_IDS)) continue;
        const archived = await client.archiveDeal(row.id);
        if (!archived.ok && !archived.notFound) return failFromClient(archived, "deals");
      }
    }

    return { ok: true, data: { runId } };
  }

  private async readContactScoped(
    client: Cap001HubSpotHttpClient,
    runId: string,
  ): Promise<HubSpotCap001EnvResult<HubSpotCap001State>> {
    const contactsResult = await this.listContactsForRun(client, runId);
    if (!contactsResult.ok) return contactsResult;

    const contactObjects = contactsResult.data;
    const contacts = contactObjects
      .map(mapContact)
      .filter((row): row is HubSpotCap001Contact => row !== null && !row.archived);

    const requiredIds = [...BASELINE_CONTACT_IDS];
    const present = new Set(contacts.map((row) => row.cayFixtureId));
    for (const id of requiredIds) {
      if (!present.has(id)) {
        return {
          ok: false,
          failureClass: "INTEGRATION_FAILURE",
          message: `Partial fixture visibility: missing contact ${id}`,
          family: "contacts",
        };
      }
    }

    const contactIdToEmail = new Map<string, string>();
    for (const obj of contactObjects) {
      const email = prop(obj, "email").trim();
      if (email) contactIdToEmail.set(obj.id, email);
    }

    const notesList = await client.listNotes();
    if (!notesList.ok) return failFromClient(notesList, "notes");
    const tasksList = await client.listTasks();
    if (!tasksList.ok) return failFromClient(tasksList, "tasks");
    const emailsList = await client.listEmails();
    if (!emailsList.ok) return failFromClient(emailsList, "outbounds");
    const meetingsList = await client.listMeetings();
    if (!meetingsList.ok) return failFromClient(meetingsList, "appointments");

    const forRun = <T extends Cap001HubSpotObject>(rows: T[]) =>
      rows.filter((row) => prop(row, CAP001_PROP_RUN_ID) === runId && !row.archived);

    const runNotes = forRun(notesList.data);
    const runTasks = forRun(tasksList.data);
    const runEmails = forRun(emailsList.data);
    const runMeetings = forRun(meetingsList.data);

    for (const row of runNotes) {
      const verified = verifyContactAssociation(row, contactIdToEmail, "notes");
      if (!verified.ok) return verified;
    }
    for (const row of runTasks) {
      const verified = verifyContactAssociation(row, contactIdToEmail, "tasks");
      if (!verified.ok) return verified;
    }
    for (const row of runEmails) {
      const verified = verifyContactAssociation(row, contactIdToEmail, "outbounds");
      if (!verified.ok) return verified;
    }
    for (const row of runMeetings) {
      const verified = verifyContactAssociation(row, contactIdToEmail, "appointments");
      if (!verified.ok) return verified;
    }

    const notes = runNotes
      .map(mapNote)
      .filter((row): row is HubSpotCap001Note => row !== null);
    const flags = runNotes
      .map(mapFlag)
      .filter((row): row is HubSpotCap001Flag => row !== null);
    const tasks = runTasks
      .map(mapTask)
      .filter((row): row is HubSpotCap001Task => row !== null);
    const escalations = runTasks
      .map(mapEscalation)
      .filter((row): row is HubSpotCap001Escalation => row !== null);
    const outbounds = runEmails
      .map(mapOutbound)
      .filter((row): row is HubSpotCap001Outbound => row !== null);
    const appointments = runMeetings
      .map(mapAppointment)
      .filter((row): row is HubSpotCap001Appointment => row !== null);

    for (const id of BASELINE_APPT_IDS) {
      if (!appointments.some((row) => row.cayFixtureId === id)) {
        return {
          ok: false,
          failureClass: "INTEGRATION_FAILURE",
          message: `Partial fixture visibility: missing appointment ${id}`,
          family: "appointments",
        };
      }
    }

    return {
      ok: true,
      data: {
        runId,
        contacts,
        deals: [],
        notes,
        tasks,
        outbounds,
        escalations,
        flags,
        appointments,
      },
    };
  }

  private async readFullState(
    client: Cap001HubSpotHttpClient,
  ): Promise<HubSpotCap001EnvResult<HubSpotCap001State>> {
    const dealsList = await client.listDeals();
    if (!dealsList.ok) return failFromClient(dealsList, "deals");

    const activeDeals = dealsList.data.filter((row) => !row.archived && prop(row, CAP001_PROP_FIXTURE_ID));

    const runIdGuess =
      activeDeals.find((row) => BASELINE_DEAL_IDS.has(prop(row, CAP001_PROP_FIXTURE_ID)))
        ?.properties?.[CAP001_PROP_RUN_ID] ??
      activeDeals[0]?.properties?.[CAP001_PROP_RUN_ID] ??
      "unknown";
    const runId = runIdGuess == null ? "unknown" : String(runIdGuess);

    const scoped = await this.readContactScoped(client, runId);
    if (!scoped.ok) return scoped;

    const contactIdToEmail = new Map<string, string>();
    const contactsResult = await this.listContactsForRun(client, runId);
    if (!contactsResult.ok) return contactsResult;
    for (const obj of contactsResult.data) {
      const email = prop(obj, "email").trim();
      if (email) contactIdToEmail.set(obj.id, email);
    }

    for (const row of activeDeals) {
      const verified = verifyContactAssociation(row, contactIdToEmail, "deals");
      if (!verified.ok) return verified;
    }

    const deals = activeDeals
      .map(mapDeal)
      .filter((row): row is HubSpotCap001Deal => row !== null);

    for (const id of BASELINE_DEAL_IDS) {
      if (!deals.some((row) => row.cayFixtureId === id)) {
        return {
          ok: false,
          failureClass: "INTEGRATION_FAILURE",
          message: `Partial fixture visibility: missing deal ${id}`,
          family: "deals",
        };
      }
    }

    return {
      ok: true,
      data: {
        ...scoped.data,
        deals,
      },
    };
  }

  private async listContactsForRun(
    client: Cap001HubSpotHttpClient,
    runId: string,
  ): Promise<HubSpotCap001EnvResult<Cap001HubSpotObject[]>> {
    const search = await client.searchContacts({
      filterGroups: [
        {
          filters: [
            {
              propertyName: CAP001_PROP_RUN_ID,
              operator: "EQ",
              value: runId,
            },
          ],
        },
      ],
      properties: [
        "email",
        "firstname",
        "lastname",
        "phone",
        "company",
        CAP001_PROP_FIXTURE_ID,
        CAP001_PROP_RUN_ID,
        CAP001_PROP_SCENARIO_ID,
        CAP001_PROP_STATUS,
        CAP001_PROP_DO_NOT_CONTACT,
        CAP001_PROP_TAGS,
        CAP001_PROP_OWNER,
      ],
      limit: 100,
    });
    if (!search.ok) return failFromClient(search, "contacts");
    return { ok: true, data: search.data.results ?? [] };
  }

  private async findContactByFixtureId(
    client: Cap001HubSpotHttpClient,
    fixtureId: string,
  ): Promise<HubSpotCap001EnvResult<Cap001HubSpotObject | null>> {
    const search = await client.searchContacts({
      filterGroups: [
        {
          filters: [
            {
              propertyName: CAP001_PROP_FIXTURE_ID,
              operator: "EQ",
              value: fixtureId,
            },
          ],
        },
      ],
      properties: ["email", CAP001_PROP_FIXTURE_ID, CAP001_PROP_RUN_ID],
      limit: 1,
    });
    if (!search.ok) return failFromClient(search, "contacts");
    return { ok: true, data: search.data.results?.[0] ?? null };
  }

  private async findContactByEmail(
    client: Cap001HubSpotHttpClient,
    email: string,
  ): Promise<HubSpotCap001EnvResult<Cap001HubSpotObject | null>> {
    const search = await client.searchContacts({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "EQ",
              value: email,
            },
          ],
        },
      ],
      properties: ["email", CAP001_PROP_FIXTURE_ID],
      limit: 1,
    });
    if (!search.ok) return failFromClient(search, "contacts");
    return { ok: true, data: search.data.results?.[0] ?? null };
  }

  private async findMeetingByFixtureId(
    client: Cap001HubSpotHttpClient,
    fixtureId: string,
  ): Promise<HubSpotCap001EnvResult<Cap001HubSpotObject | null>> {
    const list = await client.listMeetings();
    if (!list.ok) return failFromClient(list, "appointments");
    const found = list.data.find((row) => prop(row, CAP001_PROP_FIXTURE_ID) === fixtureId) ?? null;
    return { ok: true, data: found };
  }

  private async findDealByFixtureId(
    client: Cap001HubSpotHttpClient,
    fixtureId: string,
  ): Promise<HubSpotCap001EnvResult<Cap001HubSpotObject | null>> {
    const list = await client.listDeals();
    if (!list.ok) return failFromClient(list, "deals");
    const found = list.data.find((row) => prop(row, CAP001_PROP_FIXTURE_ID) === fixtureId) ?? null;
    return { ok: true, data: found };
  }

  private async cleanupSeedAttempt(
    client: Cap001HubSpotHttpClient,
    tracker: SeedAttemptTracker,
    options: { includeDeals: boolean },
  ): Promise<string[]> {
    const failures: string[] = [];

    if (options.includeDeals) {
      for (const id of tracker.createdDealIds) {
        try {
          const archived = await client.archiveDeal(id);
          if (!archived.ok && !archived.notFound) {
            failures.push(`deal:${id}:${archived.message}`);
          }
        } catch (error) {
          failures.push(
            `deal:${id}:${error instanceof Error ? error.message : "cleanup failed"}`,
          );
        }
      }
    }

    for (const id of tracker.createdMeetingIds) {
      try {
        const archived = await client.archiveMeeting(id);
        if (!archived.ok && !archived.notFound) {
          failures.push(`meeting:${id}:${archived.message}`);
        }
      } catch (error) {
        failures.push(
          `meeting:${id}:${error instanceof Error ? error.message : "cleanup failed"}`,
        );
      }
    }

    for (const id of tracker.createdContactIds) {
      try {
        const archived = await client.archiveContact(id);
        if (!archived.ok && !archived.notFound) {
          failures.push(`contact:${id}:${archived.message}`);
        }
      } catch (error) {
        failures.push(
          `contact:${id}:${error instanceof Error ? error.message : "cleanup failed"}`,
        );
      }
    }

    return failures;
  }
}
