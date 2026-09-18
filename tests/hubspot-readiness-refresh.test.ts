import { describe, expect, it } from "vitest";
import { CAP001_METADATA_PLAN } from "@/evals/hubspot/cap001/metadata-plan";
import {
  buildCap001PropertySpecs,
  buildDryMetadataProvisioningPlan,
  countSpecsByObjectType,
  createPropertyRequestBody,
  evaluatePropertyIdempotence,
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

  it("is idempotent: MATCH no-op, MISSING enqueue, INCOMPATIBLE fail closed", () => {
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
    expect(emptyPlan.toCreate).toHaveLength(specs.length);
    expect(emptyPlan.ok).toBe(true);

    const conflictPlan = buildDryMetadataProvisioningPlan(
      new Map([
        [
          "contacts",
          [{ name: "cay_fixture_id", type: "number", fieldType: "number" }],
        ],
      ]),
    );
    expect(conflictPlan.ok).toBe(false);
    expect(conflictPlan.incompatible.length).toBeGreaterThan(0);
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
