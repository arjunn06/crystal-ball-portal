import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Check, DiscordLogo, CreditCard, UserCircle } from "@phosphor-icons/react";
import { SiteShell, SiteNav, SiteFooter } from "@/components/site/shell";
import { Reveal, Rise } from "@/components/site/reveal";
import { PillCapsule } from "@/components/site/pill-capsule";
import { Testimonials } from "@/components/site/testimonials";
import { Faq, type FaqItem } from "@/components/site/faq";
import { btnGhost, btnPrimary, container } from "@/components/site/ui";

const TITLE = "Blueprint by Arjun IFVG | Choose Your Pill";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content:
          "Two ways to learn IFVG trading: The Red Pill 1-month live Zoom mentorship at ₹2,999 + taxes, or The Blue Pill community at ₹499/month + taxes.",
      },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content:
          "Red Pill: 1-month live IFVG mentorship at ₹2,999 + taxes. Blue Pill: community at ₹499/month + taxes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blueprint.ifvg.in/" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-home.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      {
        name: "twitter:description",
        content:
          "Red Pill: 1-month live IFVG mentorship at ₹2,999 + taxes. Blue Pill: community at ₹499/month + taxes.",
      },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-home.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/" }],
  }),
  component: Home,
});

const FAQ: FaqItem[] = [
  {
    q: "What is IFVG?",
    a: "IFVG is the inversion fair value gap model Arjun trades. The program teaches it from candlestick basics through liquidity, time and price, SMT divergences and live examples.",
  },
  {
    q: "Do I need trading experience?",
    a: "No. Both programs start from the basics of candles and price action, so you can follow along as a complete beginner.",
  },
  {
    q: "What is the difference between the two pills?",
    a: "The Red Pill is one month of live mentorship on Zoom: the full course in week one, then we trade together. The Blue Pill is the ongoing community: uncut Red Pill recordings, trade alerts, live streams and a monthly private call.",
  },
  {
    q: "Can I cancel the Blue Pill?",
    a: "Yes. It bills monthly through Razorpay, there is no lock-in, and you can cancel from your account at any time.",
  },
  {
    q: "How does payment work?",
    a: "Payments run securely through Razorpay. The Red Pill is a single payment of ₹2,999 + taxes with no recurring charge. The Blue Pill is ₹499 a month + taxes.",
  },
  {
    q: "Can I start with the Blue Pill and join the Red Pill later?",
    a: "Yes. Blue Pill members can still enroll in the Red Pill whenever they are ready.",
  },
];

function Home() {
  return (
    <SiteShell>
      <SiteNav />
      <main id="main">
        <Hero />
        <Pills />
        <Testimonials heading="What Red Pill students say." />
        <HowItWorks />
        <section id="faq" className="scroll-mt-20 border-t border-border py-24 md:py-32">
          <div className={container}>
            <Reveal>
              <h2 className="max-w-2xl font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
                Questions before you decide.
              </h2>
            </Reveal>
            <div className="mt-12">
              <Faq items={FAQ} />
            </div>
          </div>
        </section>
        <FinalCta />
      </main>
      <SiteFooter />
    </SiteShell>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(900px_420px_at_78%_-10%,hsl(0_0%_100%/0.027),transparent_70%)]"
      />
      <div
        className={`${container} relative grid min-h-[calc(100dvh-4rem)] items-center gap-14 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:py-16`}
      >
        <div>
          <Rise i={0}>
            <h1 className="font-display text-[clamp(2.5rem,5.6vw,4.1rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
              <span className="text-foreground/50">Learn IFVG from</span> real, live trades.
            </h1>
          </Rise>
          <Rise i={1}>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              Arjun teaches the model on Zoom and streams his New York session. Choose the depth
              that fits you.
            </p>
          </Rise>
          <Rise i={2} className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/redpill" className={btnPrimary}>
              Take the Red Pill
              <ArrowRight className="size-4" weight="bold" />
            </Link>
            <Link to="/bluepill" className={btnGhost}>
              Explore the Blue Pill
            </Link>
          </Rise>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const back = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -40]);
  const front = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -90]);
  return (
    <Rise i={2} className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
      <div className="relative pb-10 sm:pb-16 lg:pl-8">
        <motion.div
          style={{ y: back }}
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_50px_120px_-40px_hsl(0_0%_100%/0.105),0_30px_60px_-30px_hsl(220_30%_2%/0.9)]"
        >
          <img
            src="/img/discord-preview.png"
            width={935}
            height={614}
            alt="The members-only Discord premium-alerts channel showing a live trade update from Arjun IFVG"
            className="block h-auto w-full"
            fetchPriority="high"
          />
        </motion.div>
        <motion.div
          style={{ y: front }}
          className="absolute -bottom-0 left-0 w-[34%] min-w-[130px] max-w-[230px] -rotate-3 overflow-hidden rounded-xl border border-border shadow-[0_40px_70px_-25px_hsl(220_30%_2%/0.95)] sm:left-[-2%]"
        >
          <img
            src="/img/course-curriculum.png"
            width={402}
            height={618}
            alt="The Blueprint course curriculum with modules and lessons"
            className="block h-auto w-full"
          />
        </motion.div>
      </div>
    </Rise>
  );
}

/* ------------------------------------------------------------------ */

const RED_FEATURES = [
  "Live Zoom classes. The full course is done in week one.",
  "Three weeks of live trading and execution reviews.",
  "Direct access to Arjun all month.",
  "Premium Discord included.",
];

const BLUE_FEATURES = [
  "Every premium class recording, uncut.",
  "Trade alerts on the setups Arjun takes.",
  "Live streams for high impact news, plus one private call a month.",
  "Members-only Discord with the Blue Pill role.",
];

function Pills() {
  return (
    <section id="pills" className="scroll-mt-20 border-t border-border py-24 md:py-32">
      <div className={container}>
        <Reveal>
          <h2 className="max-w-3xl font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
            Two ways in. Same room.
          </h2>
          <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-muted-foreground">
            Both unlock the premium Discord. The difference is how much of Arjun's time you get.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Reveal className="h-full">
            <article
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-pill-red/25 p-8 md:p-11"
              style={{
                background:
                  "radial-gradient(700px 360px at 100% 0%, hsl(4 70% 40% / 0.28), transparent 65%), linear-gradient(180deg, hsl(4 22% 10%), var(--surface))",
              }}
            >
              <PillCapsule
                tone="red"
                className="absolute right-8 top-9 w-28 rotate-[-24deg] md:w-36"
              />
              <h3 className="font-display text-[2rem] font-extrabold leading-none tracking-tight md:text-[2.6rem]">
                The Red Pill
              </h3>
              <p className="mt-3 max-w-[34ch] text-base text-muted-foreground">
                One month of live mentorship, taught on Zoom.
              </p>
              <ul className="mt-9 space-y-3.5">
                {RED_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] leading-snug">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" weight="bold" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-12">
                <p className="font-display tabular text-5xl font-extrabold tracking-[-0.04em] md:text-6xl">
                  ₹2,999
                  <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                    one-time + taxes
                  </span>
                </p>
                <Link to="/redpill" className={btnPrimary}>
                  Take the Red Pill
                  <ArrowRight className="size-4" weight="bold" />
                </Link>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.1} className="h-full">
            <article
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-pill-blue/25 p-8 md:p-10"
              style={{
                background:
                  "radial-gradient(520px 320px at 100% 0%, hsl(214 80% 50% / 0.24), transparent 65%), linear-gradient(180deg, hsl(214 24% 10%), var(--surface))",
              }}
            >
              <PillCapsule
                tone="blue"
                className="absolute right-7 top-8 w-24 rotate-[22deg] md:w-28"
              />
              <h3 className="font-display text-[1.7rem] font-extrabold leading-none tracking-tight md:text-[2rem]">
                The Blue Pill
              </h3>
              <p className="mt-3 max-w-[30ch] text-base text-muted-foreground">
                Recordings, alerts and the community, month to month.
              </p>
              <ul className="mt-9 space-y-3.5">
                {BLUE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] leading-snug">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" weight="bold" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap items-end justify-between gap-6 pt-12">
                <p className="font-display tabular text-4xl font-extrabold tracking-[-0.04em] md:text-5xl">
                  ₹499
                  <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">
                    /month + taxes
                  </span>
                </p>
                <Link to="/bluepill" className={btnGhost}>
                  Explore the Blue Pill
                  <ArrowRight className="size-4" weight="bold" />
                </Link>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: UserCircle,
    title: "Create your account",
    body: "Sign in with a one-time code sent to your email. No password to remember.",
  },
  {
    icon: CreditCard,
    title: "Pay once or monthly",
    body: "Red Pill is ₹2,999 + taxes, one-time. Blue Pill is ₹499 a month + taxes. Both run through Razorpay.",
  },
  {
    icon: DiscordLogo,
    title: "Claim your Discord role",
    body: "One tap links your Discord and unlocks the members channels, alerts and live streams.",
  },
];

function HowItWorks() {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className={`${container} grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.1] tracking-[-0.035em]">
              Joining takes three moves.
            </h2>
            <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-muted-foreground">
              No calls to book and nothing to install before you start.
            </p>
          </Reveal>
        </div>
        <ol>
          {STEPS.map((s, i) => (
            <Reveal key={s.title}>
              <li className="flex gap-6 border-t border-border py-9 first:border-t-0 first:pt-0 md:gap-8">
                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary">
                  <s.icon className="size-6" weight="regular" />
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border py-28 md:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_380px_at_50%_100%,hsl(0_0%_100%/0.03),transparent_70%)]"
      />
      <PillCapsule
        tone="red"
        className="absolute left-[6%] top-[18%] hidden w-28 rotate-[-18deg] opacity-90 md:block"
      />
      <PillCapsule
        tone="blue"
        className="absolute bottom-[16%] right-[7%] hidden w-32 rotate-[24deg] opacity-90 md:block"
      />
      <div className={`${container} relative`}>
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-[clamp(2.4rem,6.5vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
            Pick a pill and start this week.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/redpill" className={btnPrimary}>
              Take the Red Pill
              <ArrowRight className="size-4" weight="bold" />
            </Link>
            <Link to="/bluepill" className={btnGhost}>
              Explore the Blue Pill
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
