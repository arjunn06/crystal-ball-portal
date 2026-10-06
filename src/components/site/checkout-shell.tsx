import { Link } from "@tanstack/react-router";
import { SignOut } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { LogoIcon } from "@/components/logo-icon";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "./shell";
import { PillCapsule } from "./pill-capsule";
import { container } from "./ui";

const TONES = {
  red: {
    glow: "radial-gradient(700px 400px at 100% 0%, hsl(4 70% 40% / 0.28), transparent 65%), linear-gradient(180deg, hsl(4 22% 10%), var(--surface))",
    border: "border-pill-red/25",
    page: "bg-[radial-gradient(800px_420px_at_85%_-10%,hsl(4_70%_45%/0.2),transparent_70%)]",
  },
  blue: {
    glow: "radial-gradient(700px 400px at 100% 0%, hsl(214 80% 50% / 0.26), transparent 65%), linear-gradient(180deg, hsl(214 24% 10%), var(--surface))",
    border: "border-pill-blue/25",
    page: "bg-[radial-gradient(800px_420px_at_85%_-10%,hsl(214_80%_55%/0.2),transparent_70%)]",
  },
} as const;

/**
 * Checkout page frame: slim header, pitch on the left, payment panel on the right.
 * Shared by enroll, subscribe and the Red Pill invite so the buying flow reads as one thing.
 */
export function CheckoutShell({
  tone,
  email,
  intro,
  children,
}: {
  tone: "red" | "blue";
  email?: string | null;
  intro: ReactNode;
  children: ReactNode;
}) {
  const t = TONES[tone];
  return (
    <SiteShell>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[600px] ${t.page}`}
      />
      <header className={`${container} relative flex h-16 items-center justify-between`}>
        <Link to="/" className="flex items-center gap-2.5" aria-label="Blueprint home">
          <LogoIcon className="size-8 text-primary" />
          <span className="font-display text-[19px] font-extrabold tracking-tight">Blueprint</span>
        </Link>
        {email !== undefined && (
          <div className="flex items-center gap-4">
            {email && (
              <span className="hidden max-w-[220px] truncate text-sm text-muted-foreground sm:inline">
                {email}
              </span>
            )}
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <SignOut className="size-4" weight="bold" />
              Sign out
            </button>
          </div>
        )}
      </header>

      <main
        id="main"
        className={`${container} relative grid items-center gap-12 py-12 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[1fr_minmax(0,480px)] lg:gap-20 lg:py-16`}
      >
        <div className="relative">
          <PillCapsule tone={tone} className="relative mb-8 w-24 rotate-[-20deg]" />
          {intro}
        </div>
        <div
          className={`relative overflow-hidden rounded-2xl border p-7 md:p-9 ${t.border}`}
          style={{ background: t.glow }}
        >
          {children}
        </div>
      </main>

      <footer className="relative border-t border-border">
        <div
          className={`${container} flex h-14 items-center justify-between text-xs text-muted-foreground`}
        >
          <span>© Blueprint by Arjun IFVG</span>
          <span>Payments secured by Razorpay</span>
        </div>
      </footer>
    </SiteShell>
  );
}
