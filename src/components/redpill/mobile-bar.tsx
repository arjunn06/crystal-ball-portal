"use client";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ENROLL_PATH, PRICE } from "./config";

/**
 * Phone-only bottom bar. Shows after the hero button leaves the screen and hides whenever any
 * in-page filled button, the price card, the closing section or the notes are on screen, so two
 * Enroll buttons are never visible together. Mounted on the client only (not in server HTML).
 */
export function RpMobileBar() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const visible = new Set<Element>();
    let heroGone = false;
    const recompute = () => setShow(heroGone && visible.size === 0);

    const hero = document.getElementById("hero-cta");
    const heroObs = new IntersectionObserver(([e]) => {
      heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
      recompute();
    });
    if (hero) heroObs.observe(hero);

    const targets = document.querySelectorAll(
      "[data-cta]:not([data-cta='bar']):not([data-cta='nav']), #join, #faq, #final, #notes",
    );
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      recompute();
    });
    targets.forEach((t) => obs.observe(t));
    return () => {
      heroObs.disconnect();
      obs.disconnect();
    };
  }, [mounted]);

  if (!mounted) return null;
  return (
    <div
      className="rp-bar-cta fixed inset-x-3 z-50 flex h-16 items-center justify-between rounded-2xl px-4 m:hidden"
      style={{
        bottom: "max(12px, env(safe-area-inset-bottom))",
        background: "rgba(18,20,25,0.96)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
      }}
      data-show={show}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="leading-tight">
        <p className="text-[13px] font-semibold">The Red Pill</p>
        <p className="rp-mono text-[15px] font-semibold">{PRICE} once</p>
      </div>
      <Link to={ENROLL_PATH} data-cta="bar" className="rp-btn min-w-[120px] px-5">
        Enroll
      </Link>
    </div>
  );
}
