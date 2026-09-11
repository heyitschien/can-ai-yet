-- Additive. One transaction accepts a completed, complete, valid run.
-- Anonymous and logged-in public roles cannot call it.

create or replace function public.accept_benchmark_run(
  p_run_id uuid,
  p_replace boolean default false,
  p_verified_by text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.test_runs%rowtype;
  v_expected integer;
  v_actual integer;
  v_prior uuid;
  v_valid boolean;
  v_updated integer;
begin
  if p_verified_by is null or length(btrim(p_verified_by)) = 0 then
    raise exception 'reviewer_required';
  end if;

  select * into v_run
  from public.test_runs
  where id = p_run_id
  for update;

  if not found then
    raise exception 'run_not_found';
  end if;
  if v_run.status <> 'completed' then
    raise exception 'run_not_completed';
  end if;

  v_valid := coalesce((v_run.tool_configuration ->> 'benchmarkValid')::boolean, false);
  if not v_valid then
    raise exception 'benchmark_invalid';
  end if;

  v_expected := v_run.total_count;
  select count(*) into v_actual from public.test_results where test_run_id = p_run_id;
  if v_actual <> v_expected or v_expected < 1 then
    raise exception 'result_count_mismatch';
  end if;

  select accepted_test_run_id into v_prior
  from public.capabilities
  where id = v_run.capability_id
  for update;

  if v_prior = p_run_id then
    return p_run_id;
  end if;
  if v_prior is not null and p_replace is distinct from true then
    raise exception 'accepted_run_conflict';
  end if;

  update public.test_runs
  set published = true,
      verified_by = p_verified_by
  where id = p_run_id
    and published = false;

  update public.capabilities
  set accepted_test_run_id = p_run_id
  where id = v_run.capability_id
    and accepted_test_run_id is not distinct from v_prior;

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'accepted_run_conflict';
  end if;

  return p_run_id;
end;
$$;

revoke all on function public.accept_benchmark_run(uuid, boolean, text) from public;
revoke all on function public.accept_benchmark_run(uuid, boolean, text) from anon;
revoke all on function public.accept_benchmark_run(uuid, boolean, text) from authenticated;
grant execute on function public.accept_benchmark_run(uuid, boolean, text) to service_role;
