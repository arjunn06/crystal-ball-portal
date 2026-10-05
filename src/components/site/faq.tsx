"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Plus } from "@phosphor-icons/react";

export type FaqItem = { q: string; a: string };

/**
 * Master-detail FAQ. Wide screens: questions on the left, answer panel on the right.
 * Small screens: the answer opens inline under the chosen question.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-16">
      <ul className="flex flex-col">
        {items.map((it, i) => {
          const active = open === i;
          return (
            <li
              key={it.q}
              className="border-b border-border first:border-t md:border-0 md:first:border-0"
            >
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-expanded={active}
                aria-controls={`faq-panel-${i}`}
                className={`group flex w-full items-start justify-between gap-4 py-5 text-left transition-colors md:rounded-lg md:px-4 md:py-4 ${
                  active
                    ? "text-foreground md:bg-surface"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-[17px] font-medium leading-snug">{it.q}</span>
                <Plus
                  weight="bold"
                  className={`mt-1 size-4 shrink-0 transition-transform duration-300 md:hidden ${active ? "rotate-45 text-primary" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {active && (
                  <motion.div
                    id={`faq-panel-${i}`}
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden md:hidden"
                  >
                    <p className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <div className="relative hidden md:block">
        <div className="sticky top-28 rounded-2xl border border-border bg-surface p-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={open}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="font-display text-2xl font-bold leading-tight">{items[open].q}</h3>
              <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
                {items[open].a}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
