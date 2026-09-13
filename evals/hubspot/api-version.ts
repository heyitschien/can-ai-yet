/**
 * Official HubSpot Contacts API path/version choice for CAY-06.
 *
 * Decision (CAY-06 Stage A correction): pin documented `2026-03`.
 * HubSpot migration guidance: copy the documented endpoint path exactly;
 * do not guess newer date versions from changelogs or guide HTML drift.
 *
 * Primary sources (Contacts reference / OpenAPI):
 * - https://developers.hubspot.com/docs/api-reference/latest/crm/objects/contacts/get-contacts
 *   → `GET /crm/objects/2026-03/{objectType}`
 * - https://developers.hubspot.com/docs/api-reference/latest/crm/objects/contacts/create-contact
 *   → `POST /crm/objects/2026-03/{objectType}`
 *
 * Do not fall back to legacy `/crm/v3/...` for new live commissioning.
 */

export const HUBSPOT_API_HOST = "https://api.hubapi.com";
export const HUBSPOT_API_VERSION = "2026-03";
export const HUBSPOT_CONTACTS_PATH = `/crm/objects/${HUBSPOT_API_VERSION}/contacts`;
export const HUBSPOT_CONTACTS_URL = `${HUBSPOT_API_HOST}${HUBSPOT_CONTACTS_PATH}`;

export const HUBSPOT_LIVE_ADAPTER_VERSION = "hubspot-commissioning-live-v1";
export const HUBSPOT_LAB_PORTAL_ID = "247381023";
export const HUBSPOT_LAB_ACCOUNT_NAME = "CanAIYet CAP-001 Lab";
export const HUBSPOT_SERVICE_KEY_NAME = "CanAIYet CAP-001 Commissioning";

export const HUBSPOT_GRANTED_SCOPES = [
  "crm.objects.contacts.read",
  "crm.objects.contacts.write",
] as const;

/** Standard property used for the harmless update proof (no custom properties). */
export const HUBSPOT_UPDATE_PROPERTY = "jobtitle";
export const HUBSPOT_UPDATE_VALUE = "cay-commissioning-ok";

export const HUBSPOT_CONTACT_PROPERTIES = [
  "email",
  "firstname",
  "lastname",
  "company",
  HUBSPOT_UPDATE_PROPERTY,
] as const;

export const HUBSPOT_API_VERSION_SOURCE =
  "https://developers.hubspot.com/docs/api-reference/latest/crm/objects/contacts/get-contacts";
