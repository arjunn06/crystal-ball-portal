import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { ArrowRight, DiscordLogo, Sun } from "@phosphor-icons/react";
import { SiteShell, SiteNav, SiteFooter } from "@/components/site/shell";
import { Reveal, Rise } from "@/components/site/reveal";
import { PillCapsule } from "@/components/site/pill-capsule";
import { Testimonials } from "@/components/site/testimonials";
import { MobileCtaBar } from "@/components/site/mobile-cta";
import { btnLink, btnPrimary, container } from "@/components/site/ui";

const TITLE = "The Red Pill | 1 Month Live IFVG Mentorship";

export const Route = createFileRoute("/redpill")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "Enroll in the Red Pill: an intense one-month live Zoom trading program with premium Discord access. ₹2,999 + taxes, one-time.",
      },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content:
          "Registrations are open. One month of live IFVG training on Zoom with premium Discord access.",
      },
      { property: "og:type", content: "product" },
      { property: "og:url", content: "https://blueprint.ifvg.in/redpill" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-redpill.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      {
        name: "twitter:description",
        content: "Enroll now: one month of live IFVG training on Zoom, ₹2,999 + taxes, one-time.",
      },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-redpill.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/redpill" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: TITLE,
          description:
            "Intense one-month live Zoom trading program covering basics to advanced IFVG trading, with premium Discord access.",
          provider: { "@type": "Organization", name: "Blueprint by Arjun IFVG" },
          offers: { "@type": "Offer", price: "2999", priceCurrency: "INR" },
        }),
      },
    ],
  }),
  component: RedPill,
});

const CLUSTERS = [
  {
    name: "The foundation",
    items: [
      "Introduction to Trading: candlestick anatomy and basics",
      "What is price action and how do markets move?",
      "What are ICT concepts and how to apply them",
    ],
  },
  {
    name: "Reading liquidity and time",
    items: [
      "What is liquidity",
      "Liquidity sweeps and reading price",
      "The importance of time and price",
    ],
  },
  {
    name: "Executing the model",
    items: [
      "The IFVG model explained with examples",
      "How to apply SMT divergences",
      "Futures and forex prop firm rules and guide",
    ],
  },
];

function RedPill() {
  const heroEnd = useRef<HTMLDivElement>(null);

  return (
    <SiteShell>
      <SiteNav
        cta={
          <Link to="/enroll" className={`${btnPrimary} !h-10 !px-4 !text-sm`}>
            Enroll<span className="hidden sm:inline">&nbsp;for ₹2,999 + taxes</span>
          </Link>
        }
      />
      <main id="main">
        {/* HERO */}
        <section className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(900px_420px_at_85%_-10%,hsl(4_70%_45%/0.22),transparent_70%)]"
          />
          <div
            className={`${container} relative grid items-center gap-12 py-14 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_1.12fr] lg:gap-14 lg:py-16`}
          >
            <div>
              <Rise i={0}>
                <h1 className="font-display text-[clamp(2.4rem,5vw,3.9rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
                  Steal my 5&nbsp;figure printing trading strategy.
                </h1>
              </Rise>
              <Rise i={1}>
                <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
                  One month live on Zoom. The full course in week one, then we trade together.
                </p>
              </Rise>
              <Rise i={2} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Link to="/enroll" className={btnPrimary}>
                  Enroll now for ₹2,999 + taxes
                  <ArrowRight className="size-4" weight="bold" />
                </Link>
                <a href="#curriculum" className={btnLink}>
                  See what is covered
                </a>
              </Rise>
            </div>
            <Rise i={2}>
              <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-[0_50px_120px_-40px_hsl(4_70%_40%/0.45),0_30px_60px_-30px_hsl(220_30%_2%/0.9)]">
                <div className="aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/2fxjbw5fdsk"
                    title="The Red Pill program walkthrough"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
              </div>
            </Rise>
          </div>
          <div ref={heroEnd} aria-hidden className="h-px" />
        </section>

        <Testimonials />

        {/* THE MONTH */}
        <section className="border-t border-border py-24 md:py-32">
          <div className={container}>
            <Reveal>
              <h2 className="max-w-3xl font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
                Learn in a week. Trade for a month.
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-4 md:grid-cols-4">
              <Reveal className="md:col-span-1">
                <div className="flex h-full flex-col justify-between rounded-2xl bg-primary p-7 text-primary-foreground md:min-h-[300px]">
                  <p className="font-display text-4xl font-extrabold leading-none whitespace-nowrap lg:text-5xl tracking-[-0.04em]">
                    Week 1
                  </p>
                  <div className="mt-10">
                    <h3 className="font-display text-xl font-bold leading-tight">
                      The full course, live
                    </h3>
                    <p className="mt-2 text-[15px] leading-snug opacity-80">
                      Every module from basics to advanced IFVG, with live Q&A in between sessions.
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.08} className="md:col-span-3">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-7 md:min-h-[300px]">
                  <p className="font-display text-4xl font-extrabold leading-none whitespace-nowrap lg:text-5xl tracking-[-0.04em] text-muted-foreground">
                    Weeks 2 to 4
                  </p>
                  <div className="mt-10">
                    <h3 className="font-display text-xl font-bold leading-tight">
                      We trade together
                    </h3>
                    <p className="mt-2 max-w-[52ch] text-[15px] leading-snug text-muted-foreground">
                      Live sessions where we take the market together: setups, entries and risk
                      management in real time.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.12}>
              <div className="mt-4 flex items-start gap-4 rounded-2xl border border-border p-6 md:items-center">
                <Sun className="mt-0.5 size-6 shrink-0 text-primary md:mt-0" weight="regular" />
                <p className="text-[15px] leading-snug">
                  <span className="font-semibold">Every day, execution reviews.</span>{" "}
                  <span className="text-muted-foreground">
                    Arjun breaks down his own live trades so you see why each was taken and what was
                    skipped.
                  </span>
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CURRICULUM */}
        <section id="curriculum" className="scroll-mt-16 border-t border-border py-24 md:py-32">
          <div className={container}>
            <Reveal>
              <h2 className="max-w-3xl font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
                Everything covered in week one.
              </h2>
              <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
                Nine modules, taught end to end and live. They build from your first candle to prop
                firm rules.
              </p>
            </Reveal>

            <div className="mt-14 divide-y divide-border border-y border-border">
              {CLUSTERS.map((c, ci) => (
                <Reveal key={c.name} y={16}>
                  <div className="grid gap-8 py-10 md:py-12 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-16">
                    <div>
                      <div className="flex gap-1.5" aria-hidden>
                        {CLUSTERS.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1 w-10 rounded-full ${i <= ci ? "bg-pill-red" : "bg-border"}`}
                          />
                        ))}
                      </div>
                      <h3 className="mt-5 font-display text-2xl font-bold tracking-tight md:text-3xl">
                        {c.name}
                      </h3>
                      <p className="mt-2 font-mono text-sm text-muted-foreground tabular">
                        {String(ci * 3 + 1).padStart(2, "0")} to{" "}
                        {String(ci * 3 + 3).padStart(2, "0")}
                      </p>
                    </div>
                    <ol className="-mx-4 md:-mx-5">
                      {c.items.map((t, i) => (
                        <li
                          key={t}
                          className="group flex items-baseline gap-5 rounded-xl px-4 py-4 transition-colors duration-200 hover:bg-surface md:gap-7 md:px-5 md:py-5"
                        >
                          <span className="w-8 shrink-0 font-mono text-sm tabular text-pill-red">
                            {String(ci * 3 + i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xl font-semibold leading-snug tracking-tight text-foreground/80 transition duration-200 group-hover:translate-x-1 group-hover:text-foreground md:text-2xl">
                            {t}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <div className="mt-20 flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-surface p-6 md:p-7">
                <DiscordLogo className="size-8 shrink-0 text-[#8e99ff]" weight="fill" />
                <div className="min-w-[240px] flex-1">
                  <p className="font-display text-xl font-bold">Premium Discord is included</p>
                  <p className="mt-1 text-[15px] text-muted-foreground">
                    Trade alerts, session links and the community for the full program.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ENROLL */}
        <section id="enroll" className="scroll-mt-16 border-t border-border py-24 md:py-32">
          <div className={container}>
            <Reveal>
              <div
                className="relative overflow-hidden rounded-3xl border border-pill-red/25 p-8 md:p-14"
                style={{
                  background:
                    "radial-gradient(800px 420px at 100% 0%, hsl(4 70% 40% / 0.3), transparent 65%), linear-gradient(180deg, hsl(4 22% 10%), var(--surface))",
                }}
              >
                <PillCapsule
                  tone="red"
                  className="absolute right-8 top-10 hidden w-40 rotate-[-22deg] md:block"
                />
                <div className="relative max-w-2xl">
                  <h2 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
                    Take the Red Pill.
                  </h2>
                  <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
                    Registrations are open to everyone. Seats are limited per cohort.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-5">
                    <Link to="/enroll" className={btnPrimary}>
                      Enroll now for ₹2,999 + taxes
                      <ArrowRight className="size-4" weight="bold" />
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      One payment, no recurring charge.
                    </p>
                  </div>
                  <p className="mt-10 text-[15px] text-muted-foreground">
                    Prefer to start smaller?{" "}
                    <Link to="/bluepill" className={btnLink}>
                      Try the Blue Pill at ₹499/month + taxes
                    </Link>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />

      <MobileCtaBar sentinel={heroEnd}>
        <Link to="/enroll" className={`${btnPrimary} w-full`}>
          Enroll now for ₹2,999 + taxes
        </Link>
      </MobileCtaBar>
    </SiteShell>
  );
}
