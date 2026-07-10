import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play, Check, TrendingUp } from "lucide-react";
import { LogoIcon } from "@/components/logo-icon";

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
    ],
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
      <header className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoIcon className="size-9 text-black" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#1A1A1F]">
            <a href="#inside" className="hover:opacity-70 transition-opacity">
              What's Inside
            </a>
            <a href="#how" className="hover:opacity-70 transition-opacity">
              How it Works
            </a>
            <a href="#pricing" className="hover:opacity-70 transition-opacity">
              Pricing
            </a>
            <Link to="/auth" className="hover:opacity-70 transition-opacity">
              Sign in
            </Link>
          </nav>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#0B0B10] text-white text-[13.5px] font-semibold hover:bg-black transition-colors shadow-[0_4px_16px_-4px_rgba(0,0,0,0.35)]"
          >
            Join Blueprint
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

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
          <ChartCard />
          <LiveSessionCard />
          <DiscordRolesCard />
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

      {/* WHAT'S INSIDE / PRICING */}
      <section id="inside" className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
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

function ChartCard() {
  return (
    <div
      className="absolute top-2 right-0 w-[360px] rounded-2xl bg-white border border-black/5 p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)]"
      style={{ transform: "rotate(4deg)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={clash} className="text-[13px] font-bold">
            NQ · 5m
          </span>
          <span className="text-[10px] font-semibold text-[#E53935] bg-[#E53935]/10 px-1.5 py-0.5 rounded">
            IFVG
          </span>
        </div>
        <span className="text-[10px] font-semibold text-[#6B6B72]">NY · 09:42</span>
      </div>
      <Candles />
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-[#0B0B10]">
          <TrendingUp className="size-3 text-[#16A34A]" />
          <span className="font-semibold">+1.24%</span>
          <span className="text-[#6B6B72]">since open</span>
        </div>
        <span className="text-[#6B6B72]">Entry: 20,412.50</span>
      </div>
    </div>
  );
}

function Candles() {
  const candles = [
    { o: 60, c: 40, h: 30, l: 70, up: true },
    { o: 55, c: 45, h: 35, l: 65, up: true },
    { o: 50, c: 58, h: 40, l: 66, up: false },
    { o: 58, c: 42, h: 32, l: 68, up: true },
    { o: 42, c: 34, h: 24, l: 52, up: true },
    { o: 34, c: 46, h: 26, l: 56, up: false },
    { o: 46, c: 38, h: 28, l: 60, up: true },
    { o: 38, c: 30, h: 20, l: 48, up: true },
    { o: 30, c: 40, h: 22, l: 48, up: false },
    { o: 40, c: 28, h: 18, l: 52, up: true },
    { o: 28, c: 22, h: 14, l: 42, up: true },
    { o: 22, c: 32, h: 16, l: 40, up: false },
    { o: 32, c: 20, h: 12, l: 44, up: true },
    { o: 20, c: 14, h: 8, l: 34, up: true },
  ];
  return (
    <svg viewBox="0 0 320 120" className="w-full h-[120px]">
      <rect x="0" y="40" width="320" height="18" fill="#E53935" opacity="0.08" />
      <line x1="0" y1="40" x2="320" y2="40" stroke="#E53935" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.5" />
      <line x1="0" y1="58" x2="320" y2="58" stroke="#E53935" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.5" />
      {candles.map((c, i) => {
        const x = 12 + i * 22;
        const color = c.up ? "#16A34A" : "#E53935";
        const top = Math.min(c.o, c.c);
        const h = Math.abs(c.o - c.c);
        return (
          <g key={i}>
            <line x1={x + 5} x2={x + 5} y1={c.h} y2={c.l} stroke={color} strokeWidth="1" />
            <rect x={x} y={top} width="10" height={h} fill={color} rx="1" />
          </g>
        );
      })}
      <g>
        <line x1="0" y1="48" x2="320" y2="48" stroke="#0B0B10" strokeWidth="0.8" strokeDasharray="2 2" />
        <rect x="272" y="42" width="44" height="12" rx="3" fill="#0B0B10" />
        <text
          x="294"
          y="51"
          fontSize="8"
          fill="white"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="Archivo"
        >
          ENTRY
        </text>
      </g>
    </svg>
  );
}

function LiveSessionCard() {
  return (
    <div
      className="absolute top-[210px] -left-2 w-[300px] rounded-2xl bg-white border border-black/5 p-3 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.28)]"
      style={{ transform: "rotate(-7deg)" }}
    >
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#1A1A24] to-[#0B0B10] aspect-video grid place-items-center">
        <svg viewBox="0 0 240 100" className="absolute inset-0 w-full h-full opacity-70">
          <defs>
            <linearGradient id="lsg" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,70 L30,60 L55,72 L85,50 L120,58 L155,38 L185,44 L215,20 L240,28"
            fill="none"
            stroke="#FF6B35"
            strokeWidth="2"
          />
          <path
            d="M0,70 L30,60 L55,72 L85,50 L120,58 L155,38 L185,44 L215,20 L240,28 L240,100 L0,100 Z"
            fill="url(#lsg)"
            opacity="0.35"
          />
        </svg>
        <div className="relative size-12 rounded-full bg-white grid place-items-center shadow-lg">
          <Play className="size-5 text-[#E53935] ml-0.5" fill="currentColor" />
        </div>
        <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-[#E53935] text-white text-[10px] font-bold tracking-wider">
          <span className="size-1.5 rounded-full bg-white animate-pulse" />
          LIVE · NY
        </span>
        <span className="absolute bottom-2 right-2 text-[10px] font-mono text-white/80 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">
          14:20
        </span>
      </div>
      <div className="mt-3 px-1 pb-1">
        <p style={clash} className="text-[14px] font-bold leading-tight">
          The IFVG Model : Full Class
        </p>
        <p className="text-[11px] text-[#6B6B72] mt-0.5">
          IFVG bias · 09:30 EST · 247 members
        </p>
        <div className="mt-2 h-1 w-full bg-black/5 rounded-full overflow-hidden">
          <div className="h-full w-[62%] bg-[#E53935] rounded-full" />
        </div>
      </div>
    </div>
  );
}

function DiscordRolesCard() {
  return (
    <div
      className="absolute bottom-4 right-4 w-[260px] rounded-2xl bg-white border border-black/5 p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.25)]"
      style={{ transform: "rotate(6deg)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-[0.16em] text-[#6B6B72] uppercase">
          DISCORD ROLES
        </span>
        <DiscordGlyph small />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-[#AB47BC]/10 border border-[#AB47BC]/25 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#AB47BC]" />
            <span className="text-[12px] font-semibold text-[#0B0B10]">Blue Pill</span>
          </div>
          <span className="text-[9px] font-bold text-[#AB47BC] bg-white px-1.5 py-0.5 rounded">
            Premium Member
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-[#E53935]/10 border border-[#E53935]/25 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#E53935]" />
            <span className="text-[12px] font-semibold text-[#0B0B10]">Red Pill</span>
          </div>
          <span className="text-[9px] font-bold text-[#6B6B72]">LOCKED</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-black/[0.03] border border-black/5 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#6B6B72]" />
            <span className="text-[12px] font-semibold text-[#0B0B10]">Verified</span>
          </div>
          <Check className="size-3 text-[#16A34A]" strokeWidth={3} />
        </div>
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