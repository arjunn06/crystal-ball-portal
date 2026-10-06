"use client";
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { useRouterState } from "@tanstack/react-router";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  // The Red Pill page uses native scrolling (Apple-style restraint, and kinder to mid-range phones).
  const native = pathname === "/redpill";
  useEffect(() => {
    if (typeof window === "undefined" || native) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [native]);
  return <>{children}</>;
}
