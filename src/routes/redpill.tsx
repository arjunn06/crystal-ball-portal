import { createFileRoute, Link } from "@tanstack/react-router";
import { Video, CalendarDays, LineChart, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogoIcon } from "@/components/logo-icon";
import { DiscordIcon } from "@/components/discord-icon";
import { joinRedPillWaitlist } from "@/lib/waitlist.functions";
import { waitlistSchema } from "@/lib/waitlist.schema";

export const Route = createFileRoute("/redpill")({
  head: () => ({
    meta: [
      { title: "The Red Pill — 1 Month Live IFVG Mentorship at ₹2999" },
      {
        name: "description",
        content:
          "An intense one-month live Zoom program covering basics to advanced IFVG trading. Course finishes in a week, then we trade together live. ₹2999 with premium Discord access.",
      },
      { property: "og:title", content: "The Red Pill — 1 Month Live IFVG Mentorship" },
      {
        property: "og:description",
        content:
          "Live Zoom classes, course done in one week, then live trading together for the rest of the month. ₹2999.",
      },
      { property: "og:type", content: "product" },
      { property: "og:url", content: "https://blueprint.ifvg.in/redpill" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-blueprint.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The Red Pill — 1 Month Live IFVG Mentorship" },
      {
        name: "twitter:description",
        content: "Live Zoom mentorship, basics to advanced IFVG. ₹2999.",
      },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-blueprint.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/redpill" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "The Red Pill — 1 Month Live IFVG Mentorship",
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

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };
const archivo = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };

const WEEK1 = [
  "Introduction to Trading - Candlestick anatomy and basics",
  "What is Price Action and How does the markets move?",
  "What are ICT Concepts & How to apply them",
  "What is Liquidity",
  "Liquidity Sweeps & Reading Price",
  "Importance of Time & Price",
  "The IFVG Model explained with examples",
  "How to apply SMT Divergences",
  "Futures & Forex prop firm rules and guide",
];

function RedPill() {
  return (
    <div
      style={{ ...archivo, backgroundColor: "#F5EEE3", color: "#0B0B10" }}
      className="min-h-screen relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            "radial-gradient(1200px 500px at 50% -100px, #FFC6BC 0%, #FADEDA 35%, rgba(245,238,227,0) 75%)",
        }}
      />

      <header className="relative z-50 mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon className="text-black size-10" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/bluepill"
            className="hidden md:inline-flex items-center h-11 px-5 rounded-full border border-black/10 bg-white text-[13.5px] font-semibold hover:bg-[#FAFAFA] transition-colors"
          >
            Blue Pill · ₹499/mo
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center h-11 px-5 rounded-full bg-[#0B0B10] text-white text-[13.5px] font-semibold hover:bg-black transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-8 pb-20 flex flex-col items-center text-center">
        <div className="flex flex-col items-center">
          <span
            className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-white text-[11px] font-bold tracking-[0.16em] uppercase"
            style={{ background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)" }}
          >
            <span className="size-1.5 rounded-full bg-white animate-pulse" />
            THE RED PILL · WAITLIST OPEN
          </span>
          <h1
            style={{ ...clash, letterSpacing: "-0.01em" }}
            className="mt-6 text-[46px] md:text-[68px] font-bold leading-[0.98]"
          >
            Steal my 5 figure printing
            <br />
            trading strategy!
          </h1>
          <p className="mt-7 max-w-xl text-[17px] leading-[1.55] text-[#4A4A52]">
            An intense one-month training program conducted entirely live on
            Zoom. The full course is completed in the <strong>first week</strong> —
            for the rest of the days we trade together and analyse my executions
            live, with premium Discord access included.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-full text-white text-[15px] font-semibold shadow-[0_16px_40px_-14px_rgba(229,57,53,0.8)] hover:brightness-105 transition"
              style={{ background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)" }}
            >
              Join the waitlist
            </a>
            <a
              href="#curriculum"
              className="inline-flex items-center h-14 px-7 rounded-full bg-white text-[15px] font-semibold border border-black/5 hover:bg-[#FAFAFA] transition-colors shadow-sm"
            >
              See what's covered
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-[12px] text-[#6B6B72]">
            <span className="size-1.5 rounded-full bg-[#E53935]" />
            This cohort is full — join the waitlist to get a priority slot for free
          </div>
        </div>

        <div className="mt-14 w-full">
          <div className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#6B6B72]">
            Learn more about the program
          </div>
          <div className="mt-5 relative overflow-hidden rounded-[28px] border border-black/5 bg-black shadow-[0_40px_90px_-40px_rgba(0,0,0,0.45)]">
            <div className="aspect-video">
              <iframe
                src="https://www.youtube.com/embed/2fxjbw5fdsk"
                title="The Red Pill — program walkthrough"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* HOW THE MONTH RUNS */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-[#0B0B10] text-white/90 text-[11px] font-semibold tracking-[0.16em] uppercase">
            <span className="size-1.5 rounded-full bg-[#FF2A1F]" />
            HOW THE MONTH RUNS
            <span className="size-1.5 rounded-full bg-[#FF2A1F]" />
          </div>
          <h2
            style={{ ...clash, letterSpacing: "-0.005em" }}
            className="mt-6 max-w-2xl text-[38px] md:text-[52px] font-bold leading-[1.05]"
          >
            Learn in a week. Trade for a month.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          <Phase
            tag="WEEK 1"
            title="The full course, live"
            body="Every module from basics to advanced IFVG, delivered live on Zoom with live Q&A anytime in between the session."
            icon={<Video className="size-4" />}
          />
          <Phase
            tag="WEEKS 2–4"
            title="We trade together"
            body="Daily live sessions where we take the market together — setups, entries and risk management in real time."
            icon={<LineChart className="size-4" />}
          />
          <Phase
            tag="EVERY DAY"
            title="Execution reviews"
            body="I break down my own live executions so you see exactly why each trade was taken — and what was skipped."
            icon={<CalendarDays className="size-4" />}
          />
        </div>
      </section>

      {/* CURRICULUM */}
      <section id="curriculum" className="relative z-10 bg-[#0A0A0F] py-24 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/5 text-white/70 text-[11px] font-semibold tracking-[0.16em] uppercase">
              WEEK 1 CURRICULUM
            </div>
            <h2
              style={{ ...clash, letterSpacing: "-0.005em" }}
              className="mt-6 text-[36px] md:text-[50px] font-bold leading-[1.05] text-[#FAFAFA]"
            >
              Everything covered, live.
            </h2>
            <p className="mt-4 text-[16px] text-[#8B8B96]">
              Nine modules taught end to end in the first week of the program.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-3">
            {WEEK1.map((t, i) => (
              <div
                key={t}
                className="flex items-center gap-4 rounded-2xl bg-[#101014] border border-white/5 px-5 py-4 hover:border-[#E53935]/40 transition-colors"
              >
                <span
                  style={clash}
                  className="text-[13px] font-bold text-[#E53935] w-7 shrink-0"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] text-[#FAFAFA] font-medium">{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl bg-[#101014] border border-white/5 p-6">
            <DiscordIcon className="size-6 text-[#5865F2]" />
            <div className="flex-1 min-w-[240px]">
              <div style={clash} className="text-[18px] font-bold text-[#FAFAFA]">
                Premium Discord access included
              </div>
              <p className="text-[14px] text-[#8B8B96]">
                Trade Alerts, session links and community access for the full program.
              </p>
            </div>
            <a
              href="#waitlist"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white/10 text-white text-[14px] font-semibold border border-white/10 hover:bg-white/15 transition-colors"
            >
              Join the waitlist
            </a>
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-10 md:p-14 text-center shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)]">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 size-80 rounded-full opacity-40"
            style={{ background: "radial-gradient(closest-side,#FFCCC4,transparent)" }}
          />
          <h2 style={clash} className="relative text-[34px] md:text-[46px] font-bold leading-[1.08]">
            Join the waitlist.
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-[16px] text-[#5A5A62]">
            This cohort is full. Leave your email and phone number to lock a{" "}
            <strong>priority slot for the next one — free</strong>. We&apos;ll reach out before
            registrations open publicly.
          </p>

          <WaitlistForm />

          <div className="relative mt-6 text-[13px] text-[#6B6B72]">
            Prefer to start now?{" "}
            <Link to="/bluepill" className="font-semibold underline">
              Try the Blue Pill at ₹499/mo
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-black/5">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between text-[12px] text-[#6B6B72]">
          <span>© Blueprint · by Arjun IFVG</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}

function Phase({
  tag,
  title,
  body,
  icon,
}: {
  tag: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-3xl bg-white border border-black/5 p-7 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-transform">
      <div className="flex items-center justify-between mb-6">
        <span
          className="inline-flex items-center h-11 px-4 rounded-full text-white text-[12px] font-bold tracking-wider"
          style={{ background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)" }}
        >
          {tag}
        </span>
        <span className="size-10 rounded-full bg-[#F5EEE3] grid place-items-center text-[#E53935]">
          {icon}
        </span>
      </div>
      <h3 style={clash} className="text-[23px] font-bold leading-tight">
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.55] text-[#5A5A62]">{body}</p>
    </div>
  );
}
