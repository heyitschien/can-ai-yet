/**
 * Lightweight no-network vendor-evidence shape checks (CAY-09).
 * Does not crawl vendor docs; only validates that in-repo provenance rows look complete.
 */

export type VendorEvidenceRow = {
  sourceUrl: string;
  retrievalDate: string;
  operation: string;
  method: string;
  path: string;
  apiVersion: string;
  requiredScopes: readonly string[];
};

const OFFICIAL_HOST_SUFFIXES = ["developers.hubspot.com", "hubspot.com"] as const;

export function isOfficialVendorHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return OFFICIAL_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export function looksLikeIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateVendorEvidenceRow(row: VendorEvidenceRow): string[] {
  const failures: string[] = [];
  if (!row.sourceUrl.trim()) failures.push("sourceUrl missing");
  else if (!isOfficialVendorHost(row.sourceUrl)) failures.push("sourceUrl host is not an official vendor host");
  if (!looksLikeIsoDate(row.retrievalDate)) failures.push("retrievalDate must be YYYY-MM-DD");
  if (!row.operation.trim()) failures.push("operation missing");
  if (!row.method.trim()) failures.push("method missing");
  if (!row.path.trim()) failures.push("path missing");
  if (!row.apiVersion.trim()) failures.push("apiVersion missing");
  if (!Array.isArray(row.requiredScopes) || row.requiredScopes.length === 0) {
    failures.push("requiredScopes must be a non-empty array");
  }
  return failures;
}
