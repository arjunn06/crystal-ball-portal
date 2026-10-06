import { DiscordLogo } from "@phosphor-icons/react";
import { Reveal } from "./reveal";
import { container } from "./ui";

type Quote = { name: string; initial: string; text: string; lang?: string };

// Excerpts from messages in the members Discord. Wording is the students' own.
const FEATURED: Quote = {
  name: "Tobi",
  initial: "T",
  text: "Where I've always been jumping between strategies... I was so confused, blew around 4 CFD accounts till date. Then I started following Arjun bro and joined the red pill.",
};

const GRID: Quote[] = [
  {
    name: "Çythøñ",
    initial: "Ç",
    text: "Bro, in my opinion, ifvg strategy is excellent and your teaching is also really good. I understood the concepts clearly.",
  },
  {
    name: "Jeevan",
    initial: "J",
    text: "The strategy is really good, and your guidance has helped me understand market dynamics and execution much better.",
  },
  {
    name: "Sanu",
    initial: "S",
    lang: "Tamil",
    text: "Bro honest ah sollanum na enaku vanthu neenga sonna strategy concepts la nallave purinchu intha strategy ku thevaiyaana ellame sollitinga athu mattum illama simple ah puriyuramaari eruchu.",
  },
  {
    name: "Veera pradeep 081",
    initial: "V",
    lang: "Tamil",
    text: "Bro unga strategy pakka simple ah nalla puriyara mari iruku.",
  },
];

function Who({ q }: { q: Quote }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid size-10 place-items-center rounded-lg bg-surface-2 text-sm font-semibold text-foreground"
      >
        {q.initial}
      </span>
      <div className="leading-tight">
        <p className="text-[15px] font-semibold">{q.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Red Pill student{q.lang ? `, in ${q.lang}` : ""}
        </p>
      </div>
    </div>
  );
}

export function Testimonials({ heading = "What students say." }: { heading?: string }) {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className={container}>
        <Reveal>
          <h2 className="max-w-3xl font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
            {heading}
          </h2>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <DiscordLogo className="size-4 text-[#8e99ff]" weight="fill" />
            Excerpts from messages in the members Discord.
          </p>
        </Reveal>

        <Reveal className="mt-14">
          <figure className="max-w-4xl">
            <blockquote className="text-balance text-2xl font-semibold leading-snug tracking-[-0.02em] md:text-[2.1rem]">
              “{FEATURED.text}”
            </blockquote>
            <figcaption className="mt-8">
              <Who q={FEATURED} />
            </figcaption>
          </figure>
        </Reveal>

        <div className="mt-16 grid border-t border-border md:grid-cols-2">
          {GRID.map((q, i) => (
            <Reveal
              key={q.name}
              delay={0.06 * (i % 2)}
              className={[
                "flex border-b border-border py-10 last:border-b-0 md:py-12",
                i < 2 ? "md:border-b" : "md:border-b-0",
                i % 2 === 0 ? "md:border-r md:pr-12" : "md:pl-12",
              ].join(" ")}
            >
              <figure className="flex w-full flex-col justify-between gap-8">
                <blockquote
                  lang={q.lang ? "ta-Latn" : undefined}
                  className="text-lg leading-relaxed"
                >
                  “{q.text}”
                </blockquote>
                <figcaption>
                  <Who q={q} />
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
