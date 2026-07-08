import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blueprint — The Blue Pill" },
      {
        name: "description",
        content:
          "The private community for IFVG traders. ₹499/month for every recorded session, live NY calls, and the members-only Discord.",
      },
      { property: "og:title", content: "Blueprint — The Blue Pill" },
      {
        property: "og:description",
        content:
          "₹499/month. Every recorded session, live NY calls, and the members-only Discord.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <div className="size-2 rounded-full bg-primary" />
            </div>
            <span className="font-semibold tracking-tight">Blueprint</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link to="/auth">
              <Button size="sm" className="rounded-lg">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground border border-border/70 rounded-full px-3 py-1 mb-6">
          <span className="size-1.5 rounded-full bg-primary" /> Now accepting members
        </div>
        <h1 className="text-balance text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          The private room for<br />
          <span className="text-gradient-primary">serious IFVG traders.</span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Every recorded session, live NY calls, and the members-only Discord.
          One membership. One decision.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="rounded-lg h-11 px-6">Start membership · ₹499/mo</Button>
          </Link>
          <a
            href="#whats-inside"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            What's inside →
          </a>
        </div>
      </section>

      <section id="whats-inside" className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-border/70 bg-surface p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Blue Pill membership · ₹499/month
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
            Everything you need to trade with the room.
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Full library of every recorded session",
              "Live NY session calls, every day",
              "Weekly Sunday market reviews",
              "Members-only Discord with premium role",
              "New courses and modules added continuously",
              "Cancel anytime, no lock-in",
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <Check className="size-4 text-primary mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 pt-6 border-t border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Monthly · billed via Razorpay</p>
              <p className="text-3xl font-semibold tracking-tight mt-1">
                ₹499<span className="text-base text-muted-foreground font-normal">/month</span>
              </p>
            </div>
            <Link to="/auth">
              <Button size="lg" className="rounded-lg h-11 px-6">Get started</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between text-xs text-muted-foreground">
          <span>Blueprint · IFVG · est. 2026</span>
          <span>Arjun</span>
        </div>
      </footer>
    </div>
  );
}
