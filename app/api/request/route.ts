import { submitRequest } from "@/lib/data/requests";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { parseRequest } from "@/lib/validation/request";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "request"), 8, 60_000)) {
    return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }
  const parsed = parseRequest(await request.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  const saved = await submitRequest(parsed.value);
  if (!saved.ok) return Response.json({ error: saved.error }, { status: 503 });
  return Response.json({ ok: true });
}
