-- CanAIYet MVP schema. Source of truth for published capability evidence.
-- Public visitors can read published rows only. Writes go through the
-- service role or narrowly scoped request functions.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.capability_status as enum ('green', 'yellow', 'red', 'gray');
create type public.evidence_level as enum ('unverified', 'simulation', 'sandbox', 'pilot', 'production');
create type public.supervision_level as enum ('low', 'medium', 'high', 'not_recommended');
create type public.request_status as enum ('new', 'reviewing', 'planned', 'tested', 'rejected');
create type public.request_kind as enum ('test', 'implementation');
create type public.test_run_status as enum ('running', 'completed', 'failed', 'accepted', 'rejected');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capabilities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  title text not null,
  short_description text not null,
  category_id uuid not null references public.categories (id),
  status public.capability_status not null default 'gray',
  evidence_level public.evidence_level not null default 'unverified',
  supervision_level public.supervision_level not null default 'not_recommended',
  current_score numeric,
  current_successes integer,
  current_total integer,
  current_cost_usd numeric,
  current_runtime_seconds numeric,
  current_critical_failures integer not null default 0,
  what_ai_can_do jsonb not null default '[]'::jsonb,
  human_required_when jsonb not null default '[]'::jsonb,
  common_failure_modes jsonb not null default '[]'::jsonb,
  implementation_blueprint jsonb not null default '[]'::jsonb,
  synonyms text[] not null default '{}',
  model_provider text,
  model_name text,
  configuration_label text,
  accepted_test_run_id uuid,
  last_tested_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint capabilities_score_range check (current_score is null or (current_score >= 0 and current_score <= 1)),
  constraint capabilities_counts check (
    current_successes is null
    or current_total is null
    or (current_successes >= 0 and current_total >= current_successes)
  )
);

create table public.test_scenarios (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capabilities (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null,
  fixture_version text not null,
  input_payload jsonb not null default '{}'::jsonb,
  expected_state jsonb not null default '[]'::jsonb,
  forbidden_state jsonb not null default '[]'::jsonb,
  evaluation_type text not null default 'deterministic_state',
  critical boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (capability_id, slug)
);

create table public.test_runs (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capabilities (id) on delete cascade,
  model_provider text not null,
  model_name text not null,
  model_version text,
  tool_configuration jsonb not null default '{}'::jsonb,
  environment_version text not null,
  fixture_version text not null,
  git_sha text,
  started_at timestamptz not null,
  completed_at timestamptz,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  total_count integer not null default 0,
  critical_failure_count integer not null default 0,
  score numeric,
  total_cost_usd numeric,
  median_runtime_seconds numeric,
  input_tokens integer,
  output_tokens integer,
  status public.test_run_status not null default 'running',
  notes text,
  verified_by text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.capabilities
  add constraint capabilities_accepted_run_fk
  foreign key (accepted_test_run_id) references public.test_runs (id);

create table public.test_results (
  id uuid primary key default gen_random_uuid(),
  test_run_id uuid not null references public.test_runs (id) on delete cascade,
  scenario_id uuid not null references public.test_scenarios (id),
  success boolean not null,
  actual_state jsonb not null default '{}'::jsonb,
  failure_code text,
  failure_explanation text,
  critical boolean not null default false,
  runtime_seconds numeric,
  cost_usd numeric,
  raw_trace_path text,
  created_at timestamptz not null default now()
);

create table public.capability_changes (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capabilities (id) on delete cascade,
  previous_score numeric,
  new_score numeric,
  previous_status public.capability_status,
  new_status public.capability_status not null,
  reason text not null,
  test_run_id uuid references public.test_runs (id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.capability_requests (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  email text,
  context text,
  business_context text,
  kind public.request_kind not null default 'test',
  matched_capability_id uuid references public.capabilities (id),
  status public.request_status not null default 'new',
  created_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid references public.capabilities (id) on delete cascade,
  test_run_id uuid references public.test_runs (id) on delete cascade,
  title text not null,
  url text,
  publisher text,
  published_at timestamptz,
  source_type text not null,
  created_at timestamptz not null default now()
);

create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  capability_id uuid references public.capabilities (id),
  query text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.rate_limit_buckets (
  bucket_key text primary key,
  hit_count integer not null,
  window_start timestamptz not null
);

create table public.scout_findings (
  id uuid primary key default gen_random_uuid(),
  change_summary text not null,
  potentially_affected text[] not null default '{}',
  confidence text not null,
  reason text not null,
  status text not null default 'queued_for_review',
  created_at timestamptz not null default now()
);

create table public.retest_queue (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null references public.capabilities (id) on delete cascade,
  reason text not null,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create index capabilities_published_idx on public.capabilities (published, status);
create index capabilities_category_idx on public.capabilities (category_id);
create index test_runs_capability_idx on public.test_runs (capability_id, started_at desc);
create index test_results_run_idx on public.test_results (test_run_id);
create index capability_changes_published_idx on public.capability_changes (published_at desc);
create index capability_requests_status_idx on public.capability_requests (status, created_at desc);
create index product_events_name_idx on public.product_events (event_name, created_at desc);

alter table public.categories enable row level security;
alter table public.capabilities enable row level security;
alter table public.test_scenarios enable row level security;
alter table public.test_runs enable row level security;
alter table public.test_results enable row level security;
alter table public.capability_changes enable row level security;
alter table public.capability_requests enable row level security;
alter table public.sources enable row level security;
alter table public.product_events enable row level security;
alter table public.rate_limit_buckets enable row level security;
alter table public.scout_findings enable row level security;
alter table public.retest_queue enable row level security;

create policy categories_public_read on public.categories
  for select to anon, authenticated using (true);

create policy capabilities_public_read on public.capabilities
  for select to anon, authenticated using (published = true);

create policy scenarios_public_read on public.test_scenarios
  for select to anon, authenticated
  using (
    active = true
    and exists (
      select 1 from public.capabilities c
      where c.id = capability_id and c.published = true
    )
  );

create policy runs_public_read on public.test_runs
  for select to anon, authenticated
  using (
    published = true
    and exists (
      select 1 from public.capabilities c
      where c.id = capability_id and c.published = true
    )
  );

create policy results_public_read on public.test_results
  for select to anon, authenticated
  using (
    raw_trace_path is null
    and exists (
      select 1 from public.test_runs r
      join public.capabilities c on c.id = r.capability_id
      where r.id = test_run_id and r.published = true and c.published = true
    )
  );

create policy changes_public_read on public.capability_changes
  for select to anon, authenticated
  using (
    published_at is not null
    and exists (
      select 1 from public.capabilities c
      where c.id = capability_id and c.published = true
    )
  );

create policy sources_public_read on public.sources
  for select to anon, authenticated using (true);

-- No public policies on requests, events, rate limits, scout, or retest queue.
-- Anonymous role cannot insert, update, or delete those tables.

create or replace function public.submit_capability_request(
  p_query text,
  p_email text default null,
  p_context text default null,
  p_business_context text default null,
  p_kind text default 'test',
  p_matched_capability_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  clean_query text;
  clean_email text;
  clean_kind public.request_kind;
begin
  clean_query := left(btrim(coalesce(p_query, '')), 500);
  if length(clean_query) < 8 then
    raise exception 'query_too_short';
  end if;

  clean_email := nullif(left(btrim(coalesce(p_email, '')), 200), '');
  if clean_email is not null and clean_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;

  if p_kind = 'implementation' then
    clean_kind := 'implementation';
  else
    clean_kind := 'test';
  end if;

  insert into public.capability_requests (
    query, email, context, business_context, kind, matched_capability_id
  ) values (
    clean_query,
    clean_email,
    nullif(left(btrim(coalesce(p_context, '')), 2000), ''),
    nullif(left(btrim(coalesce(p_business_context, '')), 500), ''),
    clean_kind,
    p_matched_capability_id
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.submit_capability_request(text, text, text, text, text, uuid) from public;
grant execute on function public.submit_capability_request(text, text, text, text, text, uuid) to anon, authenticated, service_role;

create or replace function public.record_product_event(
  p_event_name text,
  p_capability_id uuid default null,
  p_query text default null,
  p_path text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed text[] := array[
    'homepage_search',
    'search_match_opened',
    'capability_view',
    'evidence_opened',
    'methodology_opened',
    'implementation_opened',
    'capability_request_submitted',
    'implementation_interest_submitted'
  ];
begin
  if not (p_event_name = any (allowed)) then
    raise exception 'unknown_event';
  end if;

  insert into public.product_events (event_name, capability_id, query, path)
  values (
    p_event_name,
    p_capability_id,
    nullif(left(btrim(coalesce(p_query, '')), 300), ''),
    nullif(left(btrim(coalesce(p_path, '')), 300), '')
  );
end;
$$;

revoke all on function public.record_product_event(text, uuid, text, text) from public;
grant execute on function public.record_product_event(text, uuid, text, text) to anon, authenticated, service_role;

insert into public.categories (slug, name, description) values
  ('sales', 'Sales', 'Inbound leads, prospect research, and CRM follow-up.'),
  ('customer-support', 'Customer Support', 'Inbox triage, replies, and escalation.'),
  ('operations', 'Operations', 'Scheduling, meeting follow-up, and weekly reporting.'),
  ('finance-operations', 'Finance Operations', 'Invoices, reminders, and spreadsheet reconciliation.'),
  ('software', 'Software', 'Bounded website and content changes under review.');
