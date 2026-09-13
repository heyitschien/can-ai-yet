const SECRET_PATTERNS: RegExp[] = [
  /pat-[a-zA-Z0-9-]+/g,
  /service[-_]?key[:\s=]+["']?[^\s"']+/gi,
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /hubspot[_-]?access[_-]?token["']?\s*[:=]\s*["']?[^\s"']+/gi,
  /sk-[A-Za-z0-9]{16,}/g,
];

const SECRET_KEYS = new Set([
  "authorization",
  "token",
  "accessToken",
  "access_token",
  "serviceKey",
  "service_key",
  "apiKey",
  "api_key",
  "secret",
  "password",
  "credential",
  "HUBSPOT_SERVICE_KEY",
  "HUBSPOT_ACCESS_TOKEN",
]);

/** Redact secret-like values from strings destined for receipts/logs. */
export function redactSecrets(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, "[REDACTED]");
  }
  return out;
}

/** Deep-clone JSON-like data with secret keys/values scrubbed. */
export function scrubForReceipt<T>(value: T): T {
  return scrubValue(value) as T;
}

function scrubValue(value: unknown): unknown {
  if (typeof value === "string") return redactSecrets(value);
  if (Array.isArray(value)) return value.map(scrubValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEYS.has(key) || SECRET_KEYS.has(key.toLowerCase())) {
        out[key] = "[REDACTED]";
        continue;
      }
      out[key] = scrubValue(child);
    }
    return out;
  }
  return value;
}

export function assertNoSecrets(payload: unknown): void {
  const serialized = JSON.stringify(payload);
  if (!serialized) return;
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(serialized)) {
      throw new Error("Secret-like material detected in commissioning receipt/log payload");
    }
  }
  for (const key of SECRET_KEYS) {
    if (serialized.includes(`"${key}"`) && !serialized.includes(`"${key}":"[REDACTED]"`)) {
      // Allow key presence only if already redacted; bare key without redaction is suspicious.
      const bare = new RegExp(`"${key}"\\s*:\\s*"(?!\\[REDACTED\\])[^"]+"`, "i");
      if (bare.test(serialized)) {
        throw new Error(`Unredacted secret key detected: ${key}`);
      }
    }
  }
}
