import { cookies } from "next/headers";
import { loadEvidence } from "@/lib/evidence/load";
import { verifySession } from "@/lib/security/admin";

export async function GET() {
  const store = await cookies();
  if (!verifySession(store.get("can_ai_yet_admin")?.value)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ runs: loadEvidence()?.suites ?? [] });
}
