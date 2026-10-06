import type { CSSProperties, ElementType, ReactNode } from "react";
import { QUOTES, type Quote } from "./config";

/** Wrapper that opts an element into the once-only scroll reveal. `i` staggers siblings (max 4). */
export function Rv({
  as: Tag = "div",
  i = 0,
  className,
  children,
  id,
}: {
  as?: ElementType;
  i?: number;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Tag
      id={id}
      data-reveal
      className={className}
      style={{ "--i": Math.min(i, 4) } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

export function Fn({ n }: { n: number }) {
  return (
    <sup className="ml-0.5 align-super text-xs leading-none">
      <a
        href={`#fn-${n}`}
        aria-label={`Footnote ${n}`}
        className="relative inline-block px-1 hover:underline"
      >
        {n}
        <span aria-hidden className="absolute -inset-2" />
      </a>
    </sup>
  );
}

/** Splits `text` around the emphasised substrings without altering a single character. */
function withEmphasis(text: string, emphasis: string[] = []): ReactNode[] {
  if (!emphasis.length) return [text];
  const out: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length) {
    let hit: { at: number; s: string } | null = null;
    for (const s of emphasis) {
      const at = rest.indexOf(s);
      if (at >= 0 && (!hit || at < hit.at)) hit = { at, s };
    }
    if (!hit) {
      out.push(rest);
      break;
    }
    if (hit.at > 0) out.push(rest.slice(0, hit.at));
    out.push(
      <strong key={key++} className="rp-emph font-semibold">
        {hit.s}
      </strong>,
    );
    rest = rest.slice(hit.at + hit.s.length);
  }
  return out;
}

export function QuoteBody({ q, className = "" }: { q: Quote; className?: string }) {
  return (
    <p lang={q.lang} className={className}>
      {withEmphasis(q.text, q.emphasis)}
    </p>
  );
}

/** A verbatim Discord message. Handle, source chip, original wording; translation only if approved. */
export function QuoteCard({ id }: { id: Quote["id"] }) {
  const q = QUOTES[id];
  return (
    <figure
      className="rp-tile-2 flex h-full flex-col justify-between p-5"
      style={{ borderRadius: 16 }}
    >
      <blockquote>
        <QuoteBody q={q} className="text-[19px] leading-[1.35] tracking-[-0.01em]" />
        {q.translation && <p className="rp-small rp-ink2 mt-3">Translation: {q.translation}</p>}
      </blockquote>
      <figcaption className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[17px] font-semibold">{q.handle}</span>
        <span className="rp-small rp-ink2">From the members Discord</span>
      </figcaption>
    </figure>
  );
}
