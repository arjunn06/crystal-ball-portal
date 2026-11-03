import { Link } from "@tanstack/react-router";
import { CaretRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { APPLY_PATH } from "./config";

/** The single filled button on the page. One verb, one destination. */
export function ApplyButton({
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
      to={APPLY_PATH}
      id={id}
      data-cta={placement}
      className={`rp-btn ${full ? "w-full max-w-[360px] m:w-auto m:min-w-[220px]" : ""} ${className}`}
    >
      Apply for a call
    </Link>
  );
}

export function Microline({
  children = "Limited slots. Arjun picks who gets a call.",
}: {
  children?: ReactNode;
}) {
  return <p className="rp-small rp-ink2 mt-3">{children}</p>;
}

export function TextLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  /** Opens in a new tab, for links that leave the site. */
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className="rp-link"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      <CaretRight size={14} weight="bold" aria-hidden />
    </a>
  );
}

export function ApplyTextLink({ children = "Apply for a call" }: { children?: ReactNode }) {
  return (
    <Link to={APPLY_PATH} className="rp-link">
      {children}
      <CaretRight size={14} weight="bold" aria-hidden />
    </Link>
  );
}
