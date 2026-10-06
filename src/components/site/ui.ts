// Shared class recipes for the public site. One shape rule: controls 8px, containers 16px.
const base =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 text-[15px] font-semibold transition duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60";

export const btnPrimary = `${base} bg-primary text-primary-foreground hover:opacity-90`;
export const btnGhost = `${base} border border-border bg-transparent text-foreground hover:bg-hover`;
export const btnLink =
  "inline-flex items-center gap-1.5 text-[15px] font-medium text-foreground underline decoration-border decoration-1 underline-offset-[6px] transition-colors hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export const container = "mx-auto w-full max-w-[1240px] px-5 sm:px-8";
