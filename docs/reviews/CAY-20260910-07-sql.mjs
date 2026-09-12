// Review-only: executes repository SQL in an ephemeral PGlite database.
// Usage: node docs/reviews/CAY-20260910-07-sql.mjs /absolute/path/to/pglite/dist/index.js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2])).href);
const db = new PGlite();
const observations = [];
await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
// Unused pgcrypto/pg_trgm extension declarations are omitted for this WASM runtime.
// Schema, constraints, policies, and acceptance function are otherwise unmodified.
const schema = readFileSync('supabase/migrations/20260910213000_init.sql', 'utf8')
  .replace(/^create extension[^;]+;\s*$/gm, '');
await db.exec(schema);
await db.exec(readFileSync('supabase/migrations/20260911043000_accept_benchmark_run.sql', 'utf8'));
await db.exec('grant usage on schema public to anon, authenticated, service_role; grant all on all tables in schema public to anon, authenticated, service_role;');
let seq = 0;
async function fixture({ count=1, success=count }={}) {
  const n = ++seq;
  const cap = (await db.query(`insert into capabilities(code,slug,title,short_description,category_id,published) select $1,$1,'Review','Synthetic review fixture',id,true from categories limit 1 returning id`, [`REVIEW-${n}`])).rows[0].id;
  const scenario = (await db.query(`insert into test_scenarios(capability_id,slug,title,description,fixture_version) values ($1,'scenario','Review','Synthetic','review-v1') returning id`, [cap])).rows[0].id;
  const run = (await db.query(`insert into test_runs(capability_id,model_provider,model_name,tool_configuration,environment_version,fixture_version,started_at,completed_at,total_count,success_count,failure_count,critical_failure_count,score,status) values ($1,'mock','review/model','{"benchmarkValid":true}','review-v1','review-v1',now(),now(),$2,$3,$2::int-$3::int,0,$3::numeric/$2::numeric,'completed') returning id`, [cap,count,success])).rows[0].id;
  return { cap, scenario, run };
}
async function result(f, scenario=f.scenario, success=true) {
  await db.query('insert into test_results(test_run_id,scenario_id,success) values ($1,$2,$3)',[f.run,scenario,success]);
}
async function accept(f, replace=false) {
  return db.query('select accept_benchmark_run($1,$2,$3)',[f.run,replace,'synthetic-reviewer']);
}
async function state(f) {
  return (await db.query('select published,verified_by,(select accepted_test_run_id from capabilities where id=$2) as pointer from test_runs where id=$1',[f.run,f.cap])).rows[0];
}
const valid=await fixture(); await result(valid); await accept(valid); await accept(valid);
assert.deepEqual(await state(valid),{published:true,verified_by:'synthetic-reviewer',pointer:valid.run});
observations.push({check:'valid acceptance and identical reacceptance',outcome:'PASS'});
const conflict=await fixture(); await result(conflict);
await db.query('update capabilities set accepted_test_run_id=$1 where id=$2',[valid.run,conflict.cap]);
await assert.rejects(accept(conflict),/accepted_run_conflict/);
assert.equal((await state(conflict)).published,false);
observations.push({check:'existing-pointer conflict leaves new run unpublished',outcome:'PASS'});
const rollback=await fixture(); await result(rollback);
await db.exec(`create function review_reject_pointer() returns trigger language plpgsql as $$ begin raise exception 'synthetic_pointer_failure'; end; $$; create trigger review_pointer_failure before update on capabilities for each row execute function review_reject_pointer();`);
await assert.rejects(accept(rollback),/synthetic_pointer_failure/);
assert.equal((await state(rollback)).published,false);
await db.exec('drop trigger review_pointer_failure on capabilities; drop function review_reject_pointer();');
observations.push({check:'pointer failure rolls back publication',outcome:'PASS'});
for (const role of ['anon','authenticated']) {
  await db.exec(`set role ${role}`);
  await assert.rejects(accept(valid),/permission denied/);
  await assert.rejects(db.query(`insert into test_runs(capability_id,model_provider,model_name,environment_version,fixture_version,started_at) values ($1,'mock','mock','review','review',now())`,[valid.cap]), /row-level security/);
  assert.equal((await db.query('select id from test_runs where id=$1',[rollback.run])).rows.length,0);
  await db.exec('reset role');
  observations.push({check:`${role} cannot insert benchmark runs or read unpublished runs`,outcome:'PASS'});
  observations.push({check:`${role} cannot call acceptance RPC`,outcome:'PASS'});
}
const duplicate=await fixture({count:2}); await result(duplicate); await result(duplicate);
await accept(duplicate);
assert.equal((await state(duplicate)).published,true);
observations.push({check:'two copies of one scenario accepted as a two-scenario run',outcome:'DEFECT REPRODUCED'});
const foreign=await fixture(); await result(foreign,valid.scenario); await accept(foreign);
assert.equal((await state(foreign)).pointer,foreign.run);
observations.push({check:'result from another capability accepted',outcome:'DEFECT REPRODUCED'});
const contradictory=await fixture(); await result(contradictory,contradictory.scenario,false); await accept(contradictory);
assert.equal((await state(contradictory)).published,true);
observations.push({check:'1/1 success headline accepted with a failing result',outcome:'DEFECT REPRODUCED'});
const incomplete=await fixture();
await assert.rejects(accept(incomplete),/result_count_mismatch/);
observations.push({check:'missing result rejected',outcome:'PASS'});
console.log(JSON.stringify({runtime:(await db.query('select version()')).rows[0].version,observations},null,2));
await db.close();
