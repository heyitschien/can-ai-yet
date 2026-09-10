import { createClient } from "@supabase/supabase-js";
import { cronAuthorized } from "@/lib/security/cron";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return Response.json({ queued: 0, reason: "Retest queue was not written. No model spend occurred." });
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await client.from("capabilities").select("id, code").eq("published", true);
  const rows = (data ?? []).map((item) => ({
    capability_id: item.id,
    reason: "Monthly regression queue. Not executed. Budget controls require an explicit run.",
    status: "queued",
  }));
  if (rows.length === 0) return Response.json({ queued: 0 });
  const { error } = await client.from("retest_queue").insert(rows);
  if (error) return Response.json({ error: "Could not queue retests." }, { status: 500 });
  return Response.json({ queued: rows.length, executed: 0 });
}
