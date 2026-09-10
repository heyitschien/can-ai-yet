import { createClient } from "@supabase/supabase-js";
import { cronAuthorized } from "@/lib/security/cron";

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return Response.json({
      queued: false,
      reason: "Scout did not write a finding because the server secret is not configured. No model spend occurred.",
    });
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client.from("scout_findings").insert({
    change_summary: "No automatic vendor sources are enabled.",
    potentially_affected: [],
    confidence: "low",
    reason: "MVP scout queues a review item and does not call a model or publish a capability change.",
    status: "queued_for_review",
  });
  if (error) return Response.json({ error: "Could not queue scout review." }, { status: 500 });
  return Response.json({ queued: true, spent: 0 });
}
