import { useEffect } from "react";

declare global {
  interface Window {
    __rv?: ReturnType<typeof setTimeout>;
  }
}

/**
 * One IntersectionObserver for the whole page. Adds `is-in` to every [data-reveal] element the
 * first time it reaches ~88% of the viewport, then stops watching it, so each element animates
 * exactly once. Content is only hidden once JS is running (html.js), and a 4s failsafe in the
 * document head reveals everything if hydration is slow.
 */
export function useRpPage() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");
    if (window.__rv) clearTimeout(window.__rv);

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Inline script for the route head: marks html.js early and arms the reveal failsafe. */
export const RP_HEAD_SCRIPT = `document.documentElement.classList.add('js');window.__rv=setTimeout(function(){document.documentElement.classList.add('reveal-all')},4000);`;
