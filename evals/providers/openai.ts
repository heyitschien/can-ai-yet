import type { AgentProvider, AgentRunInput, AgentRunResult } from "@/evals/types";
import type { World } from "@/evals/environments/world";

/**
 * Adapter boundary for a frontier model. Not used by published scores.
 * A real run is an explicit, budgeted action and must be persisted with
 * provider, model, cost, and git SHA before anything is published.
 */
export class OpenAIProvider implements AgentProvider {
  constructor(private readonly model = process.env.OPENAI_MODEL ?? "gpt-4o-mini") {}

  async run(input: AgentRunInput, world: World): Promise<AgentRunResult> {
    void input;
    void world;
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set. Published evidence uses the reference agent.");
    }
    throw new Error(`OpenAI evals for ${this.model} are not auto-run. Use an explicit budgeted command after review.`);
  }
}
