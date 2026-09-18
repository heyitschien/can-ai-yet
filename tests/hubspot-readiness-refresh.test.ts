import { describe, expect, it } from "vitest";
import { CAP001_METADATA_PLAN } from "@/evals/hubspot/cap001/metadata-plan";
import {
  buildCap001MetadataSetupOperationMatrix,
  buildCap001PropertyGroupSpecs,
  buildCap001PropertySpecs,
  buildDryMetadataProvisioningPlan,
  CAP001_METADATA_SETUP_CREDENTIAL_SCOPES,
  countSpecsByObjectType,
  createPropertyGroupRequestBody,
  createPropertyRequestBody,
  evaluatePropertyIdempotence,
  evaluateSetupCredentialEnvelopeCoverage,
} from "@/evals/hubspot/cap001/metadata-provisioning";
import {
  CAP001_HUBSPOT_METADATA_PROVISIONING,
  genuinelyNewScopesFromMatrix,
} from "@/evals/hubspot/cap001/scope-matrix";
import {
  classifyHubSpotWriteValidation,
  evaluatePropertyCatalogForWriteRisk,
  HUBSPOT_WRITE_VALIDATION_UI_CHECKLIST,
} from "@/evals/hubspot/cap001/write-validation";

describe("CAP-001 dry metadata provisioning package", () => {
  it("enumerates every family-specific cay_* property from the metadata plan", () => {
    const specs = buildCap001PropertySpecs();
    const counts = countSpecsByObjectType(specs);

    expect(counts.contacts).toBe(CAP001_METADATA_PLAN.contactProperties.length);
    expect(counts.deals).toBe(CAP001_METADATA_PLAN.dealProperties.length);
    expect(counts.notes).toBe(CAP001_METADATA_PLAN.engagementProperties.length);
    expect(counts.tasks).toBe(CAP001_METADATA_PLAN.engagementProperties.length);
    expect(counts.meetings).toBe(CAP001_METADATA_PLAN.engagementProperties.length);
    expect(counts.emails).toBe(CAP001_METADATA_PLAN.engagementProperties.length);

    expect(CAP001_HUBSPOT_METADATA_PROVISIONING.objectTypesNeedingCayProperties).toEqual([
      "contacts",
      "deals",
      "notes",
      "tasks",
      "meetings",
      "emails",
    ]);

    const namesByFamily = new Map<string, Set<string>>();
    for (const spec of specs) {
      const set = namesByFamily.get(spec.objectType) ?? new Set();
      set.add(spec.payload.name);
      namesByFamily.set(spec.objectType, set);
    }
    expect([...namesByFamily.get("contacts")!].sort()).toEqual(
      CAP001_METADATA_PLAN.contactProperties.map((p) => p.name).slice().sort(),
    );
  });

  it("builds exact create-property payloads (string/text) without mutating HubSpot", () => {
    const [first] = buildCap001PropertySpecs();
    const body = createPropertyRequestBody(first);
    expect(body).toEqual({
      name: first.payload.name,
      label: first.payload.label,
      type: "string",
      fieldType: "text",
      groupName: "cay_cap001",
      description: first.purpose,
      hasUniqueValue: false,
      hidden: false,
      formField: false,
    });
  });

  it("models cay_cap001 property groups per object family (not portal-global)", () => {
    const groups = buildCap001PropertyGroupSpecs();
    expect(groups).toHaveLength(6);
    expect(groups.map((g) => g.objectType).sort()).toEqual([
      "contacts",
      "deals",
      "emails",
      "meetings",
      "notes",
      "tasks",
    ].sort());
    for (const group of groups) {
      expect(group.payload).toEqual({
        name: "cay_cap001",
        label: "CanAIYet CAP-001",
        displayOrder: 10_000,
      });
      expect(group.createEndpoint).toBe("POST /crm/properties/2026-09/{objectType}/groups");
      expect(createPropertyGroupRequestBody(group)).toEqual(group.payload);
    }
  });

  it("blocks property creates until the same-family group is READY; fail-closed on conflicts", () => {
    const specs = buildCap001PropertySpecs();
    const contactFixture = specs.find(
      (s) => s.objectType === "contacts" && s.payload.name === "cay_fixture_id",
    )!;

    expect(evaluatePropertyIdempotence(contactFixture, undefined).status).toBe("MISSING");
    expect(
      evaluatePropertyIdempotence(contactFixture, {
        name: "cay_fixture_id",
        type: "string",
        fieldType: "text",
      }).status,
    ).toBe("MATCH");
    const bad = evaluatePropertyIdempotence(contactFixture, {
      name: "cay_fixture_id",
      type: "number",
      fieldType: "number",
    });
    expect(bad.status).toBe("INCOMPATIBLE");

    const emptyPlan = buildDryMetadataProvisioningPlan();
    expect(emptyPlan.groupsToCreate).toHaveLength(6);
    expect(emptyPlan.familiesWithGroupReady).toHaveLength(0);
    expect(emptyPlan.toCreate).toHaveLength(0);
    expect(emptyPlan.propertiesBlockedUntilGroupReady).toHaveLength(specs.length);
    expect(emptyPlan.ok).toBe(true);

    const readyGroups = new Map(
      CAP001_METADATA_PLAN.objectFamilies.map((objectType) => [
        objectType,
        [
          {
            name: "cay_cap001",
            label: "CanAIYet CAP-001",
            displayOrder: 10_000,
            archived: false,
          },
        ],
      ] as const),
    );
    const groupsReadyPlan = buildDryMetadataProvisioningPlan(new Map(), readyGroups);
    expect(groupsReadyPlan.groupsToCreate).toHaveLength(0);
    expect(groupsReadyPlan.familiesWithGroupReady).toHaveLength(6);
    expect(groupsReadyPlan.toCreate).toHaveLength(specs.length);
    expect(groupsReadyPlan.propertiesBlockedUntilGroupReady).toHaveLength(0);

    const conflictPlan = buildDryMetadataProvisioningPlan(
      new Map([
        [
          "contacts",
          [{ name: "cay_fixture_id", type: "number", fieldType: "number" }],
        ],
      ]),
      readyGroups,
    );
    expect(conflictPlan.ok).toBe(false);
    expect(conflictPlan.incompatible.length).toBeGreaterThan(0);

    const archivedGroupPlan = buildDryMetadataProvisioningPlan(
      new Map(),
      new Map([
        [
          "contacts",
          [{ name: "cay_cap001", label: "CanAIYet CAP-001", archived: true }],
        ],
      ]),
    );
    expect(archivedGroupPlan.ok).toBe(false);
    expect(archivedGroupPlan.groupsIncompatible[0]?.spec.objectType).toBe("contacts");
    expect(
      archivedGroupPlan.propertiesBlockedUntilGroupReady.some((s) => s.objectType === "contacts"),
    ).toBe(true);
  });

  it("declares a Service Key–executable setup envelope for contacts+deals only (not activity schemas)", () => {
    expect(CAP001_METADATA_SETUP_CREDENTIAL_SCOPES).toEqual([
      "crm.schemas.contacts.read",
      "crm.schemas.contacts.write",
      "crm.schemas.deals.read",
      "crm.schemas.deals.write",
    ]);

    // Prior PR #33 12-scope packet is not executable in portal 247381023.
    for (const absent of [
      "crm.schemas.notes.read",
      "crm.schemas.notes.write",
      "crm.schemas.tasks.read",
      "crm.schemas.tasks.write",
      "crm.schemas.meetings.read",
      "crm.schemas.meetings.write",
      "crm.schemas.emails.read",
      "crm.schemas.emails.write",
    ]) {
      expect(CAP001_METADATA_SETUP_CREDENTIAL_SCOPES).not.toContain(absent);
    }

    const matrix = buildCap001MetadataSetupOperationMatrix();
    expect(matrix.length).toBe(2 * 5); // contacts + deals only
    for (const objectType of ["contacts", "deals"] as const) {
      const rows = matrix.filter((row) => row.objectType === objectType);
      expect(rows.some((r) => r.method === "GET" && r.operation.includes("group"))).toBe(true);
      expect(rows.some((r) => r.method === "POST" && r.operation === "groups.create")).toBe(true);
      expect(rows.some((r) => r.method === "GET" && r.operation.includes("properties"))).toBe(true);
      expect(rows.some((r) => r.method === "POST" && r.operation === "properties.create")).toBe(true);
      expect(rows.some((r) => r.step === "4.post_read_parity")).toBe(true);
    }
    expect(matrix.every((r) => r.objectType === "contacts" || r.objectType === "deals")).toBe(
      true,
    );

    const coverage = evaluateSetupCredentialEnvelopeCoverage();
    expect(coverage.ok).toBe(true);
    expect(coverage.missingByOperation).toEqual([]);

    const dry = buildDryMetadataProvisioningPlan();
    expect(dry.futureSetupOrder.join("\n")).toMatch(/CONTACTS\+DEALS/i);
    expect(dry.futureSetupOrder.join("\n")).toMatch(/UNMAPPED/i);
    expect(dry.futureSetupOrder.join("\n")).toMatch(/retire\/rotate.*contacts\+deals/i);

    const writeOnly = CAP001_METADATA_SETUP_CREDENTIAL_SCOPES.filter((s) => s.endsWith(".write"));
    const writeOnlyCoverage = evaluateSetupCredentialEnvelopeCoverage(writeOnly);
    expect(writeOnlyCoverage.ok).toBe(false);
    expect(writeOnlyCoverage.missingByOperation.length).toBeGreaterThan(0);
  });
});

describe("2026-09 write validation attribution", () => {
  it("classifies conditional required / create-record / associations as portal write validation", () => {
    const conditional = classifyHubSpotWriteValidation({
      status: 400,
      message: "Property 'close_date' is required when 'dealstage' is set to 'closedwon'.",
    });
    expect(conditional.failureClass).toBe("INTEGRATION_FAILURE");
    expect(conditional.attribution).toBe("HUBSPOT_PORTAL_WRITE_VALIDATION");
    expect(conditional.kind).toBe("CONDITIONAL_REQUIRED_PROPERTY");
    expect(conditional.neverModelFailure).toBe(true);

    const createRecord = classifyHubSpotWriteValidation({
      status: 400,
      message: "Missing required association for Create Record settings",
    });
    expect(createRecord.kind).toBe("CREATE_RECORD_REQUIRED");
    expect(createRecord.attribution).toBe("HUBSPOT_PORTAL_WRITE_VALIDATION");

    const associations = classifyHubSpotWriteValidation({
      status: 400,
      message: "Missing 'Edit Associations' permission.",
    });
    expect(associations.kind).toBe("EDIT_ASSOCIATIONS_PERMISSION");
  });

  it("does not label unmatched/malformed 400 as portal write validation", () => {
    const malformed = classifyHubSpotWriteValidation({
      status: 400,
      message: "INVALID_PROPERTY_VALUE: property 'email' had value that was not valid",
    });
    expect(malformed.failureClass).toBe("INTEGRATION_FAILURE");
    expect(malformed.attribution).toBe("OTHER");
    expect(malformed.kind).toBe("GENERIC_VALIDATION");
    expect(malformed.neverModelFailure).toBe(true);

    const genericRequired = classifyHubSpotWriteValidation({
      status: 400,
      message: "Missing required field: properties",
    });
    expect(genericRequired.failureClass).toBe("INTEGRATION_FAILURE");
    expect(genericRequired.attribution).toBe("OTHER");
    expect(genericRequired.kind).toBe("GENERIC_VALIDATION");
    expect(genericRequired.neverModelFailure).toBe(true);
  });

  it("keeps UI checklist and detects metadata gaps from property catalogs", () => {
    expect(HUBSPOT_WRITE_VALIDATION_UI_CHECKLIST.length).toBeGreaterThanOrEqual(3);

    const cayNames = CAP001_METADATA_PLAN.contactProperties.map((p) => p.name);
    const preflight = evaluatePropertyCatalogForWriteRisk({
      objectType: "contacts",
      requiredCayNames: cayNames,
      definitions: [
        { name: "email", type: "string", fieldType: "text", required: true },
        { name: "cay_fixture_id", type: "string", fieldType: "text" },
      ],
    });
    expect(preflight.apiObservableRequiredNames).toEqual(["email"]);
    expect(preflight.missingCayPropertyNames.length).toBe(cayNames.length - 1);
    expect(preflight.attributionIfBlocked).toBe("HUBSPOT_METADATA_GAP");
    expect(preflight.uiChecklistRequired).toBe(true);
  });
});

describe("Deals scope delta stays minimal", () => {
  it("still proposes only deals.read + deals.write", () => {
    expect(genuinelyNewScopesFromMatrix()).toEqual([
      "crm.objects.deals.read",
      "crm.objects.deals.write",
    ]);
  });
});
