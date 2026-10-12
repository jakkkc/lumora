// The Lumora ring-and-dot in gold on navy. Used to generate every app icon.
export function BrandIcon({ size, ratio }: { size: number; ratio: number }) {
  const d = Math.round(size * ratio);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1B2A41",
      }}
    >
      <svg width={d} height={d} viewBox="295 295 490 490">
        <circle cx="540" cy="540" r="208" fill="none" stroke="#C9A66B" strokeWidth="74" />
        <circle cx="540" cy="540" r="62" fill="#C9A66B" />
      </svg>
    </div>
  );
}
