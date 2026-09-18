export {
  CAP001_EXPECTED_BASELINE_COUNTS,
  CAP001_SEED_APPOINTMENTS,
  CAP001_SEED_CONTACTS,
  CAP001_SEED_DEALS,
} from "@/evals/hubspot/cap001/seed-graph";
export {
  calibrateForbiddenDetection,
  calibrateScenarioAgainstBaseline,
  captureAuthoritativeSnapshot,
  runTripleDryReset,
} from "@/evals/hubspot/cap001/calibration";
export { LiveHubSpotCap001Adapter } from "@/evals/hubspot/cap001/live-adapter";
export {
  Cap001HubSpotHttpClient,
  isScopeGapMessage,
  mapClientFailureToEnv,
} from "@/evals/hubspot/cap001/http-client";
export { CAP001_METADATA_PLAN } from "@/evals/hubspot/cap001/metadata-plan";
export {
  buildCap001MetadataSetupOperationMatrix,
  buildCap001PropertyGroupSpecs,
  buildCap001PropertySpecs,
  buildDryMetadataProvisioningPlan,
  CAP001_METADATA_SETUP_CREDENTIAL_SCOPES,
  countSpecsByObjectType,
  createPropertyGroupRequestBody,
  createPropertyRequestBody,
  evaluatePropertyGroupIdempotence,
  evaluatePropertyIdempotence,
  evaluateSetupCredentialEnvelopeCoverage,
  METADATA_CREATE_PROPERTY_DOC,
  METADATA_CREATE_PROPERTY_ENDPOINT,
  METADATA_CREATE_PROPERTY_GROUP_DOC,
  METADATA_CREATE_PROPERTY_GROUP_ENDPOINT,
} from "@/evals/hubspot/cap001/metadata-provisioning";
export type {
  Cap001MetadataObjectType,
  Cap001MetadataSetupOperation,
  Cap001PropertyGroupSpec,
  Cap001PropertySpec,
  DryMetadataProvisioningPlan,
} from "@/evals/hubspot/cap001/metadata-provisioning";
export {
  classifyHubSpotWriteValidation,
  evaluatePropertyCatalogForWriteRisk,
  HUBSPOT_WRITE_VALIDATION_CHANGELOG_URL,
  HUBSPOT_WRITE_VALIDATION_UI_CHECKLIST,
} from "@/evals/hubspot/cap001/write-validation";
export type {
  HubSpotFailureAttribution,
  HubSpotWriteValidationClassification,
} from "@/evals/hubspot/cap001/write-validation";
export {
  CAP001_HUBSPOT_SCENARIO_MAPPING,
  comparisonScenarioIds,
  contactScopedReadyFamilies,
  liveReadyScenarioIds,
  mappedScenarioIds,
  unmappedScenarioIds,
} from "@/evals/hubspot/cap001/mapping";
export { CAP001_LIVE_ADAPTER_PROVENANCE } from "@/evals/hubspot/cap001/provenance";
export type { VendorEvidenceRow } from "@/evals/hubspot/cap001/provenance";
export {
  CAP001_HUBSPOT_DEAL_ENV_LIFECYCLE,
  CAP001_HUBSPOT_METADATA_PROVISIONING,
  CAP001_HUBSPOT_SCOPE_MATRIX,
  CAP001_HUBSPOT_SCOPE_MATRIX_WITH_ENV,
  CAP001_LIVE_ENVIRONMENT_SCOPE_BLOCKER,
  HUBSPOT_CAP001_API_VERSIONS_BY_FAMILY,
  HUBSPOT_CAP001_API_VERSIONS_BY_OPERATION,
  HUBSPOT_DEAL_OBJECT_TYPE_ID,
  HUBSPOT_GRANTED_SCOPES,
  genuinelyNewScopesFromMatrix,
  toolRowsBlockedAdapter,
  toolRowsBlockedScope,
} from "@/evals/hubspot/cap001/scope-matrix";
export { preflightCap001HubSpotEnv, resetAndPreflight, seedAndPreflight } from "@/evals/hubspot/cap001/preflight";
export type { Cap001ObjectFamily, HubSpotCap001EnvironmentPort } from "@/evals/hubspot/cap001/port";
export {
  normalizeStateFingerprint,
  projectHubSpotWorldSnapshot,
  requiredBaselineFixtureIds,
  snapshotWithBoundedRetry,
  stateHasRequiredBaselineFixtures,
  type HubSpotWorldSnapshot,
} from "@/evals/hubspot/cap001/snapshot";
export { HubSpotCap001Store } from "@/evals/hubspot/cap001/store";
export type {
  HubSpotLiveStatus,
  HubSpotScenarioMapping,
  HubSpotSemanticStatus,
} from "@/evals/hubspot/cap001/types";
export {
  HUBSPOT_CAP001_ADAPTER_VERSION,
  HUBSPOT_CAP001_ENVIRONMENT_ID,
  HUBSPOT_CAP001_ENVIRONMENT_VERSION,
  HUBSPOT_CAP001_PERMISSION_VERSION,
  HUBSPOT_CAP001_RUNNER_VERSION,
  HUBSPOT_CAP001_SEED_RESET_VERSION,
  HUBSPOT_CAP001_SNAPSHOT_VERSION,
} from "@/evals/hubspot/cap001/versions";
export {
  CAP001_CONTACTS_BASE_PATH,
  CAP001_DEFAULT_GRANTED_SCOPES,
  HUBSPOT_API_BASE_URL,
  HUBSPOT_ASSOC_DEAL_TO_CONTACT,
  HUBSPOT_ASSOC_EMAIL_TO_CONTACT,
  HUBSPOT_ASSOC_MEETING_TO_CONTACT,
  HUBSPOT_ASSOC_NOTE_TO_CONTACT,
  HUBSPOT_ASSOC_TASK_TO_CONTACT,
  RESOLVED_VERSION_COEXISTENCE_MEETINGS_EMAILS_ARCHIVE,
  SCOPE_CONTACTS_READ,
  SCOPE_CONTACTS_WRITE,
  SCOPE_DEALS_READ,
  SCOPE_DEALS_WRITE,
  cap001EmailArchivePath,
  cap001MeetingArchivePath,
  cap001NoteArchivePath,
  cap001TaskArchivePath,
} from "@/evals/hubspot/cap001/paths";
