import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/data/public-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const capabilities = await listPublished();
  return [
    "",
    "/capabilities",
    "/methodology",
    "/about",
    "/request",
    "/updates",
    "/privacy",
    "/search",
    ...capabilities.map((item) => `/capabilities/${item.slug}`),
  ].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 }));
}
