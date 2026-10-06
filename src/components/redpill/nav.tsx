"use client";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ENROLL_PATH, PRICE } from "./config";

const LINKS = [
  { id: "month", label: "The month" },
  { id: "modules", label: "Curriculum" },
  { id: "discord", label: "Discord" },
  { id: "faq", label: "FAQ" },
];

function Wordmark() {
  return (
    <a
      href="#top"
      className="flex min-h-11 items-center gap-2.5"
      aria-label="The Red Pill, back to top"
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--rp-red)" }} />
      <span className="text-[17px] font-semibold tracking-[-0.01em]">The Red Pill</span>
    </a>
  );
}

/** Apple-style local nav: wordmark on phones, links + persistent Enroll once the hero CTA has gone. */
export function RpNav() {
  const [stuck, setStuck] = useState(false);
  const [heroCtaGone, setHeroCtaGone] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sentinel = document.getElementById("rp-sentinel");
    const hero = document.getElementById("hero-cta");
    const obs: IntersectionObserver[] = [];
    if (sentinel) {
      const o = new IntersectionObserver(([e]) => {
        setStuck(!e.isIntersecting);
        if (e.isIntersecting) setActive(null);
      });
      o.observe(sentinel);
      obs.push(o);
    }
    if (hero) {
      const o = new IntersectionObserver(([e]) =>
        setHeroCtaGone(!e.isIntersecting && e.boundingClientRect.top < 0),
      );
      o.observe(hero);
      obs.push(o);
    }
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) spy.observe(el);
    });
    obs.push(spy);
    return () => obs.forEach((o) => o.disconnect());
  }, []);

  return (
    <header className="rp-nav" data-stuck={stuck}>
      <div className="rp-wrap flex h-full items-center justify-between">
        <Wordmark />
        <nav aria-label="Page" className="hidden items-center gap-7 m:flex">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="rp-navlink inline-flex min-h-11 items-center"
              data-active={active === l.id}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="rp-nav-cta hidden items-center gap-4 m:flex" data-hidden={!heroCtaGone}>
          <span className="rp-mono rp-ink2 hidden text-sm l:inline">{PRICE}</span>
          <Link
            to={ENROLL_PATH}
            data-cta="nav"
            className="rp-btn rp-btn-sm"
            tabIndex={heroCtaGone ? 0 : -1}
          >
            Enroll
          </Link>
        </div>
      </div>
    </header>
  );
}
