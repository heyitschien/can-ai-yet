const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RequestInput = {
  query: string;
  context: string | null;
  business: string | null;
  email: string | null;
  kind: "test" | "implementation";
  capability: string | null;
};

export function parseRequest(body: unknown): { ok: true; value: RequestInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Missing request." };
  const record = body as Record<string, unknown>;
  const query = typeof record.query === "string" ? record.query.trim() : "";
  if (query.length < 8) return { ok: false, error: "Tell us a bit more about the work." };
  if (query.length > 500) return { ok: false, error: "That description is too long." };
  const email = typeof record.email === "string" && record.email.trim() ? record.email.trim() : null;
  if (email && !emailPattern.test(email)) return { ok: false, error: "That email does not look usable." };
  const context = typeof record.context === "string" ? record.context.trim().slice(0, 2000) : "";
  const business = typeof record.business === "string" ? record.business.trim().slice(0, 500) : "";
  const kind = record.kind === "implementation" ? "implementation" : "test";
  const capability = typeof record.capability === "string" && record.capability.trim() ? record.capability.trim() : null;
  return { ok: true, value: { query, context: context || null, business: business || null, email, kind, capability } };
}
