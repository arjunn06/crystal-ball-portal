import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/choose")({
  head: () => ({ meta: [{ title: "Choose your pill — Blueprint" }] }),
  component: Choose,
});

function Choose() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState<"red" | "blue" | null>(null);

  useEffect(() => {
    // If already chose, route them onward
    supabase.from("pill_choices").select("pill").maybeSingle().then(({ data }) => {
      if (data?.pill === "red") navigate({ to: "/red-pill" });
      if (data?.pill === "blue") navigate({ to: "/blue-pill" });
    });
  }, [navigate]);

  async function choose(pill: "red" | "blue") {
    setSubmitting(pill);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate({ to: "/auth" }); return; }
    const { error } = await supabase.from("pill_choices").upsert({ user_id: user.id, pill });
    if (error) {
      toast.error(error.message);
      setSubmitting(null);
      return;
    }
    navigate({ to: pill === "red" ? "/red-pill" : "/blue-pill" });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-display text-lg font-semibold">blueprint<span className="text-primary">.</span></Link>
        <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
          <LogOut className="size-3.5" /> Sign out
        </button>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 pt-12 pb-20">
        <div className="text-center">
          <p className="label-mono text-muted-foreground">Step 01 — Your choice</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Which pill do you take?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            One choice. Both unlock the Premium Discord. Only one ends in a payout-ready 1-on-1.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <ChoiceCard
            tone="red"
            label="The Red Pill"
            tagline="Full mentorship. From Evaluation to Payout."
            price="₹4,999"
            priceSub="one-time"
            bullets={[
              "1-on-1 discovery call (you book a time)",
              "Direct mentorship & private 1-1 calls",
              "Premium education, uncut",
              "Funded-account support: Eval → Payout",
              "Red Pill role in Premium Discord",
            ]}
            cta="I take the Red Pill"
            onClick={() => choose("red")}
            loading={submitting === "red"}
          />
          <ChoiceCard
            tone="blue"
            label="The Blue Pill"
            tagline="Premium education on your schedule."
            price="₹499"
            priceSub="/ month"
            bullets={[
              "All Red Pill education, recorded & uncut",
              "1 private call with me each month",
              "Weekly market reviews",
              "NY session livestreams",
              "Blue Pill role in Premium Discord",
            ]}
            cta="I take the Blue Pill"
            onClick={() => choose("blue")}
            loading={submitting === "blue"}
          />
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          You can switch later from your member panel. The Red Pill requires admin approval after your call.
        </p>
      </main>
    </div>
  );
}

function ChoiceCard({
  tone, label, tagline, price, priceSub, bullets, cta, onClick, loading,
}: {
  tone: "red" | "blue"; label: string; tagline: string; price: string; priceSub: string;
  bullets: string[]; cta: string; onClick: () => void; loading: boolean;
}) {
  const isRed = tone === "red";
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-500 ${isRed ? "hover:ring-red" : "hover:ring-blue"}`}>
      <div className={`absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-30 ${isRed ? "bg-red-pill" : "bg-blue-pill"}`} />
      <p className={`relative label-mono ${isRed ? "text-red-pill" : "text-blue-pill"}`}>{label}</p>
      <h3 className="relative mt-3 text-2xl font-semibold">{tagline}</h3>
      <div className="relative mt-4 flex items-baseline gap-1.5 font-mono">
        <span className="text-3xl text-foreground">{price}</span>
        <span className="text-sm text-muted-foreground">{priceSub}</span>
      </div>
      <ul className="relative mt-6 space-y-2.5 text-sm">
        {bullets.map(b => (
          <li key={b} className="flex gap-3">
            <span className={`mt-1.5 inline-block size-1.5 shrink-0 rounded-full ${isRed ? "bg-red-pill" : "bg-blue-pill"}`} />
            {b}
          </li>
        ))}
      </ul>
      <Button
        onClick={onClick}
        disabled={loading}
        size="lg"
        className={`relative mt-8 w-full ${isRed ? "bg-red-pill text-red-pill-foreground hover:bg-red-pill/90 glow-red" : "bg-blue-pill text-blue-pill-foreground hover:bg-blue-pill/90 glow-blue"}`}
      >
        {loading ? "…" : cta}
      </Button>
    </div>
  );
}