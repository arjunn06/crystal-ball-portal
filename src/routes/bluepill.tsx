import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import {
  ArrowRight,
  BroadcastIcon,
  ChatsCircleIcon,
  DiscordLogoIcon,
  PlayCircleIcon,
  ProhibitIcon,
} from "@phosphor-icons/react";
import { SiteShell, SiteNav, SiteFooter } from "@/components/site/shell";
import { Reveal, Rise } from "@/components/site/reveal";
import { PillCapsule } from "@/components/site/pill-capsule";
import { MobileCtaBar } from "@/components/site/mobile-cta";
import { btnLink, btnPrimary, container } from "@/components/site/ui";

const TITLE = "The Blue Pill | ₹499/mo IFVG Community | Blueprint";

export const Route = createFileRoute("/bluepill")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "The private community for IFVG traders. ₹499/month + taxes for every recorded session, live NY calls, and the members-only Discord.",
      },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content:
          "₹499/month + taxes. Every recorded session, live NY calls, and the members-only Discord.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blueprint.ifvg.in/bluepill" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-bluepill.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      {
        name: "twitter:description",
        content:
          "₹499/month + taxes. Every recorded session, live NY calls, and the members-only Discord.",
      },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-bluepill.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/bluepill" }],
  }),
  component: BluePill,
});

const PHASES = [
  {
    name: "Foundation",
    modules: [
      { n: "01", t: "Introduction to Trading" },
      { n: "02", t: "Introduction to Market Profiles" },
      { n: "03", t: "Navigate TradingView for Beginners" },
    ],
  },
  {
    name: "Core model",
    modules: [
      { n: "04", t: "What are PD Arrays" },
      { n: "05", t: "Optimal Trade Entries and ICT Fibonacci" },
      { n: "06", t: "Importance of Time and Price" },
      { n: "07", t: "The IFVG Model, explained with examples" },
      { n: "08", t: "How to use SMT Divergences" },
    ],
  },
  {
    name: "Advanced",
    modules: [{ n: "09", t: "Futures and Forex Prop Firm Rules" }],
  },
];

function BluePill() {
  const heroEnd = useRef<HTMLDivElement>(null);
  return (
    <SiteShell>
      <SiteNav
        cta={
          <Link to="/auth" className={`${btnPrimary} !h-10 !px-4 !text-sm`}>
            Join<span className="hidden sm:inline">&nbsp;for ₹499/month + taxes</span>
          </Link>
        }
      />
      <main id="main">
        <Hero endRef={heroEnd} />
        <Curriculum />
        <Inside />
        <Pricing />
      </main>
      <SiteFooter />
      <MobileCtaBar sentinel={heroEnd}>
        <Link to="/auth" className={`${btnPrimary} w-full`}>
          Join for ₹499/month + taxes
        </Link>
      </MobileCtaBar>
    </SiteShell>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ endRef }: { endRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(900px_420px_at_85%_-10%,hsl(214_80%_55%/0.2),transparent_70%)]"
      />
      <div
        className={`${container} relative grid items-center gap-14 py-14 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-16`}
      >
        <div>
          <Rise i={0}>
            <h1 className="font-display text-[clamp(2.4rem,5.2vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
              <span className="text-foreground/50">Premium education doesn't mean</span> premium
              price.
            </h1>
          </Rise>
          <Rise i={1}>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              Every Red Pill class recording, uncut, plus live NY streams and trade alerts. ₹499 a
              month + taxes.
            </p>
          </Rise>
          <Rise i={2} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link to="/auth" className={btnPrimary}>
              Get access for ₹499/month + taxes
              <ArrowRight className="size-4" weight="bold" />
            </Link>
            <a href="#inside" className={btnLink}>
              See what is inside
            </a>
          </Rise>
        </div>

        <Rise i={2} className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
          <div className="relative pb-6 sm:pb-12 lg:pr-4">
            <div className="ml-auto w-[88%] overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_50px_120px_-40px_hsl(214_80%_40%/0.45),0_30px_60px_-30px_hsl(220_30%_2%/0.9)]">
              <img
                src="/img/discord-preview.png"
                width={935}
                height={614}
                alt="The members-only Discord premium-alerts channel with a live trade update from Arjun IFVG"
                className="block h-auto w-full"
                fetchPriority="high"
              />
            </div>
            <div className="absolute -bottom-2 left-0 w-[36%] min-w-[130px] max-w-[230px] rotate-[2.5deg] overflow-hidden rounded-xl border border-border shadow-[0_40px_70px_-25px_hsl(220_30%_2%/0.95)] sm:bottom-0">
              <img
                src="/img/course-curriculum.png"
                width={402}
                height={618}
                alt="The Blueprint course curriculum with modules and lessons"
                className="block h-auto w-full"
              />
            </div>
          </div>
        </Rise>
      </div>
      <div ref={endRef} aria-hidden className="h-px" />
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Curriculum() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 70%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.4 });

  return (
    <section id="inside" className="scroll-mt-16 border-t border-border py-24 md:py-32">
      <div className={`${container} grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
              Nine modules. One blueprint.
            </h2>
            <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-muted-foreground">
              A guided path from your first candle to prop firm ready execution, on your own
              schedule.
            </p>
          </Reveal>
        </div>

        <ol ref={ref} className="relative pl-10 md:pl-14">
          <span
            aria-hidden
            className="absolute bottom-2 left-[7px] top-2 w-px bg-border md:left-[9px]"
          />
          <motion.span
            aria-hidden
            style={{ scaleY: reduce ? 1 : scaleY, transformOrigin: "top" }}
            className="absolute bottom-2 left-[7px] top-2 w-px bg-primary md:left-[9px]"
          />
          {PHASES.map((ph) => (
            <li key={ph.name} className="pb-12 last:pb-0">
              <p className="relative font-display text-xl font-bold tracking-tight text-muted-foreground">
                <span
                  aria-hidden
                  className="absolute -left-10 top-1.5 size-[15px] rounded-full border-2 border-primary bg-background md:-left-14 md:size-[19px]"
                />
                {ph.name}
              </p>
              <ul className="mt-5 space-y-5">
                {ph.modules.map((m) => (
                  <li key={m.n}>
                    <Reveal y={14}>
                      <div className="flex gap-5">
                        <span className="w-7 shrink-0 pt-1 font-mono text-sm tabular text-primary">
                          {m.n}
                        </span>
                        <span className="font-display text-xl font-bold leading-snug tracking-tight md:text-[1.6rem]">
                          {m.t}
                        </span>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Inside() {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className={container}>
        <Reveal>
          <h2 className="max-w-3xl font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
            What your ₹499 unlocks.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div
              className="relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden rounded-2xl border border-pill-blue/25 p-8"
              style={{
                background:
                  "radial-gradient(520px 320px at 100% 0%, hsl(214 80% 50% / 0.28), transparent 65%), linear-gradient(180deg, hsl(214 24% 10%), var(--surface))",
              }}
            >
              <PlayCircleIcon
                className="absolute right-8 top-8 size-14 text-pill-blue"
                weight="duotone"
              />
              <h3 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
                Every recording, uncut
              </h3>
              <p className="mt-3 max-w-[44ch] text-base leading-relaxed text-muted-foreground">
                Premium IFVG education straight from the Red Pill sessions. Even absolute beginners
                can follow it.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-5">
            <div className="flex h-full min-h-[300px] flex-col justify-end rounded-2xl border border-border bg-surface p-8">
              <DiscordLogoIcon className="mb-auto size-12 text-[#8e99ff]" weight="fill" />
              <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
                Trade alerts and the Discord
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Setups Arjun personally takes, posted live, with your Blue Pill role.
              </p>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-5">
            <div className="relative flex h-full min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface-2 p-8">
              <BroadcastIcon
                className="absolute right-7 top-7 size-10 text-primary"
                weight="regular"
              />
              <h3 className="font-display text-2xl font-extrabold tracking-tight">
                Live trading streams
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                Exclusive streams, including high impact news events.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-4">
            <div className="flex h-full min-h-[220px] flex-col justify-end rounded-2xl border border-border bg-surface p-8">
              <ChatsCircleIcon className="mb-auto size-10 text-primary" weight="regular" />
              <h3 className="font-display text-2xl font-extrabold tracking-tight">
                One private call a month
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                One-to-one time with Arjun, booked from your member panel.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.16} className="lg:col-span-3">
            <div className="flex h-full min-h-[220px] flex-col justify-end rounded-2xl bg-primary p-8 text-primary-foreground">
              <ProhibitIcon className="mb-auto size-10" weight="regular" />
              <h3 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
                Cancel anytime
              </h3>
              <p className="mt-2 text-[15px] leading-snug opacity-80">No lock-in.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-t border-border py-24 md:py-32">
      <div className={container}>
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl border border-pill-blue/25 p-8 md:p-14"
            style={{
              background:
                "radial-gradient(800px 420px at 100% 0%, hsl(214 80% 50% / 0.28), transparent 65%), linear-gradient(180deg, hsl(214 24% 10%), var(--surface))",
            }}
          >
            <PillCapsule
              tone="blue"
              className="absolute right-8 top-10 hidden w-40 rotate-[20deg] md:block"
            />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
                Take the Blue Pill, Neo. The gates are open.
              </h2>
              <p className="mt-8 font-display tabular text-6xl font-extrabold leading-none tracking-[-0.04em]">
                ₹499
                <span className="ml-2 font-sans text-base font-normal tracking-normal text-muted-foreground">
                  /month + taxes
                </span>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Billed monthly and securely through Razorpay. Cancel anytime.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link to="/auth" className={btnPrimary}>
                  Get access now
                  <ArrowRight className="size-4" weight="bold" />
                </Link>
                <Link to="/redpill" className={btnLink}>
                  Want live mentorship? Take the Red Pill
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
