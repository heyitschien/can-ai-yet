import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand/share-mark";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.paper,
    theme_color: BRAND.accent,
  };
}
