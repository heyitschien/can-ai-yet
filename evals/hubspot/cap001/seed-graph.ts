/**
 * Frozen CAP-001 fixture graph for HubSpot environment seeding.
 * Derived from synthetic World.base + LEAD-004 Morgan Blake prepareWorld extras.
 * Emails use IANA-reserved example.com (same as synthetic Acme fixtures).
 */

export type SeedContactSpec = {
  cayFixtureId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  company: string;
  status: "lead" | "customer";
  doNotContact: boolean;
  tags: string[];
};

export type SeedDealSpec = {
  cayFixtureId: string;
  name: string;
  contactEmail: string;
  stage: string;
  value: number;
};

export type SeedAppointmentSpec = {
  cayFixtureId: string;
  contactEmail: string;
  title: string;
  start: string;
  end: string;
};

/** Shared baseline contacts required by LEAD-001…012. */
export const CAP001_SEED_CONTACTS: SeedContactSpec[] = [
  {
    cayFixtureId: "contact-alex",
    email: "alex.rivera@example.com",
    firstName: "Alex",
    lastName: "Rivera",
    phone: "555-0101",
    company: "Northwind Studio",
    status: "lead",
    doNotContact: false,
    tags: ["inbound"],
  },
  {
    cayFixtureId: "contact-priya",
    email: "priya.shah@example.com",
    firstName: "Priya",
    lastName: "Shah",
    phone: "555-0102",
    company: "Shah Consulting",
    status: "customer",
    doNotContact: false,
    tags: ["customer"],
  },
  {
    cayFixtureId: "contact-jordan",
    email: "jordan.lee@example.com",
    firstName: "Jordan",
    lastName: "Lee",
    phone: "555-0103",
    company: "Lee & Co",
    status: "lead",
    doNotContact: true,
    tags: ["do-not-contact"],
  },
  {
    cayFixtureId: "contact-avery",
    email: "avery.kim@example.com",
    firstName: "Avery",
    lastName: "Kim",
    phone: "555-0105",
    company: "Kim Studio",
    status: "lead",
    doNotContact: false,
    tags: [],
  },
  {
    cayFixtureId: "contact-avery2",
    email: "avery.kim.west@example.com",
    firstName: "Avery",
    lastName: "Kim-West",
    phone: "555-0106",
    company: "Westlight",
    status: "lead",
    doNotContact: false,
    tags: [],
  },
  {
    cayFixtureId: "contact-jamie",
    email: "jamie.cruz@example.com",
    firstName: "Jamie",
    lastName: "Cruz",
    phone: null,
    company: "Cruz Bakery",
    status: "lead",
    doNotContact: false,
    tags: ["missing-phone"],
  },
  {
    cayFixtureId: "contact-quinn",
    email: "quinn.adams@example.com",
    firstName: "Quinn",
    lastName: "Adams",
    phone: "555-0108",
    company: "Adams Field",
    status: "lead",
    doNotContact: false,
    tags: [],
  },
  {
    cayFixtureId: "contact-taylor",
    email: "taylor.brooks@example.com",
    firstName: "Taylor",
    lastName: "Brooks",
    phone: "555-0109",
    company: "Brooks Co",
    status: "lead",
    doNotContact: false,
    tags: ["handled-today"],
  },
  {
    cayFixtureId: "contact-riley",
    email: "riley.okonkwo@example.com",
    firstName: "Riley",
    lastName: "Okonkwo",
    phone: "555-0110",
    company: "Okonkwo Logistics",
    status: "customer",
    doNotContact: false,
    tags: [],
  },
  {
    cayFixtureId: "contact-devon",
    email: "devon.park@example.com",
    firstName: "Devon",
    lastName: "Park",
    phone: "555-0112",
    company: "Park Services",
    status: "lead",
    doNotContact: false,
    tags: [],
  },
  {
    cayFixtureId: "contact-morgan-n",
    email: "morgan.blake@example.com",
    firstName: "Morgan",
    lastName: "Blake",
    phone: "555-0199",
    company: "Blake North",
    status: "lead",
    doNotContact: false,
    tags: [],
  },
  {
    cayFixtureId: "contact-morgan-s",
    email: "morgan.b.blake@example.com",
    firstName: "Morgan",
    lastName: "Blake",
    phone: "555-0198",
    company: "Blake South",
    status: "lead",
    doNotContact: false,
    tags: [],
  },
  {
    cayFixtureId: "contact-busy-slot",
    email: "person3@example.com",
    firstName: "Busy",
    lastName: "Slot",
    phone: "555-0203",
    company: "Conflict Co",
    status: "customer",
    doNotContact: false,
    tags: [],
  },
];

export const CAP001_SEED_DEALS: SeedDealSpec[] = [
  {
    cayFixtureId: "deal-alex",
    name: "Northwind onboarding",
    contactEmail: "alex.rivera@example.com",
    stage: "New",
    value: 2400,
  },
  {
    cayFixtureId: "deal-priya",
    name: "Shah retainer",
    contactEmail: "priya.shah@example.com",
    stage: "Customer",
    value: 4800,
  },
  {
    cayFixtureId: "deal-devon",
    name: "Park discovery",
    contactEmail: "devon.park@example.com",
    stage: "New",
    value: 1800,
  },
  {
    cayFixtureId: "deal-quinn",
    name: "Adams site visit",
    contactEmail: "quinn.adams@example.com",
    stage: "New",
    value: 900,
  },
];

/** LEAD-007 conflict slot + spare appointments for availability semantics. */
export const CAP001_SEED_APPOINTMENTS: SeedAppointmentSpec[] = [
  {
    cayFixtureId: "appt-busy-lead007",
    contactEmail: "person3@example.com",
    title: "Existing visit",
    start: "2026-09-12T14:00:00.000Z",
    end: "2026-09-12T15:00:00.000Z",
  },
];

export const CAP001_EXPECTED_BASELINE_COUNTS = {
  contacts: CAP001_SEED_CONTACTS.length,
  deals: CAP001_SEED_DEALS.length,
  appointments: CAP001_SEED_APPOINTMENTS.length,
  notes: 0,
  tasks: 0,
  outbounds: 0,
  escalations: 0,
  flags: 0,
} as const;
