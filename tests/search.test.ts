import { describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/content/catalog";
import { rankCapability } from "@/lib/search/rank";
import { searchCapabilities } from "@/lib/search/query";
import { toPublic } from "@/lib/data/public-data";
import { publishedRecords } from "@/lib/evidence/load";

const sample = CATALOG.map((catalog) => ({
  title: catalog.title,
  slug: catalog.slug,
  shortDescription: catalog.shortDescription,
  synonyms: catalog.synonyms,
  categoryName: catalog.categoryName,
  whatAiCanDo: [],
}));

describe("search ranking", () => {
  it("strongly matches a published lead-follow-up query", () => {
    const lead = sample.find((item) => item.slug === "follow-up-with-sales-leads");
    expect(lead).toBeTruthy();
    expect(rankCapability("follow up with sales leads", lead!).confidence).toBe("strong");
  });

  it("does not force a match for untested work", () => {
    const capabilities = publishedRecords().map(toPublic);
    const outcome = searchCapabilities("inventory purchasing for a bakery", capabilities);
    expect(outcome.outcome).toBe("not_tested");
  });
});
