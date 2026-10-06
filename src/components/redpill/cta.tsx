import { Link } from "@tanstack/react-router";
import { CaretRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ENROLL_PATH, PRICE } from "./config";

/** The single filled button on the page. One verb, one destination. */
export function EnrollButton({
  id,
  placement,
  className = "",
  full,
}: {
  id?: string;
  placement: string;
  className?: string;
  full?: boolean;
}) {
  return (
    <Link
      to={ENROLL_PATH}
      id={id}
      data-cta={placement}
      className={`rp-btn ${full ? "w-full max-w-[360px] m:w-auto m:min-w-[220px]" : ""} ${className}`}
    >
      Enroll for {PRICE}
    </Link>
  );
}

export function Microline({
  children = "One payment. No recurring charge.",
}: {
  children?: ReactNode;
}) {
  return <p className="rp-small rp-ink2 mt-3">{children}</p>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="rp-link">
      {children}
      <CaretRight size={14} weight="bold" aria-hidden />
    </a>
  );
}

export function EnrollTextLink({ children = `Enroll for ${PRICE}` }: { children?: ReactNode }) {
  return (
    <Link to={ENROLL_PATH} className="rp-link">
      {children}
      <CaretRight size={14} weight="bold" aria-hidden />
    </Link>
  );
}
