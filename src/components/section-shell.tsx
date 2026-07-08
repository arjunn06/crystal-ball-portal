import { Link } from "@tanstack/react-router";
import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SectionShell({
  eyebrow,
  title,
  nav,
  children,
  isAdmin,
}: {
  eyebrow: string;
  title: string;
  nav: Array<{ to: string; label: string; params?: Record<string, string> }>;
  children: ReactNode;
  isAdmin?: boolean;
}) {
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Ambient aurora — same language as the landing page */}
      <div className="pointer-events-none absolute inset-0 bg-aurora-soft" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.07]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-gradient-to-b from-background/0 via-background/0 to-background" />

      <header className="relative z-20 backdrop-blur-xl bg-background/60 border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="font-display text-xl font-semibold tracking-tight">
              blueprint<span className="text-primary">.</span>
            </span>
            <span className="label-mono text-muted-foreground hidden sm:inline">{eyebrow}</span>
          </Link>
          <div className="flex items-center gap-6">
            {isAdmin && (
              <Link to="/admin" className="label-mono text-accent hover:text-accent/80 transition-colors">ADMIN</Link>
            )}
            <Link to="/account" className="label-mono text-muted-foreground hover:text-foreground transition-colors">ACCOUNT</Link>
            <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-14 grid gap-12 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 self-start">
          <p className="label-mono text-platinum mb-1 flex items-center gap-3">
            <span className="inline-block h-px w-6 bg-platinum/60" />
            {title}
          </p>
          <p className="font-display text-lg text-muted-foreground mb-6">Navigate</p>
          <nav className="flex flex-col">
            {nav.map((n, i) => (
              <Link
                key={n.to}
                to={n.to as any}
                params={n.params as any}
                activeOptions={{ exact: true }}
                activeProps={{ className: "text-foreground border-l-primary" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground border-l-transparent hover:border-l-border" }}
                className="group pl-4 pr-3 py-2.5 text-sm transition-all border-l flex items-center gap-3"
              >
                <span className="label-mono opacity-40 group-hover:opacity-70 transition-opacity">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-6 transition-colors hover:border-border">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <p className="label-mono text-muted-foreground">{label}</p>
      <div className="hairline my-4 w-16" />
      <p className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-gradient-platinum">{value}</p>
      {sub && <p className="mt-3 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Editorial page heading — pairs an eyebrow with a display headline. */
export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="space-y-3">
      <p className="label-mono text-platinum flex items-center gap-3">
        <span className="inline-block h-px w-8 bg-platinum/60" />
        {eyebrow}
      </p>
      <h1 className="text-balance text-4xl md:text-5xl font-display font-semibold tracking-tight leading-[1.05]">
        {title}
      </h1>
      {description && <p className="max-w-2xl text-muted-foreground text-base md:text-lg leading-relaxed">{description}</p>}
    </div>
  );
}

export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds < 1) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}