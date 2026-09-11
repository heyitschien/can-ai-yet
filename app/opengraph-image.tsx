import { ImageResponse } from "next/og";
import { BRAND, BrandMark } from "@/lib/brand/share-mark";

export const alt = "Can AI Yet? We test real work so you don’t have to guess.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BRAND.paper,
          color: BRAND.ink,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <BrandMark size={44} />
            <div style={{ fontSize: 22, letterSpacing: "0.22em", fontWeight: 700 }}>CAN AI YET</div>
          </div>
          <div style={{ fontSize: 22, color: BRAND.muted }}>{BRAND.site}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div style={{ fontSize: 28, letterSpacing: "0.16em", color: BRAND.muted, fontWeight: 700 }}>
            CAPABILITY LABORATORY
          </div>
          <div style={{ marginTop: 18, fontSize: 78, lineHeight: 1.02, letterSpacing: "-0.03em", fontWeight: 700 }}>
            Can AI actually do this?
          </div>
          <div style={{ marginTop: 22, fontSize: 32, color: BRAND.muted }}>{BRAND.shareDescription}</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <StatusChip label="Ready" color={BRAND.green} />
          <StatusChip label="Needs a person" color={BRAND.yellow} />
          <StatusChip label="Not yet" color={BRAND.red} />
        </div>
      </div>
    ),
    { ...size },
  );
}

function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: `1px solid ${BRAND.line}`,
        borderRadius: 999,
        padding: "10px 16px",
        fontSize: 22,
        color,
        background: "#fbfaf6",
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 10, background: color }} />
      {label}
    </div>
  );
}
