import { explainWithModel } from "@/lib/ai/ask";
import { listPublished } from "@/lib/data/public-data";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "ask"), 20, 60_000)) {
    return Response.json({ error: "Too many questions. Try again in a minute." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { query?: string } | null;
  const query = body?.query?.trim() ?? "";
  if (query.length < 4) return Response.json({ error: "Ask about a kind of work." }, { status: 400 });
  const capabilities = await listPublished();
  const answer = await explainWithModel(query, capabilities);
  return Response.json({ answer });
}
