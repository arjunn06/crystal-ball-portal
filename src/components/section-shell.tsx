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
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <header className="relative z-10 border-b border-border/60 backdrop-blur-xl bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <Link to="/" className="font-display text-lg font-semibold">
              blueprint<span className="text-primary">.</span>
            </Link>
            <span className="label-mono text-muted-foreground hidden sm:inline">{eyebrow}</span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="label-mono text-accent hover:text-accent/80">ADMIN</Link>
            )}
            <Link to="/account" className="label-mono text-muted-foreground hover:text-foreground">ACCOUNT</Link>
            <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <p className="label-mono text-muted-foreground mb-4">{title}</p>
          <nav className="flex flex-col gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to as any}
                params={n.params as any}
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-card text-foreground border-l-2 border-primary" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground border-l-2 border-transparent" }}
                className="px-3 py-2 text-sm transition-colors"
              >
                {n.label}
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
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="label-mono text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-display font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}