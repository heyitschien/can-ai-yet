import type { PublicCapability } from "@/lib/domain";
import { STATUS_LABEL } from "@/lib/domain";
import { formatPercent } from "@/lib/format";
import { searchCapabilities } from "@/lib/search/query";

export function groundedAnswer(query: string, capabilities: PublicCapability[]): string {
  const outcome = searchCapabilities(query, capabilities);
  if (outcome.outcome === "not_tested" || outcome.matches.length === 0) {
    return "We haven’t tested that exact capability yet. I can only talk about published tests, and none of them is a close match.";
  }
  const lines = outcome.matches.map((match, index) => {
    const score = match.capability.currentScore === null ? "not scored" : formatPercent(match.capability.currentScore);
    return `${index + 1}. ${match.capability.title} — ${STATUS_LABEL[match.capability.status]} — ${score} under the latest simulated run.`;
  });
  return `Based on our tested capabilities:\n\n${lines.join("\n")}\n\nThose figures come from stored results. I have not created a new score.`;
}

export async function explainWithModel(query: string, capabilities: PublicCapability[]): Promise<string> {
  const fallback = groundedAnswer(query, capabilities);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return fallback;
  const outcome = searchCapabilities(query, capabilities);
  const payload = outcome.matches.map((match) => ({
    title: match.capability.title,
    slug: match.capability.slug,
    status: match.capability.status,
    score: match.capability.currentScore,
    successes: match.capability.currentSuccesses,
    total: match.capability.currentTotal,
    evidence: match.capability.evidenceLevel,
    failures: match.capability.commonFailureModes,
  }));
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You explain only the JSON capability records you are given. Do not invent tests, scores, costs, evidence tiers, or statuses. If a task is not in the JSON, say it has not been tested. Speak in tasks, not model jargon.",
        },
        { role: "user", content: JSON.stringify({ question: query, records: payload }) },
      ],
    }),
  });
  if (!response.ok) return fallback;
  const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return body.choices?.[0]?.message?.content?.trim() || fallback;
}
