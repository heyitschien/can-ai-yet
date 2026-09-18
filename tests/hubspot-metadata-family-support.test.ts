import { describe, expect, it } from "vitest";
import {
  CAP001_METADATA_FAMILY_SUPPORT,
  CAP001_SERVICE_KEY_EXECUTABLE_SETUP_SCOPES,
  HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE,
  cheapestFaithfulIdentityPreservationProposal,
  evaluateActivityCayPropertyAlternatives,
  metadataFamilySupport,
  serviceKeySchemaSupportedFamilies,
  serviceKeySchemaUnsupportedFamilies,
} from "@/evals/hubspot/cap001/metadata-family-support";
import { CAP001_HUBSPOT_METADATA_PROVISIONING } from "@/evals/hubspot/cap001/scope-matrix";

describe("HubSpot Service Key scope catalog correction", () => {
  it("records live catalog: contacts+deals schema scopes only", () => {
    expect(HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.portalId).toBe("247381023");
    expect([...HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.schemaScopesExposed].sort()).toEqual(
      [...CAP001_SERVICE_KEY_EXECUTABLE_SETUP_SCOPES].sort(),
    );
    expect(HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.schemaScopesNotExposed).toContain(
      "crm.schemas.notes.write",
    );
    expect(HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.schemaScopesNotExposed).toContain(
      "crm.schemas.emails.read",
    );
    expect(
      HUBSPOT_LAB_SERVICE_KEY_SCOPE_CATALOG_EVIDENCE.scientificClassification,
    ).toBe("environment_permission_or_representation_mismatch_not_model_failure");
  });

  it("classifies each family from evidence without privilege substitution", () => {
    expect(metadataFamilySupport("contacts").classification).toBe("SUPPORTED_SERVICE_KEY");
    expect(metadataFamilySupport("deals").classification).toBe("SUPPORTED_SERVICE_KEY");
    expect(metadataFamilySupport("notes").classification).toBe("UNMAPPED");
    expect(metadataFamilySupport("emails").classification).toBe("UNMAPPED");
    expect(metadataFamilySupport("tasks").classification).toBe("UI_ONLY_OR_BETA");
    expect(metadataFamilySupport("meetings").classification).toBe("UI_ONLY_OR_BETA");

    expect(serviceKeySchemaSupportedFamilies()).toEqual(["contacts", "deals"]);
    expect(serviceKeySchemaUnsupportedFamilies().sort()).toEqual([
      "emails",
      "meetings",
      "notes",
      "tasks",
    ]);

    for (const row of CAP001_METADATA_FAMILY_SUPPORT) {
      if (row.classification === "SUPPORTED_SERVICE_KEY") {
        expect(row.serviceKeyCanAuthorizeSchemaCreate).toBe(true);
        expect(row.serviceKeyCatalogExposesSchemaScopes).toBe(true);
      } else {
        expect(row.serviceKeyCanAuthorizeSchemaCreate).toBe(false);
        expect(row.serviceKeyCatalogExposesSchemaScopes).toBe(false);
      }
    }

    expect(
      CAP001_HUBSPOT_METADATA_PROVISIONING.objectTypesServiceKeyExecutableCayProperties,
    ).toEqual(["contacts", "deals"]);
  });

  it("rejects association-only and body-encoding activity identity (false-positive fail closed)", () => {
    const findings = evaluateActivityCayPropertyAlternatives();
    const associationOnly = findings.find((f) =>
      f.strategy.startsWith("association_only_archive"),
    );
    const bodyEncode = findings.find((f) => f.strategy.startsWith("encode_run_or_fixture"));
    const ledger = findings.find((f) => f.strategy.startsWith("seed_time_native"));
    const contactsDealsOnly = findings.find((f) =>
      f.strategy.startsWith("contacts_and_deals_cay_properties_only"),
    );

    expect(associationOnly?.verdict).toBe("reject_fail_closed");
    expect(associationOnly?.falsePositiveRisk).toBe("high");
    expect(bodyEncode?.verdict).toBe("reject_fail_closed");
    expect(ledger?.verdict).toBe("viable_with_controls");
    expect(ledger?.falsePositiveRisk).toBe("unproven");
    expect(contactsDealsOnly?.verdict).toBe("viable_with_controls");
    expect(contactsDealsOnly?.preservesExam).toBe(true);

    const proposal = cheapestFaithfulIdentityPreservationProposal();
    expect(proposal.examUnchanged).toBe(true);
    expect(proposal.provisionCayPropertiesOn).toEqual(["contacts", "deals"]);
    expect([...proposal.doNotProvisionViaServiceKey].sort()).toEqual([
      "emails",
      "meetings",
      "notes",
      "tasks",
    ]);
    expect(proposal.serviceKeySetupScopes).toHaveLength(4);
  });
});
