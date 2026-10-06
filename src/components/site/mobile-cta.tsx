"use client";
import { useEffect, useState, type ReactNode, type RefObject } from "react";

/** Mobile bar that slides up once the hero CTA has scrolled out of view. */
export function MobileCtaBar({
  sentinel,
  children,
}: {
  sentinel: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sentinel]);

  return (
    <div
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-xl transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {children}
    </div>
  );
}
