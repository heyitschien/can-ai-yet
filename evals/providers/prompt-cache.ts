export type PromptPrefixObservation = {
  cacheControlSent: false;
  responseCache: "disabled";
  prefixCharacters: number;
  roughTokenEstimate: number;
  meetsDocumentedMinimum: "unknown-not-enabled";
  note: string;
};

/** Character/4 sketch only. Not a provider token count and not a request to cache. */
export function observePromptPrefix(systemPrompt: string, tools: unknown): PromptPrefixObservation {
  const prefix = `${systemPrompt}\n${JSON.stringify(tools)}`;
  const prefixCharacters = prefix.length;
  const roughTokenEstimate = Math.ceil(prefixCharacters / 4);
  return {
    cacheControlSent: false,
    responseCache: "disabled",
    prefixCharacters,
    roughTokenEstimate,
    meetsDocumentedMinimum: "unknown-not-enabled",
    note: "Prompt caching is not enabled. The request does not send cache_control, and OpenRouter response caching is not used. A rough character/4 estimate is not a provider token count. Anthropic's published minimum for a cacheable prefix has often been about 1024 tokens on Sonnet-class models; re-check the live docs before enabling cache, because turning it on would change the benchmark configuration. Returning a cached completion would also destroy trial independence, so response caching stays off.",
  };
}
