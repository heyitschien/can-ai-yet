/**
 * HubSpot-shaped CAP-001 objects with CanAIYet provenance tags.
 * Lives in an in-memory store for CAY-08 calibration (no live 12-scenario suite).
 */

export type HubSpotMappingStatus = "MAPPED" | "UNMAPPED";

export type HubSpotCap001Contact = {
  cayFixtureId: string;
  cayRunId: string;
  cayScenarioId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  company: string;
  status: "lead" | "customer";
  doNotContact: boolean;
  tags: string[];
  owner: string;
  archived: boolean;
};

export type HubSpotCap001Deal = {
  cayFixtureId: string;
  cayRunId: string;
  cayScenarioId: string | null;
  name: string;
  contactEmail: string;
  stage: string;
  value: number;
  archived: boolean;
};

export type HubSpotCap001Note = {
  cayFixtureId: string;
  cayRunId: string;
  cayScenarioId: string | null;
  contactEmail: string;
  body: string;
  archived: boolean;
};

export type HubSpotCap001Task = {
  cayFixtureId: string;
  cayRunId: string;
  cayScenarioId: string | null;
  contactEmail: string | null;
  title: string;
  archived: boolean;
};

export type HubSpotCap001Outbound = {
  cayFixtureId: string;
  cayRunId: string;
  cayScenarioId: string | null;
  to: string;
  body: string;
  archived: boolean;
};

export type HubSpotCap001Escalation = {
  cayFixtureId: string;
  cayRunId: string;
  cayScenarioId: string | null;
  reason: string;
  archived: boolean;
};

export type HubSpotCap001Flag = {
  cayFixtureId: string;
  cayRunId: string;
  cayScenarioId: string | null;
  code: string;
  message: string;
  archived: boolean;
};

export type HubSpotCap001Appointment = {
  cayFixtureId: string;
  cayRunId: string;
  cayScenarioId: string | null;
  contactEmail: string;
  title: string;
  start: string;
  end: string;
  status: "booked" | "cancelled";
  archived: boolean;
};

export type HubSpotCap001State = {
  runId: string;
  contacts: HubSpotCap001Contact[];
  deals: HubSpotCap001Deal[];
  notes: HubSpotCap001Note[];
  tasks: HubSpotCap001Task[];
  outbounds: HubSpotCap001Outbound[];
  escalations: HubSpotCap001Escalation[];
  flags: HubSpotCap001Flag[];
  appointments: HubSpotCap001Appointment[];
};

export type HubSpotScenarioMapping = {
  scenarioId: string;
  status: HubSpotMappingStatus;
  reason: string;
  liveScopeGap?: string;
};
