/**
 * CAY-10: Live CAP-001 adapter dry certification via injected fetch.
 * No real HubSpot network calls.
 */

import { describe, expect, it, vi } from "vitest";
import {
  Cap001HubSpotHttpClient,
  LiveHubSpotCap001Adapter,
  SCOPE_CONTACTS_READ,
  SCOPE_CONTACTS_WRITE,
  SCOPE_DEALS_READ,
  SCOPE_DEALS_WRITE,
  HUBSPOT_API_BASE_URL,
  HUBSPOT_ASSOC_DEAL_TO_CONTACT,
  HUBSPOT_ASSOC_EMAIL_TO_CONTACT,
  HUBSPOT_ASSOC_MEETING_TO_CONTACT,
  HUBSPOT_ASSOC_NOTE_TO_CONTACT,
  HUBSPOT_ASSOC_TASK_TO_CONTACT,
  CAP001_SEED_CONTACTS,
  CAP001_SEED_DEALS,
  contactScopedReadyFamilies,
  snapshotWithBoundedRetry,
} from "@/evals/hubspot/cap001";
import {
  CAP001_PROP_CONTACT_EMAIL,
  CAP001_PROP_FIXTURE_ID,
  CAP001_PROP_KIND,
  CAP001_PROP_RUN_ID,
  CAP001_PROP_SCENARIO_ID,
  CAP001_CONTACTS_BASE_PATH,
  CAP001_NOTES_BASE_PATH,
  CAP001_TASKS_BASE_PATH,
  CAP001_MEETINGS_BASE_PATH,
  CAP001_EMAILS_BASE_PATH,
  CAP001_DEALS_CRUD_BASE_PATH,
  DOC_CONFLICT_EMAILS_ARCHIVE,
  DOC_CONFLICT_MEETINGS_ARCHIVE,
  cap001NoteArchivePath,
  cap001TaskArchivePath,
} from "@/evals/hubspot/cap001/paths";
import { HUBSPOT_CAP001_SNAPSHOT_VERSION } from "@/evals/hubspot/cap001/versions";

type StoredObject = {
  id: string;
  archived: boolean;
  properties: Record<string, string>;
  associations?: Record<string, { results?: Array<{ id: string; type?: string }> }>;
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "x-hubspot-correlation-id": `corr-${status}`,
    },
  });
}

function associationsFromCreateBody(
  body: Record<string, unknown>,
): StoredObject["associations"] | undefined {
  const raw = body.associations;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const results: Array<{ id: string; type?: string }> = [];
  for (const entry of raw) {
    const record = entry as { to?: { id?: string }; types?: Array<{ associationTypeId?: number }> };
    const id = record.to?.id;
    if (!id) continue;
    results.push({
      id: String(id),
      type: record.types?.[0]?.associationTypeId
        ? String(record.types[0].associationTypeId)
        : undefined,
    });
  }
  if (results.length === 0) return undefined;
  return { contacts: { results } };
}

function createFakeCrm(options: { pageSize?: number } = {}) {
  const pageSize = options.pageSize ?? 100;
  let seq = 1;
  const contacts = new Map<string, StoredObject>();
  const notes = new Map<string, StoredObject>();
  const tasks = new Map<string, StoredObject>();
  const meetings = new Map<string, StoredObject>();
  const emails = new Map<string, StoredObject>();
  const deals = new Map<string, StoredObject>();

  const storeFor = (pathname: string): Map<string, StoredObject> | null => {
    if (pathname.includes("/contacts")) return contacts;
    if (pathname.includes("/notes")) return notes;
    if (pathname.includes("/tasks")) return tasks;
    if (pathname.includes("/meetings")) return meetings;
    if (pathname.includes("/emails")) return emails;
    if (pathname.includes("/0-3")) return deals;
    return null;
  };

  const listPage = (store: Map<string, StoredObject>, url: URL) => {
    const after = url.searchParams.get("after");
    const includeAssociations = url.searchParams.get("associations") === "contacts";
    const all = [...store.values()].filter((row) => !row.archived);
    const start = after ? Number(after) : 0;
    const slice = all.slice(start, start + pageSize).map((row) => {
      if (!includeAssociations) {
        return { id: row.id, archived: row.archived, properties: row.properties };
      }
      return row;
    });
    const next = start + pageSize < all.length ? String(start + pageSize) : undefined;
    return {
      results: slice,
      paging: next ? { next: { after: next } } : undefined,
    };
  };

  const fetchImpl = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    expect(url.origin).toBe(HUBSPOT_API_BASE_URL);
    const method = (init?.method ?? "GET").toUpperCase();
    const pathname = url.pathname;
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

    if (method === "POST" && pathname.endsWith("/contacts/search")) {
      const filterGroups =
        (body.filterGroups as Array<{
          filters: Array<{ propertyName: string; operator: string; value: string }>;
        }>) ?? [];
      const filters = filterGroups[0]?.filters ?? [];
      const results = [...contacts.values()].filter((row) => {
        if (row.archived) return false;
        return filters.every(
          (filter) => String(row.properties[filter.propertyName] ?? "") === filter.value,
        );
      });
      return jsonResponse(200, { results });
    }

    if (
      method === "POST" &&
      (pathname.endsWith("/contacts") ||
        pathname.endsWith("/0-3") ||
        pathname.endsWith("/notes") ||
        pathname.endsWith("/tasks") ||
        pathname.endsWith("/meetings") ||
        pathname.endsWith("/emails"))
    ) {
      const store = storeFor(pathname);
      if (!store) return jsonResponse(404, { message: "unknown collection" });
      const id = String(seq++);
      const properties = { ...((body.properties as Record<string, string>) ?? {}) };
      const associations = associationsFromCreateBody(body);
      const row: StoredObject = { id, archived: false, properties, associations };
      store.set(id, row);
      return jsonResponse(201, row);
    }

    if (method === "GET") {
      const store = storeFor(pathname);
      if (!store) return jsonResponse(404, { message: "not found" });
      const parts = pathname.split("/");
      const maybeId = parts[parts.length - 1];
      if (maybeId && store.has(maybeId)) {
        const row = store.get(maybeId)!;
        if (row.archived) return jsonResponse(404, { message: "archived" });
        return jsonResponse(200, row);
      }
      return jsonResponse(200, listPage(store, url));
    }

    if (method === "PATCH") {
      const store = storeFor(pathname);
      const id = pathname.split("/").pop()!;
      if (!store?.has(id)) return jsonResponse(404, { message: "not found" });
      const row = store.get(id)!;
      row.properties = { ...row.properties, ...((body.properties as Record<string, string>) ?? {}) };
      return jsonResponse(200, row);
    }

    if (method === "DELETE") {
      const store = storeFor(pathname);
      const id = pathname.split("/").pop()!;
      if (!store?.has(id)) return jsonResponse(404, { message: "not found" });
      store.get(id)!.archived = true;
      return jsonResponse(204, null);
    }

    return jsonResponse(500, { message: `Unhandled ${method} ${pathname}` });
  });

  return {
    fetchImpl: fetchImpl as unknown as typeof fetch,
    fetchMock: fetchImpl,
    contacts,
    notes,
    tasks,
    meetings,
    emails,
    deals,
  };
}

const CONTACT_SCOPES = [SCOPE_CONTACTS_READ, SCOPE_CONTACTS_WRITE] as const;
const FULL_SCOPES = [
  SCOPE_CONTACTS_READ,
  SCOPE_CONTACTS_WRITE,
  SCOPE_DEALS_READ,
  SCOPE_DEALS_WRITE,
] as const;

describe("Cap001HubSpotHttpClient (injected fetch)", () => {
  it("creates/searches/updates contacts and activity objects with associations", async () => {
    const fake = createFakeCrm();
    const client = new Cap001HubSpotHttpClient({
      accessToken: "test-token",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });

    const created = await client.createContact({
      email: "alex.rivera@example.com",
      firstname: "Alex",
      lastname: "Rivera",
      [CAP001_PROP_FIXTURE_ID]: "contact-alex",
      [CAP001_PROP_RUN_ID]: "run-1",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const searched = await client.searchContacts({
      filterGroups: [
        {
          filters: [{ propertyName: "email", operator: "EQ", value: "alex.rivera@example.com" }],
        },
      ],
    });
    expect(searched.ok).toBe(true);
    if (searched.ok) expect(searched.data.results?.[0]?.id).toBe(created.data.id);

    const updated = await client.updateContact(created.data.id, { phone: "555-0101" });
    expect(updated.ok).toBe(true);

    const note = await client.createNote({
      contactId: created.data.id,
      properties: {
        hs_note_body: "hello",
        [CAP001_PROP_FIXTURE_ID]: "note-1",
        [CAP001_PROP_RUN_ID]: "run-1",
        [CAP001_PROP_KIND]: "note",
      },
    });
    expect(note.ok).toBe(true);
    const noteCall = fake.fetchMock.mock.calls.find(
      (call) => String(call[0]).includes(CAP001_NOTES_BASE_PATH) && call[1]?.method === "POST",
    );
    expect(JSON.parse(String(noteCall?.[1]?.body)).associations[0].types[0].associationTypeId).toBe(
      HUBSPOT_ASSOC_NOTE_TO_CONTACT,
    );

    const task = await client.createTask({
      contactId: created.data.id,
      properties: { hs_task_subject: "Follow up", [CAP001_PROP_RUN_ID]: "run-1" },
    });
    expect(task.ok).toBe(true);
    const taskCall = fake.fetchMock.mock.calls.find(
      (call) => String(call[0]).includes(CAP001_TASKS_BASE_PATH) && call[1]?.method === "POST",
    );
    expect(JSON.parse(String(taskCall?.[1]?.body)).associations[0].types[0].associationTypeId).toBe(
      HUBSPOT_ASSOC_TASK_TO_CONTACT,
    );

    const meeting = await client.createMeeting({
      contactId: created.data.id,
      properties: { hs_meeting_title: "Visit", [CAP001_PROP_RUN_ID]: "run-1" },
    });
    expect(meeting.ok).toBe(true);
    const meetingCall = fake.fetchMock.mock.calls.find(
      (call) => String(call[0]).includes(CAP001_MEETINGS_BASE_PATH) && call[1]?.method === "POST",
    );
    expect(JSON.parse(String(meetingCall?.[1]?.body)).associations[0].types[0].associationTypeId).toBe(
      HUBSPOT_ASSOC_MEETING_TO_CONTACT,
    );

    const email = await client.createEmail({
      contactId: created.data.id,
      properties: { hs_email_text: "body", [CAP001_PROP_RUN_ID]: "run-1" },
    });
    expect(email.ok).toBe(true);
    const emailCall = fake.fetchMock.mock.calls.find(
      (call) => String(call[0]).includes(CAP001_EMAILS_BASE_PATH) && call[1]?.method === "POST",
    );
    expect(JSON.parse(String(emailCall?.[1]?.body)).associations[0].types[0].associationTypeId).toBe(
      HUBSPOT_ASSOC_EMAIL_TO_CONTACT,
    );
  });

  it("maps 401/403 to PERMISSION_FAILURE", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(401, { message: "unauthorized" }));
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await client.getContact("1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failureClass).toBe("PERMISSION_FAILURE");

    fetchImpl.mockResolvedValueOnce(jsonResponse(403, { message: "forbidden" }));
    const forbidden = await client.getContact("1");
    expect(forbidden.ok).toBe(false);
    if (!forbidden.ok) expect(forbidden.failureClass).toBe("PERMISSION_FAILURE");
  });

  it("maps validation 4xx to INTEGRATION_FAILURE", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(400, { message: "validation" }));
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await client.createContact({ email: "bad" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failureClass).toBe("INTEGRATION_FAILURE");
  });

  it("maps 404 authoritative absence to notFound", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(404, { message: "missing" }));
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await client.getContact("missing");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failureClass).toBe("INTEGRATION_FAILURE");
      expect(result.notFound).toBe(true);
    }
  });

  it("maps 429/5xx to RUNTIME/API_FAILURE", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(429, { message: "rate" }));
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const rate = await client.listNotes();
    expect(rate.ok).toBe(false);
    if (!rate.ok) expect(rate.failureClass).toBe("RUNTIME/API_FAILURE");

    fetchImpl.mockResolvedValueOnce(jsonResponse(503, { message: "down" }));
    const down = await client.listTasks();
    expect(down.ok).toBe(false);
    if (!down.ok) expect(down.failureClass).toBe("RUNTIME/API_FAILURE");
  });

  it("paginates listAll via paging.next.after", async () => {
    const fake = createFakeCrm({ pageSize: 2 });
    for (let i = 0; i < 5; i += 1) {
      fake.notes.set(String(i + 1), {
        id: String(i + 1),
        archived: false,
        properties: { hs_note_body: `n${i}`, [CAP001_PROP_RUN_ID]: "r" },
      });
    }
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
    });
    const listed = await client.listNotes();
    expect(listed.ok).toBe(true);
    if (listed.ok) expect(listed.data).toHaveLength(5);
    expect(fake.fetchMock.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("returns SCOPE_GAP for deal methods without deals scopes", async () => {
    const fake = createFakeCrm();
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });
    const created = await client.createDeal({ properties: { dealname: "x" } });
    expect(created.ok).toBe(false);
    if (!created.ok) {
      expect(created.failureClass).toBe("PERMISSION_FAILURE");
      expect(created.message).toMatch(/^SCOPE_GAP:/);
    }
    expect(fake.fetchMock).not.toHaveBeenCalled();
  });

  it("archives settled notes/tasks on 2026-09 paths; meetings/emails refuse DOC_CONFLICT", async () => {
    const fake = createFakeCrm();
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });
    fake.notes.set("n1", { id: "n1", archived: false, properties: {} });
    fake.tasks.set("t1", { id: "t1", archived: false, properties: {} });
    fake.meetings.set("m1", { id: "m1", archived: false, properties: {} });
    fake.emails.set("e1", { id: "e1", archived: false, properties: {} });

    expect((await client.archiveNote("n1")).ok).toBe(true);
    expect((await client.archiveTask("t1")).ok).toBe(true);

    const meetingArchive = await client.archiveMeeting("m1");
    expect(meetingArchive.ok).toBe(false);
    if (!meetingArchive.ok) {
      expect(meetingArchive.message).toBe(DOC_CONFLICT_MEETINGS_ARCHIVE);
      expect(meetingArchive.message).toMatch(/DOC_CONFLICT/);
    }

    const emailArchive = await client.archiveEmail("e1");
    expect(emailArchive.ok).toBe(false);
    if (!emailArchive.ok) {
      expect(emailArchive.message).toBe(DOC_CONFLICT_EMAILS_ARCHIVE);
      expect(emailArchive.message).toMatch(/DOC_CONFLICT/);
    }

    const deleteUrls = fake.fetchMock.mock.calls
      .filter((call) => call[1]?.method === "DELETE")
      .map((call) => String(call[0]));
    expect(deleteUrls).toEqual(
      expect.arrayContaining([
        `${HUBSPOT_API_BASE_URL}${cap001NoteArchivePath("n1")}`,
        `${HUBSPOT_API_BASE_URL}${cap001TaskArchivePath("t1")}`,
      ]),
    );
    expect(deleteUrls.every((url) => !url.includes("/meetings/"))).toBe(true);
    expect(deleteUrls.every((url) => !url.includes("/emails/"))).toBe(true);
    for (const url of deleteUrls) {
      expect(url).toMatch(/\/crm\/objects\/2026-09\/(notes|tasks)\//);
    }
  });

  it("lists activities and deals with associations=contacts query", async () => {
    const fake = createFakeCrm();
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    await client.listNotes();
    await client.listTasks();
    await client.listMeetings();
    await client.listEmails();
    await client.listDeals();
    const listUrls = fake.fetchMock.mock.calls.map((call) => String(call[0]));
    expect(listUrls.some((url) => url.includes("associations=contacts") && url.includes("/notes"))).toBe(
      true,
    );
    expect(listUrls.some((url) => url.includes("associations=contacts") && url.includes("/tasks"))).toBe(
      true,
    );
    expect(
      listUrls.some((url) => url.includes("associations=contacts") && url.includes("/meetings")),
    ).toBe(true);
    expect(listUrls.some((url) => url.includes("associations=contacts") && url.includes("/emails"))).toBe(
      true,
    );
    expect(listUrls.some((url) => url.includes("associations=contacts") && url.includes("/0-3"))).toBe(
      true,
    );
  });

  it("creates deals with Deal→Contact association type 3", async () => {
    const fake = createFakeCrm();
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    const contact = await client.createContact({
      email: "deal.owner@example.com",
      [CAP001_PROP_FIXTURE_ID]: "c-deal",
      [CAP001_PROP_RUN_ID]: "r",
    });
    expect(contact.ok).toBe(true);
    if (!contact.ok) return;
    const deal = await client.createDeal({
      contactId: contact.data.id,
      properties: {
        dealname: "Pipeline",
        [CAP001_PROP_CONTACT_EMAIL]: "deal.owner@example.com",
        [CAP001_PROP_RUN_ID]: "r",
      },
    });
    expect(deal.ok).toBe(true);
    const dealCall = fake.fetchMock.mock.calls.find(
      (call) => String(call[0]).includes(CAP001_DEALS_CRUD_BASE_PATH) && call[1]?.method === "POST",
    );
    expect(JSON.parse(String(dealCall?.[1]?.body)).associations[0].types[0].associationTypeId).toBe(
      HUBSPOT_ASSOC_DEAL_TO_CONTACT,
    );
    expect(HUBSPOT_ASSOC_DEAL_TO_CONTACT).toBe(3);
  });
});

describe("LiveHubSpotCap001Adapter (dry)", () => {
  it("default without deals scopes: seedBaseline SCOPE_GAP; contact families supported when client wired", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });
    expect([...adapter.supportedFamilies()].sort()).toEqual([...contactScopedReadyFamilies()].sort());
    expect(adapter.supportedFamilies().has("deals")).toBe(false);
    expect(adapter.supportedFamilies().has("outbounds")).toBe(false);
    expect(adapter.supportedFamilies().has("appointments")).toBe(false);

    const seeded = await adapter.seedBaseline("run-x");
    expect(seeded.ok).toBe(false);
    if (!seeded.ok) {
      expect(seeded.failureClass).toBe("SCOPE_GAP");
      expect(seeded.family).toBe("deals");
    }

    const notes = adapter.requireFamily("notes");
    expect(notes.ok).toBe(true);
    const appointments = adapter.requireFamily("appointments");
    expect(appointments.ok).toBe(false);
    if (!appointments.ok) {
      expect(appointments.failureClass).toBe("ADAPTER_GAP");
      expect(appointments.message).toMatch(/DOC_CONFLICT/);
    }
    const outbounds = adapter.requireFamily("outbounds");
    expect(outbounds.ok).toBe(false);
    if (!outbounds.ok) {
      expect(outbounds.failureClass).toBe("ADAPTER_GAP");
      expect(outbounds.message).toMatch(/DOC_CONFLICT/);
    }
    const deals = adapter.requireFamily("deals");
    expect(deals.ok).toBe(false);
    if (!deals.ok) expect(deals.failureClass).toBe("SCOPE_GAP");
  });

  it("adapter without client stays ADAPTER_GAP / empty supportedFamilies", async () => {
    const live = new LiveHubSpotCap001Adapter();
    expect(live.supportedFamilies().size).toBe(0);
    const seeded = await live.seedBaseline("x");
    expect(seeded.ok).toBe(false);
    if (!seeded.ok) expect(seeded.failureClass).toBe("ADAPTER_GAP");
    const notes = live.requireFamily("notes");
    expect(notes.ok).toBe(false);
    if (!notes.ok) expect(notes.failureClass).toBe("ADAPTER_GAP");
  });

  it("seedContactScopedBaseline + readContactScopedState dry path", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });
    const seeded = await adapter.seedContactScopedBaseline("run-contact");
    expect(seeded.ok).toBe(true);
    expect(fake.contacts.size).toBe(CAP001_SEED_CONTACTS.length);

    const state = await adapter.readContactScopedState("run-contact");
    expect(state.ok).toBe(true);
    if (state.ok) {
      expect(state.data.contacts).toHaveLength(CAP001_SEED_CONTACTS.length);
      expect(state.data.deals).toHaveLength(0);
      expect(state.data.appointments.some((row) => row.cayFixtureId === "appt-busy-lead007")).toBe(true);
    }
  });

  it("fails closed on partial fixture visibility", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });
    await adapter.seedContactScopedBaseline("partial");
    const first = [...fake.contacts.values()][0];
    first.archived = true;
    const state = await adapter.readContactScopedState("partial");
    expect(state.ok).toBe(false);
    if (!state.ok) {
      expect(state.failureClass).toBe("INTEGRATION_FAILURE");
      expect(state.message).toMatch(/Partial fixture visibility/);
    }
  });

  it("post-create failure attempts cleanup of created contacts", async () => {
    const fake = createFakeCrm();
    let createCount = 0;
    const wrapped = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "POST" && url.includes(CAP001_CONTACTS_BASE_PATH) && !url.includes("/search")) {
        createCount += 1;
        if (createCount === 3) {
          return jsonResponse(500, { message: "boom" });
        }
      }
      return fake.fetchImpl(input, init);
    });

    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: wrapped as unknown as typeof fetch,
      grantedScopes: CONTACT_SCOPES,
    });
    const seeded = await adapter.seedContactScopedBaseline("cleanup-run");
    expect(seeded.ok).toBe(false);
    const deletes = wrapped.mock.calls.filter(
      (call) => call[1]?.method === "DELETE" && String(call[0]).includes(CAP001_CONTACTS_BASE_PATH),
    );
    expect(deletes.length).toBeGreaterThanOrEqual(1);
  });

  it("with injected deals scopes: full seed/read/reset dry path clears scenario activity", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    expect(adapter.supportedFamilies().has("deals")).toBe(true);

    const seeded = await adapter.seedBaseline("full-run");
    expect(seeded.ok).toBe(true);
    expect(fake.deals.size).toBe(CAP001_SEED_DEALS.length);

    const contactId = [...fake.contacts.values()][0].id;
    await new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    }).createNote({
      contactId,
      properties: {
        hs_note_body: "scenario",
        [CAP001_PROP_FIXTURE_ID]: "n-scenario",
        [CAP001_PROP_RUN_ID]: "full-run",
        [CAP001_PROP_SCENARIO_ID]: "LEAD-001",
        [CAP001_PROP_KIND]: "note",
      },
    });
    expect([...fake.notes.values()].filter((row) => !row.archived)).toHaveLength(1);

    const reset = await adapter.reset("full-run");
    expect(reset.ok).toBe(true);
    expect([...fake.notes.values()].every((row) => row.archived)).toBe(true);

    const read = await adapter.readAuthoritativeState();
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.data.deals).toHaveLength(CAP001_SEED_DEALS.length);
      expect(read.data.notes).toHaveLength(0);
    }

    const dealUrls = fake.fetchMock.mock.calls
      .map((call) => String(call[0]))
      .filter(
        (url) =>
          url.includes(CAP001_DEALS_CRUD_BASE_PATH) || url.includes("/crm/objects/2026-03/0-3/"),
      );
    expect(dealUrls.length).toBeGreaterThan(0);
    expect(
      fake.fetchMock.mock.calls.every((call) => String(call[0]).startsWith(HUBSPOT_API_BASE_URL)),
    ).toBe(true);
  });

  it("snapshot stability settles on complete baseline graph", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    await adapter.seedBaseline("stable-run");
    const result = await snapshotWithBoundedRetry(adapter, {
      projectionVersion: HUBSPOT_CAP001_SNAPSHOT_VERSION,
      maxAttempts: 4,
    });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBeGreaterThanOrEqual(2);
  });

  it("fails closed when association mismatches cay_contact_email", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });
    const seeded = await adapter.seedContactScopedBaseline("assoc-mismatch");
    expect(seeded.ok).toBe(true);

    const meeting = [...fake.meetings.values()].find(
      (row) => row.properties[CAP001_PROP_FIXTURE_ID] === "appt-busy-lead007",
    );
    expect(meeting).toBeTruthy();
    const wrongContact = [...fake.contacts.values()].find(
      (row) => row.properties.email !== meeting!.properties[CAP001_PROP_CONTACT_EMAIL],
    );
    expect(wrongContact).toBeTruthy();
    meeting!.associations = { contacts: { results: [{ id: wrongContact!.id }] } };

    const state = await adapter.readContactScopedState("assoc-mismatch");
    expect(state.ok).toBe(false);
    if (!state.ok) {
      expect(state.failureClass).toBe("INTEGRATION_FAILURE");
      expect(state.message).toMatch(/association mismatch/i);
    }
  });

  it("fails closed as ambiguous when activity has expected+wrong contact associations", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });
    expect((await adapter.seedContactScopedBaseline("assoc-ambiguous-meeting")).ok).toBe(true);

    const meeting = [...fake.meetings.values()].find(
      (row) => row.properties[CAP001_PROP_FIXTURE_ID] === "appt-busy-lead007",
    );
    expect(meeting).toBeTruthy();
    const expectedContact = [...fake.contacts.values()].find(
      (row) => row.properties.email === meeting!.properties[CAP001_PROP_CONTACT_EMAIL],
    );
    const wrongContact = [...fake.contacts.values()].find(
      (row) => row.properties.email !== meeting!.properties[CAP001_PROP_CONTACT_EMAIL],
    );
    expect(expectedContact).toBeTruthy();
    expect(wrongContact).toBeTruthy();
    meeting!.associations = {
      contacts: { results: [{ id: expectedContact!.id }, { id: wrongContact!.id }] },
    };

    const state = await adapter.readContactScopedState("assoc-ambiguous-meeting");
    expect(state.ok).toBe(false);
    if (!state.ok) {
      expect(state.failureClass).toBe("INTEGRATION_FAILURE");
      expect(state.message).toMatch(/Ambiguous contact associations/i);
      expect(state.message).toMatch(/found 2/);
    }
  });

  it("fails closed when deal association mismatches cay_contact_email", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    expect((await adapter.seedBaseline("deal-assoc-mismatch")).ok).toBe(true);

    const deal = [...fake.deals.values()].find(
      (row) => row.properties[CAP001_PROP_FIXTURE_ID] === CAP001_SEED_DEALS[0].cayFixtureId,
    );
    expect(deal).toBeTruthy();
    const wrongContact = [...fake.contacts.values()].find(
      (row) => row.properties.email !== deal!.properties[CAP001_PROP_CONTACT_EMAIL],
    );
    expect(wrongContact).toBeTruthy();
    deal!.associations = { contacts: { results: [{ id: wrongContact!.id }] } };

    const state = await adapter.readAuthoritativeState();
    expect(state.ok).toBe(false);
    if (!state.ok) {
      expect(state.failureClass).toBe("INTEGRATION_FAILURE");
      expect(state.family).toBe("deals");
      expect(state.message).toMatch(/association mismatch/i);
    }
  });

  it("fails closed as ambiguous when deal has expected+wrong contact associations", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    expect((await adapter.seedBaseline("deal-assoc-ambiguous")).ok).toBe(true);

    const deal = [...fake.deals.values()].find(
      (row) => row.properties[CAP001_PROP_FIXTURE_ID] === CAP001_SEED_DEALS[0].cayFixtureId,
    );
    expect(deal).toBeTruthy();
    const expectedContact = [...fake.contacts.values()].find(
      (row) => row.properties.email === deal!.properties[CAP001_PROP_CONTACT_EMAIL],
    );
    const wrongContact = [...fake.contacts.values()].find(
      (row) => row.properties.email !== deal!.properties[CAP001_PROP_CONTACT_EMAIL],
    );
    expect(expectedContact).toBeTruthy();
    expect(wrongContact).toBeTruthy();
    deal!.associations = {
      contacts: { results: [{ id: expectedContact!.id }, { id: wrongContact!.id }] },
    };

    const state = await adapter.readAuthoritativeState();
    expect(state.ok).toBe(false);
    if (!state.ok) {
      expect(state.failureClass).toBe("INTEGRATION_FAILURE");
      expect(state.family).toBe("deals");
      expect(state.message).toMatch(/Ambiguous contact associations/i);
      expect(state.message).toMatch(/found 2/);
    }
  });

  it("fails closed when deal associations are missing despite cay_contact_email", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    expect((await adapter.seedBaseline("deal-assoc-missing")).ok).toBe(true);
    const deal = [...fake.deals.values()][0];
    deal.associations = undefined;
    const state = await adapter.readAuthoritativeState();
    expect(state.ok).toBe(false);
    if (!state.ok) {
      expect(state.failureClass).toBe("INTEGRATION_FAILURE");
      expect(state.family).toBe("deals");
      expect(state.message).toMatch(/Missing contact association/i);
    }
  });

  it("archives run-A note/task/deal leftovers on reset/seed run-B", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    expect((await adapter.seedBaseline("run-A")).ok).toBe(true);

    const contactId = [...fake.contacts.values()][0].id;
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    await client.createNote({
      contactId,
      properties: {
        hs_note_body: "A leftover",
        [CAP001_PROP_FIXTURE_ID]: "note-run-a",
        [CAP001_PROP_RUN_ID]: "run-A",
        [CAP001_PROP_SCENARIO_ID]: "LEAD-001",
        [CAP001_PROP_CONTACT_EMAIL]: [...fake.contacts.values()][0].properties.email,
        [CAP001_PROP_KIND]: "note",
      },
    });
    await client.createTask({
      contactId,
      properties: {
        hs_task_subject: "A task",
        [CAP001_PROP_FIXTURE_ID]: "task-run-a",
        [CAP001_PROP_RUN_ID]: "run-A",
        [CAP001_PROP_SCENARIO_ID]: "LEAD-001",
        [CAP001_PROP_CONTACT_EMAIL]: [...fake.contacts.values()][0].properties.email,
        [CAP001_PROP_KIND]: "task",
      },
    });
    await client.createDeal({
      contactId,
      properties: {
        dealname: "A scenario deal",
        [CAP001_PROP_FIXTURE_ID]: "deal-run-a-scenario",
        [CAP001_PROP_RUN_ID]: "run-A",
        [CAP001_PROP_SCENARIO_ID]: "LEAD-001",
        [CAP001_PROP_CONTACT_EMAIL]: [...fake.contacts.values()][0].properties.email,
      },
    });

    expect([...fake.notes.values()].some((row) => !row.archived)).toBe(true);

    const reset = await adapter.reset("run-B");
    expect(reset.ok).toBe(true);

    expect(
      [...fake.notes.values()]
        .filter((row) => row.properties[CAP001_PROP_FIXTURE_ID] === "note-run-a")
        .every((row) => row.archived),
    ).toBe(true);
    expect(
      [...fake.tasks.values()]
        .filter((row) => row.properties[CAP001_PROP_FIXTURE_ID] === "task-run-a")
        .every((row) => row.archived),
    ).toBe(true);
    expect(
      [...fake.deals.values()]
        .filter((row) => row.properties[CAP001_PROP_FIXTURE_ID] === "deal-run-a-scenario")
        .every((row) => row.archived),
    ).toBe(true);

    const state = await adapter.readAuthoritativeState();
    expect(state.ok).toBe(true);
    if (state.ok) {
      expect(state.data.runId).toBe("run-B");
      expect(state.data.deals).toHaveLength(CAP001_SEED_DEALS.length);
      expect(state.data.deals.every((row) => row.cayRunId === "run-B")).toBe(true);
      expect(state.data.notes).toHaveLength(0);
      expect(state.data.tasks).toHaveLength(0);
      expect(state.data.appointments.every((row) => row.cayRunId === "run-B")).toBe(true);
      expect(state.data.appointments.some((row) => row.cayFixtureId === "appt-busy-lead007")).toBe(true);
    }
  });

  it("fails closed DOC_CONFLICT when reset would archive meeting/email leftovers", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    expect((await adapter.seedBaseline("run-A")).ok).toBe(true);

    const contactId = [...fake.contacts.values()][0].id;
    const email = [...fake.contacts.values()][0].properties.email!;
    const client = new Cap001HubSpotHttpClient({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: FULL_SCOPES,
    });
    await client.createEmail({
      contactId,
      properties: {
        hs_email_text: "A email",
        [CAP001_PROP_FIXTURE_ID]: "email-run-a",
        [CAP001_PROP_RUN_ID]: "run-A",
        [CAP001_PROP_SCENARIO_ID]: "LEAD-001",
        [CAP001_PROP_CONTACT_EMAIL]: email,
        [CAP001_PROP_KIND]: "outbound",
      },
    });
    await client.createMeeting({
      contactId,
      properties: {
        hs_meeting_title: "A meeting",
        [CAP001_PROP_FIXTURE_ID]: "meeting-run-a",
        [CAP001_PROP_RUN_ID]: "run-A",
        [CAP001_PROP_SCENARIO_ID]: "LEAD-001",
        [CAP001_PROP_CONTACT_EMAIL]: email,
        [CAP001_PROP_KIND]: "appointment",
      },
    });

    const reset = await adapter.reset("run-B");
    expect(reset.ok).toBe(false);
    if (!reset.ok) {
      expect(reset.failureClass).toBe("ADAPTER_GAP");
      expect(reset.message).toMatch(/DOC_CONFLICT/);
    }
    expect(
      [...fake.emails.values()]
        .filter((row) => row.properties[CAP001_PROP_FIXTURE_ID] === "email-run-a")
        .every((row) => !row.archived),
    ).toBe(true);
    expect(
      [...fake.meetings.values()]
        .filter((row) => row.properties[CAP001_PROP_FIXTURE_ID] === "meeting-run-a")
        .every((row) => !row.archived),
    ).toBe(true);
    expect(fake.fetchMock.mock.calls.every((call) => call[1]?.method !== "DELETE" || !String(call[0]).includes("/emails/"))).toBe(
      true,
    );
    expect(
      fake.fetchMock.mock.calls.every(
        (call) => call[1]?.method !== "DELETE" || !String(call[0]).includes("/meetings/"),
      ),
    ).toBe(true);
  });

  it("rebinds baseline meeting cay_run_id across contact-scoped seeds", async () => {
    const fake = createFakeCrm();
    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: fake.fetchImpl,
      grantedScopes: CONTACT_SCOPES,
    });
    expect((await adapter.seedContactScopedBaseline("run-A")).ok).toBe(true);
    expect((await adapter.seedContactScopedBaseline("run-B")).ok).toBe(true);

    const meeting = [...fake.meetings.values()].find(
      (row) => row.properties[CAP001_PROP_FIXTURE_ID] === "appt-busy-lead007" && !row.archived,
    );
    expect(meeting?.properties[CAP001_PROP_RUN_ID]).toBe("run-B");

    const state = await adapter.readContactScopedState("run-B");
    expect(state.ok).toBe(true);
    if (state.ok) {
      const appt = state.data.appointments.find((row) => row.cayFixtureId === "appt-busy-lead007");
      expect(appt?.cayRunId).toBe("run-B");
      expect(state.data.appointments.every((row) => row.cayRunId !== "run-A")).toBe(true);
    }
  });

  it("deal-stage failure archives contacts; meeting cleanup fails DOC_CONFLICT", async () => {
    const fake = createFakeCrm();
    const wrapped = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method === "POST" && url.includes(CAP001_DEALS_CRUD_BASE_PATH) && url.endsWith("/0-3")) {
        return jsonResponse(500, { message: "deal create boom" });
      }
      return fake.fetchImpl(input, init);
    });

    const adapter = new LiveHubSpotCap001Adapter({
      accessToken: "t",
      fetchImpl: wrapped as unknown as typeof fetch,
      grantedScopes: FULL_SCOPES,
    });
    const seeded = await adapter.seedBaseline("deal-fail-run");
    expect(seeded.ok).toBe(false);
    if (!seeded.ok) {
      expect(seeded.message).toMatch(/deal create boom/);
      expect(seeded.message).toMatch(/DOC_CONFLICT/);
      expect(seeded.family).toBe("deals");
    }

    expect([...fake.contacts.values()].every((row) => row.archived)).toBe(true);
    // Meeting archive is DOC_CONFLICT — created meetings must remain (fail closed).
    expect([...fake.meetings.values()].some((row) => !row.archived)).toBe(true);
    expect(fake.deals.size).toBe(0);

    const deleteUrls = wrapped.mock.calls
      .filter((call) => call[1]?.method === "DELETE")
      .map((call) => String(call[0]));
    expect(deleteUrls.some((url) => url.includes(CAP001_CONTACTS_BASE_PATH))).toBe(true);
    expect(deleteUrls.every((url) => !url.includes("/meetings/"))).toBe(true);
  });
});
