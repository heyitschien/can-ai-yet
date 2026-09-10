import { listPublished } from "@/lib/data/public-data";
import { searchCapabilities } from "@/lib/search/query";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const capabilities = await listPublished();
  return Response.json(searchCapabilities(query, capabilities));
}
