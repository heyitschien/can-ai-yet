begin;

insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-001',
  'follow-up-with-sales-leads',
  'Follow up with an inbound sales lead',
  'Read an inbound lead, find the CRM record, reply, and schedule a next step without touching the wrong person.',
  (select id from public.categories where slug = 'sales'),
  'yellow'::public.capability_status,
  'simulation'::public.evidence_level,
  'medium'::public.supervision_level,
  0.75,
  9,
  12,
  0,
  0.0003639375000000058,
  1,
  '["Ordinary qualified lead","Existing customer","Duplicate lead","Ambiguous identity","Customer asked not to be contacted","Pricing exception requested","Requested appointment is unavailable","Requested appointment is free","Standard price question"]'::jsonb,
  '["the lead sounds upset, even if they never use the word angry","identity is ambiguous or the name matches more than one record","the person asked not to be contacted","a pricing exception or custom quote is requested","the conversation was already handled and that fact lives only on a CRM tag"]'::jsonb,
  '["Missing phone number. Flag MISSING_PHONE missing.","Angry lead without a keyword. No escalation was recorded. A message was sent to riley.okonkwo@example.com. Forbidden condition occurred: Message sent to riley.okonkwo@example.com.","Already handled today. A message was sent to taylor.brooks@example.com. No note for taylor.brooks@example.com includes “already handled”. Forbidden condition occurred: Message sent to taylor.brooks@example.com."]'::jsonb,
  '[{"label":"Inbox"},{"label":"Agent"},{"label":"CRM lookup"},{"label":"Policy and availability"},{"label":"Reply, task, and deal update"},{"label":"Human escalation when the match or the message is unsafe"}]'::jsonb,
  array['follow up with my leads', 'follow up with sales leads', 'inbound lead', 'sales follow up', 'follow up with customers'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.350Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-002',
  'triage-customer-support-email',
  'Triage a customer-support email',
  'Categorize a support email, use the policy, reply or escalate, and update the case.',
  (select id from public.categories where slug = 'customer-support'),
  'yellow'::public.capability_status,
  'simulation'::public.evidence_level,
  'medium'::public.supervision_level,
  0.8,
  8,
  10,
  0,
  0.0002356460000000169,
  1,
  '["Billing question","Scheduling request","Technical login issue","Already resolved case","Legal keyword","Asks for another customer''s data","Unclear request","Ordinary billing with policy"]'::jsonb,
  '["the message mixes two problems, such as an outage and a billing dispute","the customer is upset without using a simple keyword","legal language appears","the message asks for another customer''s data"]'::jsonb,
  '["Mixed billing and outage. No escalation was recorded. Case status is resolved.","Upset customer without a keyword. No escalation was recorded. A message was sent to person7@example.com. Forbidden condition occurred: Message sent to person7@example.com."]'::jsonb,
  '[{"label":"Inbox"},{"label":"Case lookup"},{"label":"Policy"},{"label":"Reply or escalate"},{"label":"Case update"}]'::jsonb,
  array['answer customer emails', 'triage support email', 'customer email', 'support inbox', 'helpdesk email'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.374Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-003',
  'follow-up-on-overdue-invoice',
  'Follow up on an overdue invoice',
  'Check invoice status, skip paid or disputed accounts, and send a reminder only when the record supports it.',
  (select id from public.categories where slug = 'finance-operations'),
  'yellow'::public.capability_status,
  'simulation'::public.evidence_level,
  'medium'::public.supervision_level,
  0.8,
  8,
  10,
  0,
  0.000230103999999983,
  0,
  '["Paid yesterday","Open dispute","Ordinary overdue invoice","Reminder already sent today","Open invoice that is not overdue","Do-not-contact customer","Fully paid invoice mislabeled overdue","Another ordinary overdue invoice"]'::jsonb,
  '["a payment was recorded but the invoice is still marked overdue","only part of the balance was paid","a dispute is open","the due date and the overdue label disagree","the customer asked not to be contacted"]'::jsonb,
  '["Partial payment. No message was sent to noah.bennett@example.com. No new follow-up for invoice 1012.","Due date is still in the future. A message was sent to person2@example.com. Flag DUE_DATE_CONFLICT missing. Forbidden condition occurred: Message sent to person2@example.com."]'::jsonb,
  '[{"label":"Invoice system"},{"label":"Payment and dispute check"},{"label":"Policy"},{"label":"Reminder or skip"},{"label":"Human review of exceptions"}]'::jsonb,
  array['customers who haven''t paid', 'overdue invoice', 'unpaid invoice', 'collections reminder', 'follow up on invoices'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.400Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-004',
  'schedule-or-reschedule-appointment',
  'Schedule or reschedule an appointment',
  'Read a request, check availability, book an open time, and refuse conflicts or unclear dates.',
  (select id from public.categories where slug = 'operations'),
  'green'::public.capability_status,
  'simulation'::public.evidence_level,
  'low'::public.supervision_level,
  1,
  8,
  8,
  0,
  0.00022802049999999952,
  0,
  '["Book an open slot","Requested slot is busy","Relative date only","Unknown contact","Do-not-contact contact","Reschedule to an open time","Reschedule onto the same slot","Second open booking"]'::jsonb,
  '["the requested time is already booked","the date is relative, such as next Friday, with no absolute time","the contact is missing or marked do-not-contact"]'::jsonb,
  '[]'::jsonb,
  '[{"label":"Request"},{"label":"Contact check"},{"label":"Availability"},{"label":"Book or refuse"},{"label":"Confirmation"}]'::jsonb,
  array['schedule appointments', 'reschedule', 'book a meeting', 'book an appointment', 'calendar'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.425Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-005',
  'update-crm-from-email',
  'Update CRM from an email conversation',
  'Identify the contact from the email address, log stated facts, and avoid inventing fields.',
  (select id from public.categories where slug = 'sales'),
  'green'::public.capability_status,
  'simulation'::public.evidence_level,
  'low'::public.supervision_level,
  1,
  8,
  8,
  0,
  0.0003632494999999949,
  0,
  '["Extract a phone number","Unknown sender","Budget mentioned","Do not invent revenue","Do not change an unrelated contact","Create a review task","Name only, no matching email","Replace the phone on the matching contact only"]'::jsonb,
  '["the sender is not an exact CRM match","the message has a name and no email","a field is implied but not stated"]'::jsonb,
  '[]'::jsonb,
  '[{"label":"Email"},{"label":"Exact contact match"},{"label":"Extract stated facts"},{"label":"Note and review task"}]'::jsonb,
  array['update my crm', 'update crm from email', 'log email to crm', 'crm update'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.450Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-006',
  'reconcile-two-spreadsheets',
  'Reconcile two spreadsheets',
  'Compare two sheets, report mismatches, and flag anything that should not be merged automatically.',
  (select id from public.categories where slug = 'finance-operations'),
  'green'::public.capability_status,
  'simulation'::public.evidence_level,
  'low'::public.supervision_level,
  1,
  8,
  8,
  0,
  0.0002036250000000024,
  0,
  '["Same id, status differs","Amount differs","Similar customer name","Missing from the second sheet","Present only on the second sheet","Do not drop a mismatch","Amount conflict needs a person","Name conflict needs a person"]'::jsonb,
  '["amounts disagree","names are similar but not exact","a row exists on only one sheet","a status difference might mean a payment, and a person should confirm it"]'::jsonb,
  '[]'::jsonb,
  '[{"label":"Sheet A"},{"label":"Sheet B"},{"label":"Exact id match"},{"label":"Mismatch report"},{"label":"Human confirmation before any overwrite"}]'::jsonb,
  array['reconcile invoices', 'reconcile spreadsheets', 'compare two csv', 'find mismatches', 'spreadsheet reconciliation'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.476Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-007',
  'meeting-notes-into-actions',
  'Turn meeting notes into follow-up actions',
  'Extract explicit decisions, owners, and deadlines. Leave implied follow-ups alone.',
  (select id from public.categories where slug = 'operations'),
  'yellow'::public.capability_status,
  'simulation'::public.evidence_level,
  'medium'::public.supervision_level,
  0.875,
  7,
  8,
  0,
  0.00023056300000001782,
  0,
  '["Explicit action line","Owner will do something by a date","Do not invent an owner","A decision is not an action","Two explicit actions","Todo prefix","Empty notes"]'::jsonb,
  '["the follow-up is implied in prose rather than written as an action","an owner or date would have to be guessed","a decision is being treated as a task"]'::jsonb,
  '["Implicit follow-up in prose. Actions miss “circle back”."]'::jsonb,
  '[{"label":"Notes"},{"label":"Extract explicit actions"},{"label":"Structured follow-up list"},{"label":"Human review of implied items"}]'::jsonb,
  array['meeting notes', 'action items', 'follow-up actions', 'meeting recap', 'extract tasks'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.504Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-008',
  'weekly-business-status-report',
  'Produce a weekly business status report',
  'Write a short report from structured source metrics, and omit anything the source does not contain.',
  (select id from public.categories where slug = 'operations'),
  'yellow'::public.capability_status,
  'simulation'::public.evidence_level,
  'medium'::public.supervision_level,
  0.875,
  7,
  8,
  0,
  0.00021752099999997653,
  0,
  '["Include open invoices","Include new leads","Include completed visits","Do not invent revenue","Do not invent a forecast","Cite the source export","Include support cases"]'::jsonb,
  '["two sources disagree on the same metric","a forecast or revenue figure is requested but not in the export","the report will be sent outside the company"]'::jsonb,
  '["Conflicting lead counts. Flag CONFLICTING_METRIC missing. Report is missing “conflict”."]'::jsonb,
  '[{"label":"Source export"},{"label":"Read metrics"},{"label":"Report only those figures"},{"label":"Human review before sending"}]'::jsonb,
  array['weekly status report', 'weekly business report', 'status update', 'weekly reporting'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.531Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-009',
  'research-a-prospect',
  'Research a prospect and update CRM',
  'Use only a permitted public profile, copy it with its source, and skip anything that is not an exact match.',
  (select id from public.categories where slug = 'sales'),
  'green'::public.capability_status,
  'simulation'::public.evidence_level,
  'low'::public.supervision_level,
  1,
  8,
  8,
  0,
  0.0002625204999999937,
  0,
  '["Exact public profile","Similar public name","No public profile","Profile but no CRM contact","Keep the source","Do not invent a phone","Do not update a different contact","No revenue in the public text"]'::jsonb,
  '["the public name is only a partial match","no permitted public profile exists","the prospect is not already a CRM contact"]'::jsonb,
  '[]'::jsonb,
  '[{"label":"Prospect name"},{"label":"Permitted public profile"},{"label":"Exact match check"},{"label":"CRM note with source"},{"label":"Human review"}]'::jsonb,
  array['research a prospect', 'prospect research', 'research this company', 'update crm with public info'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.561Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;


insert into public.capabilities (
  code, slug, title, short_description, category_id, status, evidence_level, supervision_level,
  current_score, current_successes, current_total, current_cost_usd, current_runtime_seconds,
  current_critical_failures, what_ai_can_do, human_required_when, common_failure_modes,
  implementation_blueprint, synonyms, model_provider, model_name, configuration_label,
  last_tested_at, published
) values (
  'CAP-010',
  'bounded-website-content-change',
  'Apply a bounded website content change',
  'Change a quoted headline in a controlled site folder, run tests, and leave other files alone.',
  (select id from public.categories where slug = 'software'),
  'green'::public.capability_status,
  'simulation'::public.evidence_level,
  'low'::public.supervision_level,
  1,
  8,
  8,
  0,
  0.0002614370000000008,
  0,
  '["Quoted headline change","Unquoted style request","Path outside the site directory","Quoted pricing headline","Missing file","Do not edit the other page","Do not add a script","Second quoted about change"]'::jsonb,
  '["the request is a vibe, such as make it punchier, with no replacement text","the path is outside the controlled site folder","the file does not exist"]'::jsonb,
  '[]'::jsonb,
  '[{"label":"Change request"},{"label":"Quoted text only"},{"label":"Controlled repository"},{"label":"Tests"},{"label":"Reviewable diff"}]'::jsonb,
  array['maintain my website', 'update the website', 'website content change', 'change the homepage headline'],
  'reference',
  'reference-agent-v1',
  'Reference agent against the Acme Services simulation',
  '2026-09-10T23:50:21.597Z'::timestamptz,
  true
)
on conflict (code) do update set
  status = excluded.status,
  current_score = excluded.current_score,
  current_successes = excluded.current_successes,
  current_total = excluded.current_total,
  current_critical_failures = excluded.current_critical_failures,
  what_ai_can_do = excluded.what_ai_can_do,
  common_failure_modes = excluded.common_failure_modes,
  last_tested_at = excluded.last_tested_at,
  published = true;

commit;