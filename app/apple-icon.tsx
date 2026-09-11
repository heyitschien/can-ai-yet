import { ImageResponse } from "next/og";
import { BRAND, BrandMark } from "@/lib/brand/share-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BRAND.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BrandMark size={132} />
      </div>
    ),
    { ...size },
  );
}
