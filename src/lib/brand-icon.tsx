// The Lumora ring-and-dot. Guests get gold on navy; the admin app gets navy on gold.
export function BrandIcon({ size, ratio, admin = false }: { size: number; ratio: number; admin?: boolean }) {
  const d = Math.round(size * ratio);
  const bg = admin ? "#C9A66B" : "#1B2A41";
  const fg = admin ? "#1B2A41" : "#C9A66B";
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
      }}
    >
      <svg width={d} height={d} viewBox="295 295 490 490">
        <circle cx="540" cy="540" r="208" fill="none" stroke={fg} strokeWidth="74" />
        <circle cx="540" cy="540" r="62" fill={fg} />
      </svg>
    </div>
  );
}
