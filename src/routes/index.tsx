import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play, Check, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoIcon } from "@/components/logo-icon";
import { CourseParallax } from "@/components/course-parallax";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blueprint — The Blue Pill" },
      {
        name: "description",
        content:
          "The private community for IFVG traders. ₹499/month for every recorded session, live NY calls, and the members-only Discord.",
      },
      { property: "og:title", content: "Blueprint — The Blue Pill" },
      {
        property: "og:description",
        content:
          "₹499/month. Every recorded session, live NY calls, and the members-only Discord.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blueprint.ifvg.in/" },
      { property: "og:image", content: "https://blueprint.ifvg.in/og-blueprint.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Blueprint — The Blue Pill" },
      {
        name: "twitter:description",
        content:
          "₹499/month. Every recorded session, live NY calls, and the members-only Discord.",
      },
      { name: "twitter:image", content: "https://blueprint.ifvg.in/og-blueprint.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.ifvg.in/" }],
  }),
  component: Landing,
});

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };
const archivo = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };

function Landing() {
  return (
    <div
      style={{ ...archivo, backgroundColor: "#F5EEE3", color: "#0B0B10" }}
      className="min-h-screen relative overflow-hidden"
    >
      {/* warm gradient wash — mirrors contentrewards' peach top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            "radial-gradient(1200px 500px at 50% -100px, #FFD7B8 0%, #FBE6D0 35%, rgba(245,238,227,0) 75%)",
        }}
      />

      {/* NAV */}
      <SiteNav />
      <div className="h-20" aria-hidden />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-10 lg:pt-16 pb-24 grid lg:grid-cols-2 gap-12 lg:gap-6 items-center">
        <div>
          <h1
            style={{ ...clash, letterSpacing: "-0.01em" }}
            className="text-[52px] md:text-[72px] leading-[0.98] font-bold text-[#0B0B10]"
          >
            Premium education
            <br />
            <div className="inline-flex items-center gap-3 md:gap-4 flex-wrap">
              doesn't mean
              <br />
              <span
                className="inline-flex items-center h-14 md:h-16 pl-2 pr-5 rounded-full text-white text-[22px] md:text-[26px] font-semibold shadow-[0_10px_30px_-10px_rgba(229,57,53,0.7)]"
                style={{
                  background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)",
                  ...clash,
                }}
              >
                <span className="size-10 md:size-12 rounded-full bg-white mr-2 grid place-items-center">
                  <span className="size-2.5 rounded-full bg-[#E53935] animate-pulse" />
                </span>
                Premium price.
              </span>
            </div>
          </h1>

          <p className="mt-7 text-[17px] leading-[1.55] text-[#4A4A52] max-w-md">
            Start your Blue Pill subscription now and get immediate access to
            our exclusive premium class recordings - uncut directly from The Red
            Pill Mentorship sessions!
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 h-14 px-7 rounded-full text-white text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(229,57,53,0.65)] hover:-translate-y-px transition-transform"
              style={{ background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)" }}
            >
              Get access now · ₹499/mo
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#inside"
              className="inline-flex items-center h-14 px-7 rounded-full bg-white text-[#0B0B10] text-[15px] font-semibold border border-black/5 hover:bg-[#FAFAFA] transition-colors shadow-sm"
            >
              What's Inside
            </a>
          </div>

          <div className="mt-8 flex items-center gap-2 text-[12px] text-[#6B6B72]">
            <span className="size-1.5 rounded-full bg-[#E53935] animate-pulse" />
            Cancel anytime
          </div>
        </div>

        {/* Right — floating tilted trading cards */}
        <div className="relative h-[560px] hidden lg:block">
          <HeroShowcase />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-[#0B0B10] text-white/90 text-[11px] font-semibold tracking-[0.16em] uppercase">
            <span className="size-1.5 rounded-full bg-[#FF6B35]" />
            HOW IT WORKS
            <span className="size-1.5 rounded-full bg-[#FF6B35]" />
          </div>
          <h2
            style={{ ...clash, letterSpacing: "-0.005em" }}
            className="mt-6 text-[40px] md:text-[54px] font-bold leading-[1.05] text-[#0B0B10] max-w-2xl"
          >
            Get in the room of winners in 3 simple steps
          </h2>
          <p className="mt-4 text-[16px] text-[#5A5A62] max-w-xl">
            The path to your trading consistency begins here.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-5">
          <Step
            n="01"
            title="Get Access"
            body="Start the ₹499/month Blue Pill membership. Billed monthly, cancel anytime from your account."
            icon={<span className="text-[11px] font-bold tracking-widest">₹499</span>}
          />
          <Step
            n="02"
            title="Claim your Premium Discord role"
            body="Claim an exclusive premium Discord role where you'll get access for our members-only content."
            icon={<DiscordGlyph />}
          />
          <Step
            n="03"
            title="Access Premium Education"
            body="Premium IFVG Trading Education - Uncut and Raw directly from The Red Pill Mentorship recordings."
            icon={<Play className="size-4" fill="currentColor" />}
          />
        </div>
      </section>
      {/* COURSE CURRICULUM */}
      <CourseParallax />

      {/* PRICING */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 md:pt-28 pb-28">
        <div
          id="pricing"
          className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white p-8 md:p-12 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)]"
        >
          <div
            aria-hidden
            className="absolute -top-24 -right-24 size-80 rounded-full opacity-40"
            style={{ background: "radial-gradient(closest-side,#FFD7B8,transparent)" }}
          />
          <div className="relative grid md:grid-cols-2 gap-10 items-start">
            <div>
              <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-[#0B0B10]/5 text-[#0B0B10] text-[11px] font-semibold tracking-[0.16em] uppercase">
                BLUE PILL · ₹499/MONTH
              </div>
              <h3
                style={{ ...clash, letterSpacing: "-0.005em" }}
                className="mt-4 text-[36px] md:text-[44px] font-bold leading-[1.08]"
              >
                Take The Blue Pill, Neo.
                <br />
                The Gates are Open.
              </h3>
              <div className="mt-8 flex items-baseline gap-1">
                <span style={clash} className="text-[56px] font-bold leading-none">
                  ₹499
                </span>
                <span className="text-[15px] text-[#6B6B72]">/month</span>
              </div>
              <p className="mt-2 text-[13px] text-[#6B6B72]">Monthly · billed securely via Razorpay</p>
              <Link
                to="/auth"
                className="mt-7 inline-flex items-center gap-2 h-13 px-7 py-4 rounded-full text-white text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(229,57,53,0.65)] hover:-translate-y-px transition-transform"
                style={{ background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)" }}
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-3">
              {[
                "Premium IFVG Education - Even absolute beginners can understand.",
                "Exclusive Trade alerts of setups that I personally take.",
                "Exclusive Trading livestreams.",
                "Members-only Discord with Blue Pill role",
                "Monthly one private call with me.",
                "Cancel anytime, no lock-in",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-[#F7F1E8] border border-black/5 px-4 py-3"
                >
                  <span className="mt-0.5 size-5 rounded-full bg-white border border-black/5 grid place-items-center shrink-0">
                    <Check className="size-3 text-[#E53935]" strokeWidth={3} />
                  </span>
                  <span className="text-[14px] text-[#1A1A1F] font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-black/5">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between text-[12px] text-[#6B6B72]">
          <span>© Blueprint ·by Arjun IFVG&nbsp;</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- floating trading cards ---------- */

function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      <div
        className={`mx-auto flex items-center justify-between transition-all duration-300 ease-out pointer-events-auto ${
          scrolled
            ? "mt-3 max-w-4xl px-3 h-14 rounded-full bg-white/95 backdrop-blur border border-black/5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)]"
            : "mt-0 max-w-7xl px-6 h-20 bg-transparent"
        }`}
      >
        <Link to="/" className={`flex items-center gap-2.5 ${scrolled ? "pl-3" : ""}`}>
          <LogoIcon className={`text-black transition-all ${scrolled ? "size-8" : "size-10"}`} />
        </Link>
        <nav
          className={`hidden md:flex items-center text-[14px] font-medium text-[#1A1A1F] ${
            scrolled ? "gap-6" : "gap-8"
          }`}
        >
          <a href="#inside" onClick={(e) => handleAnchor(e, "inside")} className="hover:opacity-70 transition-opacity">
            Course Overview
          </a>
          <a href="#how" onClick={(e) => handleAnchor(e, "how")} className="hover:opacity-70 transition-opacity">
            How it Works
          </a>
          <a href="#pricing" onClick={(e) => handleAnchor(e, "pricing")} className="hover:opacity-70 transition-opacity">
            Pricing
          </a>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/auth"
            className={`inline-flex items-center rounded-full border border-black/10 bg-white text-[#0B0B10] font-semibold hover:bg-[#FAFAFA] transition-all ${
              scrolled ? "h-10 px-4 text-[12.5px]" : "h-11 px-5 text-[13.5px]"
            }`}
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className={`inline-flex items-center gap-2 rounded-full bg-[#0B0B10] text-white font-semibold hover:bg-black transition-all shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)] ${
              scrolled ? "h-10 px-4 text-[12.5px]" : "h-11 px-5 text-[13.5px]"
            }`}
          >
            Join Blueprint
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

import courseImg from "@/assets/course-curriculum.png.asset.json";
import discordImg from "@/assets/discord-preview.png.asset.json";

function HeroShowcase() {
  return (
    <div className="relative h-full w-full">
      {/* Discord community — back layer, top right */}
      <div
        className="absolute right-0 top-4 w-[420px] rounded-2xl overflow-hidden border border-black/5 bg-white shadow-[0_40px_80px_-30px_rgba(0,0,0,0.35)]"
        style={{ transform: "rotate(2deg)" }}
      >
        <img
          src={discordImg.url}
          alt="Members-only Discord with premium alerts from Arjun IFVG"
          loading="lazy"
          className="block w-full h-auto"
        />
      </div>

      {/* Course curriculum — front layer, bottom left */}
      <div
        className="absolute left-0 bottom-6 w-[250px] rounded-2xl overflow-hidden border border-black/5 bg-white shadow-[0_40px_80px_-25px_rgba(0,0,0,0.4)]"
        style={{ transform: "rotate(-3deg)" }}
      >
        <img
          src={courseImg.url}
          alt="Blueprint course curriculum with modules and lessons"
          loading="lazy"
          className="block w-full h-auto"
        />
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  icon,
}: {
  n: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-3xl bg-white border border-black/5 p-7 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-transform">
      <div className="flex items-center justify-between mb-6">
        <span
          className="inline-flex items-center h-11 px-4 rounded-full text-white text-[13px] font-bold tracking-wider"
          style={{ background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)" }}
        >
          Step {n}
        </span>
        <span className="size-10 rounded-full bg-[#F5EEE3] grid place-items-center text-[#E53935]">
          {icon}
        </span>
      </div>
      <h3
        style={{ ...clash, letterSpacing: "0" }}
        className="text-[24px] font-bold text-[#0B0B10] leading-tight"
      >
        {title}
      </h3>
      <p className="mt-3 text-[14px] leading-[1.55] text-[#5A5A62]">{body}</p>
    </div>
  );
}

function DiscordGlyph({ small = false }: { small?: boolean }) {
  const s = small ? "size-4" : "size-5";
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${s} text-[#5865F2]`}>
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}