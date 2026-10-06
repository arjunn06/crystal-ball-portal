/** Geometric capsule used as the Red / Blue product marker. Decorative. */
export function PillCapsule({
  tone,
  className = "",
}: {
  tone: "red" | "blue";
  className?: string;
}) {
  const color = tone === "red" ? "var(--pill-red)" : "var(--pill-blue)";
  return (
    <span
      aria-hidden
      className={`inline-block overflow-hidden rounded-full ${className}`}
      style={{
        aspectRatio: "2.3 / 1",
        background: `linear-gradient(90deg, ${color} 0 50%, hsl(220 12% 14%) 50% 100%)`,
        boxShadow: `inset 0 2px 3px hsl(0 0% 100% / 0.32), inset 0 -4px 6px hsl(220 30% 4% / 0.45), 0 18px 40px -14px color-mix(in srgb, ${color} 55%, transparent)`,
      }}
    >
      <span className="absolute inset-x-[8%] top-[14%] h-[22%] rounded-full bg-white/30 blur-[1px]" />
    </span>
  );
}
