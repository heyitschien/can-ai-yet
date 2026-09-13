import type { HubSpotFailureClass } from "@/evals/hubspot/types";

export function classifyHubSpotHttpStatus(status: number): {
  failureClass: HubSpotFailureClass;
  notFound?: boolean;
} {
  if (status === 404) {
    return { failureClass: "INTEGRATION_FAILURE", notFound: true };
  }
  if (status === 401 || status === 403) {
    return { failureClass: "PERMISSION_FAILURE" };
  }
  if (status === 429 || status >= 500) {
    return { failureClass: "RUNTIME/API_FAILURE" };
  }
  if (status >= 400 && status < 500) {
    return { failureClass: "INTEGRATION_FAILURE" };
  }
  return { failureClass: "RUNTIME/API_FAILURE" };
}

export function extractHubSpotRequestId(headers: Headers): string | undefined {
  return (
    headers.get("x-hubspot-correlation-id") ??
    headers.get("x-request-id") ??
    headers.get("x-trace") ??
    undefined
  );
}
