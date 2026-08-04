import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Zap, Users } from "lucide-react";
import { LogoIcon } from "@/components/logo-icon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blueprint by Arjun IFVG — Choose Your Pill" },
      {
        name: "description",
        content:
          "Two ways to learn IFVG trading: The Red Pill 1-month live Zoom mentorship at ₹2999, or The Blue Pill community at ₹499/month.",
      },
      { property: "og:title", content: "Blueprint by Arjun IFVG — Choose Your Pill" },
      {
        property: "og:description",
        content: "Red Pill: 1-month live IFVG mentorship at ₹2999. Blue Pill: community at ₹499/month.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blueprint.ifvg.in/" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-blueprint.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Blueprint by Arjun IFVG — Choose Your Pill" },
      {
        name: "twitter:description",
        content: "Red Pill: 1-month live IFVG mentorship at ₹2999. Blue Pill: community at ₹499/month.",
      },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-blueprint.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/" }],
  }),
  component: Chooser,
});

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };
const archivo = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };

function Chooser() {
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
            "radial-gradient(1200px 500px at 50% -100px, #FFD7B8 0%, #FBE6D0 35%, rgba(245,238,227,0) 75%)",
        }}
      />

      <header className="relative z-50 mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon className="text-black size-10" />
        </Link>
        <Link
          to="/auth"
          className="inline-flex items-center h-11 px-5 rounded-full border border-black/10 bg-white text-[13.5px] font-semibold hover:bg-[#FAFAFA] transition-colors"
        >
          Sign in
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-8 pb-16 text-center">
        <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-[#0B0B10] text-white/90 text-[11px] font-semibold tracking-[0.16em] uppercase">
          <span className="size-1.5 rounded-full bg-[#FF6B35]" />
          BLUEPRINT BY ARJUN IFVG
        </div>
        <h1
          style={{ ...clash, letterSpacing: "-0.01em" }}
          className="mx-auto mt-6 max-w-3xl text-[46px] md:text-[70px] font-bold leading-[0.98]"
        >
          Choose your pill.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-[1.55] text-[#4A4A52]">
          Learn the IFVG model the way that fits you — an intense one-month live
          mentorship, or the ongoing members-only community.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28 grid md:grid-cols-2 gap-6">
        {/* RED PILL */}
        <div className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-8 md:p-10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)] flex flex-col">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 size-72 rounded-full opacity-45"
            style={{ background: "radial-gradient(closest-side,#FFC0B0,transparent)" }}
          />
          <div className="relative">
            <span
              className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-white text-[11px] font-bold tracking-[0.16em] uppercase"
              style={{ background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)" }}
            >
              <Zap className="size-3.5" fill="currentColor" />
              THE RED PILL
            </span>
            <h2 style={clash} className="mt-5 text-[34px] md:text-[40px] font-bold leading-[1.06]">
              1-Month Live
              <br />
              Mentorship
            </h2>
            <p className="mt-4 text-[15px] leading-[1.55] text-[#5A5A62]">
              Basics to advanced IFVG, taught live on Zoom. The full course is
              covered in one week — the rest of the month we trade together and
              break down my live executions.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Live Zoom classes — course done in 1 week",
                "3 weeks of live trading & execution reviews",
                "Premium Discord access included",
                "Direct access to me throughout the month",
              ].map((i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-[#1A1A1F]">
                  <span className="mt-0.5 size-5 rounded-full bg-[#F7F1E8] border border-black/5 grid place-items-center shrink-0">
                    <Check className="size-3 text-[#E53935]" strokeWidth={3} />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mt-8 pt-6 border-t border-black/5">
            <div className="flex items-baseline gap-1">
              <span style={clash} className="text-[44px] font-bold leading-none">
                ₹2,999
              </span>
              <span className="text-[14px] text-[#6B6B72]">one-time</span>
            </div>
            <Link
              to="/redpill"
              className="mt-5 inline-flex items-center gap-2 h-14 px-7 rounded-full text-white text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(229,57,53,0.65)] hover:-translate-y-px transition-transform"
              style={{ background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)" }}
            >
              Take the Red Pill
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* BLUE PILL */}
        <div className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-8 md:p-10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)] flex flex-col">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 size-72 rounded-full opacity-40"
            style={{ background: "radial-gradient(closest-side,#E3C7F0,transparent)" }}
          />
          <div className="relative">
            <span
              className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-white text-[11px] font-bold tracking-[0.16em] uppercase"
              style={{ background: "linear-gradient(135deg,#AB47BC 0%,#7E57C2 100%)" }}
            >
              <Users className="size-3.5" />
              THE BLUE PILL
            </span>
            <h2 style={clash} className="mt-5 text-[34px] md:text-[40px] font-bold leading-[1.06]">
              The Members
              <br />
              Community
            </h2>
            <p className="mt-4 text-[15px] leading-[1.55] text-[#5A5A62]">
              Every recorded Red Pill session, uncut. Live NY calls, trade
              alerts and the members-only Discord — month to month.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "All premium class recordings, uncut",
                "Exclusive trade alerts of my own setups",
                "Live trading streams & one private call monthly",
                "Members-only Discord with Blue Pill role",
              ].map((i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-[#1A1A1F]">
                  <span className="mt-0.5 size-5 rounded-full bg-[#F7F1E8] border border-black/5 grid place-items-center shrink-0">
                    <Check className="size-3 text-[#AB47BC]" strokeWidth={3} />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mt-8 pt-6 border-t border-black/5">
            <div className="flex items-baseline gap-1">
              <span style={clash} className="text-[44px] font-bold leading-none">
                ₹499
              </span>
              <span className="text-[14px] text-[#6B6B72]">/month</span>
            </div>
            <Link
              to="/bluepill"
              className="mt-5 inline-flex items-center gap-2 h-14 px-7 rounded-full bg-[#0B0B10] text-white text-[15px] font-semibold hover:bg-black transition-colors shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]"
            >
              Explore the Blue Pill
              <ArrowRight className="size-4" />
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
