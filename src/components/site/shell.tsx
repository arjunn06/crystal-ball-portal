import { Link } from "@tanstack/react-router";
import { ArrowRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { LogoIcon } from "@/components/logo-icon";
import { btnPrimary, container } from "./ui";

/** Public pages are dark-only (page theme lock). The `dark` class re-scopes the tokens. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="dark grain relative min-h-[100dvh] overflow-x-clip bg-background font-sans text-foreground">
      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      {children}
    </div>
  );
}

const navLink = "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export function SiteNav({ cta }: { cta?: ReactNode | false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className={`${container} flex h-16 items-center justify-between`}>
        <Link to="/" className="flex items-center gap-2.5" aria-label="Blueprint home">
          <LogoIcon className="size-8 text-primary" />
          <span className="font-display text-[19px] font-extrabold tracking-tight max-[420px]:hidden">
            Blueprint
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          <Link to="/redpill" className={navLink} activeProps={{ className: "text-foreground" }}>
            Red Pill
          </Link>
          <Link to="/bluepill" className={navLink} activeProps={{ className: "text-foreground" }}>
            Blue Pill
          </Link>
          <Link to="/" hash="faq" className={navLink}>
            Questions
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/auth" className={`${navLink} px-2`}>
            Sign in
          </Link>
          {cta === false
            ? null
            : (cta ?? (
                <Link to="/" hash="pills" className={`${btnPrimary} !h-10 !px-4 !text-sm`}>
                  Choose a pill
                  <ArrowRight className="size-4" weight="bold" />
                </Link>
              ))}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className={`${container} grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]`}>
        <div>
          <div className="flex items-center gap-2.5">
            <LogoIcon className="size-8 text-primary" />
            <span className="font-display text-[19px] font-extrabold tracking-tight">
              Blueprint
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            IFVG trading education and community, taught live by Arjun.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Programs</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <Link to="/redpill" className="transition-colors hover:text-foreground">
                The Red Pill
              </Link>
            </li>
            <li>
              <Link to="/bluepill" className="transition-colors hover:text-foreground">
                The Blue Pill
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Members</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <Link to="/auth" className="transition-colors hover:text-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div
          className={`${container} flex flex-col gap-3 py-6 text-xs leading-relaxed text-muted-foreground md:flex-row md:items-center md:justify-between`}
        >
          <p>© Blueprint by Arjun IFVG. All rights reserved.</p>
          <p className="max-w-xl md:text-right">
            Education only, not financial advice. Trading carries risk and past results do not
            guarantee future performance.
          </p>
        </div>
      </div>
    </footer>
  );
}
