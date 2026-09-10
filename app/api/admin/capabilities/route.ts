import { cookies } from "next/headers";
import { listPublished } from "@/lib/data/public-data";
import { verifySession } from "@/lib/security/admin";

export async function GET() {
  const store = await cookies();
  if (!verifySession(store.get("can_ai_yet_admin")?.value)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ capabilities: await listPublished() });
}
