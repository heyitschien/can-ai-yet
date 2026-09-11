export const BRAND = {
  name: "Can AI Yet",
  title: "Can AI Yet?",
  description: "We test real work so you don’t have to guess whether AI can do it yet.",
  shareDescription: "We test real work so you don’t have to guess.",
  site: "canaiyet.com",
  paper: "#f4f1ea",
  ink: "#1c1915",
  accent: "#243044",
  muted: "#6d655c",
  line: "#e3dcd0",
  green: "#1b6b45",
  yellow: "#8a5a00",
  red: "#8f2d2d",
} as const;

export function BrandMark({ size }: { size: number }) {
  const radius = Math.round(size * 0.22);
  const dot = Math.max(3, Math.round(size * 0.16));

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: BRAND.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          color: BRAND.paper,
          fontSize: Math.round(size * 0.46),
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        Y?
      </div>
      <div
        style={{
          position: "absolute",
          right: Math.round(size * 0.12),
          bottom: Math.round(size * 0.12),
          width: dot,
          height: dot,
          borderRadius: dot,
          background: "#3d9a68",
        }}
      />
    </div>
  );
}
