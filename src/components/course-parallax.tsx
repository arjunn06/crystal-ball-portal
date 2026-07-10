"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "motion/react";

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };

type Module = { n: string; title: string; phase: string; accent: string };

const MODULES: Module[] = [
  { n: "01", title: "Introduction to Trading", phase: "Foundation", accent: "#E53935" },
  { n: "02", title: "Introduction to Market Profiles", phase: "Foundation", accent: "#E53935" },
  { n: "03", title: "Navigate TradingView for Beginners", phase: "Foundation", accent: "#E53935" },
  { n: "04", title: "What are PD Arrays", phase: "Core Model", accent: "#AB47BC" },
  { n: "05", title: "Optimal Trade Entries & ICT Fibonacci", phase: "Core Model", accent: "#AB47BC" },
  { n: "06", title: "Importance of Time & Price", phase: "Core Model", accent: "#AB47BC" },
  { n: "07", title: "The IFVG Model — Explained with Examples", phase: "Core Model", accent: "#AB47BC" },
  { n: "08", title: "How to use SMT Divergences", phase: "Core Model", accent: "#AB47BC" },
  { n: "09", title: "Futures & Forex Prop Firm Rules", phase: "Advanced", accent: "#FFC107" },
];

export function CourseParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0); // px the rail must translate

  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      if (!rail) return;
      const vw = window.innerWidth;
      // rail scroll width minus what fits in the viewport, + a little breathing room
      const d = Math.max(0, rail.scrollWidth - vw + 48);
      setDistance(d);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.35 });

  // Translate the rail exactly by the measured distance over the full pinned scroll.
  const x = useTransform(smooth, [0, 1], [0, -distance]);

  // Layered parallax on the sticky header/background.
  const bgY = useTransform(smooth, [0, 1], ["-4%", "4%"]);
  const titleY = useTransform(smooth, [0, 1], [30, -30]);
  const glowX = useTransform(smooth, [0, 1], ["-8%", "8%"]);

  // Section height = 1 viewport (for the pin) + horizontal distance to scroll.
  const sectionHeight =
    distance > 0 ? `calc(100vh + ${distance}px)` : `${MODULES.length * 45}vh`;

  return (
    <section
      id="inside"
      ref={ref}
      className="relative z-10 bg-[#0A0A0F]"
      style={{ height: sectionHeight }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        {/* Parallax background layers */}
        <motion.div
          aria-hidden
          style={{ y: bgY }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-20%,rgba(171,71,188,0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_100%_120%,rgba(229,57,53,0.12),transparent_60%)]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#FAFAFA 1px, transparent 1px), linear-gradient(90deg, #FAFAFA 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </motion.div>

        <motion.div
          aria-hidden
          style={{ x: glowX }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[55vmin] rounded-full bg-[radial-gradient(circle,rgba(171,71,188,0.22),transparent_70%)] blur-3xl"
        />

        {/* Header */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-14 md:pt-16 shrink-0">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full border border-[#1B1B21] bg-[#101014]/60 backdrop-blur text-[#8B8B96] text-[11px] font-semibold tracking-[0.16em] uppercase">
              <span className="size-1.5 rounded-full bg-[#E53935]" />
              The Curriculum
              <span className="size-1.5 rounded-full bg-[#AB47BC]" />
            </div>
            <span className="ml-auto hidden md:inline text-[11px] font-semibold tracking-[0.16em] uppercase text-[#8B8B96]">
              <ProgressCounter progress={smooth} total={MODULES.length} />
            </span>
          </div>
          <motion.h2
            style={{ y: titleY, ...clash, letterSpacing: "-0.01em" }}
            className="mt-4 text-[36px] md:text-[54px] font-bold leading-[1.02] text-[#FAFAFA] max-w-3xl"
          >
            Nine modules. <span className="text-[#8B8B96]">One Blueprint.</span>
          </motion.h2>
        </div>

        {/* Horizontal rail — fills remaining vertical space */}
        <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-center">
          <motion.div
            ref={railRef}
            style={{ x }}
            className="flex gap-6 will-change-transform px-6"
          >
            {MODULES.map((m, i) => (
              <ModuleCard key={m.n} m={m} index={i} progress={smooth} total={MODULES.length} />
            ))}
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-8 shrink-0">
          <div className="relative h-px bg-[#1B1B21] overflow-hidden">
            <motion.div
              style={{ scaleX: smooth, transformOrigin: "left" }}
              className="absolute inset-0 bg-gradient-to-r from-[#E53935] via-[#AB47BC] to-[#FFC107]"
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold tracking-[0.16em] uppercase text-[#6B6B72]">
            <span>Scroll to explore</span>
            <span>{MODULES.length} modules · self-paced</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModuleCard({
  m,
  index,
  progress,
  total,
}: {
  m: Module;
  index: number;
  progress: MotionValue<number>;
  total: number;
}) {
  // Each card gets its own parallax offset for depth
  const y = useTransform(progress, [0, 1], [index % 2 === 0 ? 30 : -30, index % 2 === 0 ? -30 : 30]);
  const start = Math.max(0, (index - 0.5) / total);
  const peak = index / total + 0.05;
  const end = Math.min(1, (index + 1.2) / total);
  const scale = useTransform(progress, [start, peak, end], [0.94, 1, 0.96]);
  const opacity = useTransform(progress, [start, peak, end], [0.55, 1, 0.65]);

  return (
    <motion.article
      style={{ y, scale, opacity }}
      className="relative shrink-0 w-[78vw] sm:w-[380px] md:w-[420px] h-[58vh] max-h-[520px] min-h-[380px] rounded-3xl border border-[#1B1B21] bg-[#101014] overflow-hidden"
    >
      {/* Accent glow */}
      <div
        aria-hidden
        className="absolute -top-24 -right-16 size-64 rounded-full blur-3xl opacity-30"
        style={{ background: m.accent }}
      />
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${m.accent}, transparent)` }}
      />

      <div className="relative h-full p-7 flex flex-col">
        <div className="flex items-center justify-between">
          <span
            className="text-[11px] font-semibold tracking-[0.18em] uppercase"
            style={{ color: m.accent }}
          >
            Phase · {m.phase}
          </span>
          <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#6B6B72]">
            Module {m.n}
          </span>
        </div>

        <div
          className="mt-auto text-[120px] leading-none font-bold text-transparent select-none"
          style={{ ...clash, WebkitTextStroke: `1px ${m.accent}55` }}
        >
          {m.n}
        </div>

        <h3
          style={{ ...clash, letterSpacing: "-0.005em" }}
          className="mt-4 text-[22px] md:text-[26px] font-semibold text-[#FAFAFA] leading-[1.15]"
        >
          {m.title}
        </h3>

        <div className="mt-5 flex items-center gap-2 text-[12px] text-[#8B8B96]">
          <span className="size-1.5 rounded-full" style={{ background: m.accent }} />
          Included in Blue Pill subscription
        </div>
      </div>
    </motion.article>
  );
}

function ProgressCounter({
  progress,
  total,
}: {
  progress: MotionValue<number>;
  total: number;
}) {
  const current = useTransform(progress, (v) =>
    String(Math.min(total, Math.max(1, Math.ceil(v * total)))).padStart(2, "0"),
  );
  return (
    <span className="tabular-nums">
      <motion.span>{current}</motion.span> / {String(total).padStart(2, "0")}
    </span>
  );
}