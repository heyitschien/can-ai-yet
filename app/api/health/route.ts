import { listPublished } from "@/lib/data/public-data";

export async function GET() {
  const capabilities = await listPublished();
  return Response.json({ ok: true, published: capabilities.length });
}
