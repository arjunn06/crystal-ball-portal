"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "motion/react";

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
  { n: "09", title: "Futures & Forex Prop Firm Rules", phase: "ADVANCED", accent: "#FFC107" },
];

export function CourseParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  const bgY = useTransform(smooth, [0, 1], ["-8%", "8%"]);
  const glowY = useTransform(smooth, [0, 1], ["-15%", "15%"]);

  // Rail fill progress tracks scroll through the timeline area
  const { scrollYProgress: railProgress } = useScroll({
    target: ref,
    offset: ["start 60%", "end 80%"],
  });
  const railScale = useSpring(railProgress, { stiffness: 100, damping: 30 });

  return (
    <section
      id="inside"
      ref={ref}
      className="relative z-10 bg-[#0A0A0F] overflow-hidden py-24 md:py-32"
    >
      {/* Parallax backdrop */}
      <motion.div aria-hidden style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_0%,rgba(171,71,188,0.14),transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#FAFAFA 1px, transparent 1px), linear-gradient(90deg, #FAFAFA 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </motion.div>
      <motion.div
        aria-hidden
        style={{ y: glowY }}
        className="absolute left-1/2 top-1/3 -translate-x-1/2 size-[70vmin] rounded-full bg-[radial-gradient(circle,rgba(229,57,53,0.12),transparent_70%)] blur-3xl pointer-events-none"
      />

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full border border-[#1B1B21] bg-[#101014]/60 backdrop-blur text-[#8B8B96] text-[11px] font-semibold tracking-[0.16em] uppercase">
          <span className="size-1.5 rounded-full bg-[#E53935]" />
          The Curriculum
          <span className="size-1.5 rounded-full bg-[#AB47BC]" />
        </div>
        <h2
          style={{ ...clash, letterSpacing: "-0.01em" }}
          className="mt-6 text-[40px] md:text-[60px] font-bold leading-[1.02] text-[#FAFAFA]"
        >
          Nine modules. <span className="text-[#8B8B96]">One Blueprint.</span>
        </h2>
        <p className="mt-4 text-[15px] md:text-[16px] text-[#8B8B96] max-w-xl mx-auto">
          A guided path from your first candle to prop-firm-ready execution.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 mt-16 md:mt-24">
        {/* Center rail (desktop) */}
        <div className="pointer-events-none absolute left-6 md:left-1/2 top-0 bottom-0 md:-translate-x-1/2 w-px bg-[#1B1B21]" />
        <motion.div
          style={{ scaleY: railScale, transformOrigin: "top" }}
          className="pointer-events-none absolute left-6 md:left-1/2 top-0 bottom-0 md:-translate-x-1/2 w-px bg-gradient-to-b from-[#E53935] via-[#AB47BC] to-[#FFC107]"
        />

        <ol className="relative space-y-10 md:space-y-16">
          {MODULES.map((m, i) => (
            <TimelineItem key={m.n} m={m} index={i} />
          ))}
        </ol>
      </div>

      {/* Footer meta */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 mt-16 flex items-center justify-between text-[11px] font-semibold tracking-[0.16em] uppercase text-[#6B6B72]">
        <span>{MODULES.length} modules · self-paced</span>
        <span>Included in Blue Pill</span>
      </div>
    </section>
  );
}

function TimelineItem({ m, index }: { m: Module; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const isRight = index % 2 === 1;

  return (
    <li ref={ref} className="relative md:grid md:grid-cols-2 md:gap-12">
      {/* Node dot */}
      <motion.span
        aria-hidden
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="absolute left-6 md:left-1/2 top-6 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10"
      >
        <span
          className="block size-3 rounded-full ring-4 ring-[#0A0A0F]"
          style={{ background: m.accent, boxShadow: `0 0 20px ${m.accent}80` }}
        />
      </motion.span>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`pl-14 md:pl-0 ${isRight ? "md:col-start-2" : "md:col-start-1 md:text-right"}`}
      >
        <article
          className="group relative overflow-hidden rounded-2xl border border-[#1B1B21] bg-[#101014] p-6 md:p-7 transition-all duration-300 hover:border-white/10"
          style={{
            boxShadow: `0 0 0 1px transparent`,
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(400px 180px at ${isRight ? "0% 50%" : "100% 50%"}, ${m.accent}22, transparent 70%)`,
            }}
          />
          <div className={`relative flex items-center gap-2 ${isRight ? "" : "md:justify-end"}`}>
            <span
              className="text-[10px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: m.accent }}
            >
              {m.phase}
            </span>
            <span className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#6B6B72]">
              · Module {m.n}
            </span>
          </div>
          <h3
            style={{ ...clash, letterSpacing: "-0.005em" }}
            className="relative mt-3 text-[22px] md:text-[26px] font-semibold text-[#FAFAFA] leading-[1.2]"
          >
            {m.title}
          </h3>
          <div
            className={`relative mt-4 flex items-center gap-2 text-[12px] text-[#8B8B96] ${isRight ? "" : "md:justify-end"}`}
          >
            <span className="size-1.5 rounded-full" style={{ background: m.accent }} />
            Included in Blue Pill subscription
          </div>
          <div
            aria-hidden
            className={`pointer-events-none absolute ${isRight ? "-left-6" : "-right-6"} top-1/2 -translate-y-1/2 text-[100px] md:text-[140px] font-bold leading-none text-transparent select-none opacity-60`}
            style={{ ...clash, WebkitTextStroke: `1px ${m.accent}30` }}
          >
            {m.n}
          </div>
        </article>
      </motion.div>
    </li>
  );
}