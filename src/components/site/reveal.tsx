"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/** Enter-on-scroll. Communicates sequence: content arrives in reading order. */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hero entrance: runs on mount, staggered by index. Only translates (never hides), so the
 * hero is visible in the server-rendered HTML and LCP is not held back by hydration.
 */
export function Rise({
  children,
  i = 0,
  className,
}: {
  children: ReactNode;
  i?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { y: 28 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, delay: 0.08 + i * 0.09, ease }}
    >
      {children}
    </motion.div>
  );
}
