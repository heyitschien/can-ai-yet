import { createClient } from "@supabase/supabase-js";
import { catalogBySlug } from "@/lib/content/catalog";
import type { RequestInput } from "@/lib/validation/request";

export async function submitRequest(input: RequestInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { ok: false, error: "Requests are not connected yet." };
  const client = createClient(url, key, { auth: { persistSession: false } });
  const matched = input.capability ? catalogBySlug(input.capability) : undefined;
  const { error } = await client.rpc("submit_capability_request", {
    p_query: input.query,
    p_email: input.email,
    p_context: input.context,
    p_business_context: input.business,
    p_kind: input.kind,
    p_matched_capability_id: null,
  });
  if (error) return { ok: false, error: "Could not save that request." };
  void matched;
  return { ok: true };
}
