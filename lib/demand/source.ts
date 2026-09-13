import {
  type DemandIdea,
  type DemandMetric,
  type DemandSeed,
  type DemandTarget,
} from "@/lib/demand/types";

/** Source-neutral demand adapter. Never publishes claims or spends benchmark money. */
export interface DemandSource {
  readonly name: string;
  discoverIdeas(seed: DemandSeed, target: DemandTarget): Promise<DemandIdea[]>;
  getHistoricalMetrics(keywords: string[], target: DemandTarget): Promise<DemandMetric[]>;
}
