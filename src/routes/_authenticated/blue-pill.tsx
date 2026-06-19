import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CalendarPlus, PlayCircle, Radio, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createBluePillSubscription, verifyPayment } from "@/lib/razorpay.functions";
import { openRazorpay } from "@/lib/razorpay-checkout";

export const Route = createFileRoute("/_authenticated/blue-pill")({
  head: () => ({ meta: [{ title: "The Blue Pill — Blueprint" }] }),
  component: BluePill,
});

function BluePill() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const createSub = useServerFn(createBluePillSubscription);
  const verify = useServerFn(verifyPayment);

  useEffect(() => {
    supabase.from("subscriptions").select("status").maybeSingle().then(({ data }) => {
      setActive(data?.status === "active");
      setLoading(false);
    });
  }, []);

  async function subscribe() {
    setPaying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { subscriptionId, keyId } = await createSub();
      await openRazorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: "Blueprint by Arjun IFVG",
        description: "Blue Pill — ₹499 / month",
        prefill: { email: user?.email ?? undefined },
        theme: { color: "#0a0f1f" },
        handler: async (resp) => {
          try {
            await verify({ data: resp });
            setActive(true);
            toast.success("Subscription active. Welcome.");
          } catch (e: any) {
            toast.error(e?.message ?? "Verification failed");
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start checkout");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-display text-lg font-semibold">blueprint<span className="text-primary">.</span></Link>
        <Link to="/choose" className="text-xs text-muted-foreground hover:text-foreground">← change pill</Link>
      </header>

      <main className="relative mx-auto max-w-5xl px-6 pb-20">
        <p className="label-mono text-blue-pill">The Blue Pill</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Premium education, <span className="text-gradient-blue">on your time.</span>
        </h1>

        {!active ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-8 max-w-2xl">
            <h2 className="text-xl font-semibold">Start your subscription</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ₹499 / month. Cancel anytime. Unlocks the full Red Pill recorded library,
              one monthly private call, weekly market reviews, and the Premium Discord.
            </p>
            <Button onClick={subscribe} disabled={paying} className="mt-6 bg-blue-pill text-blue-pill-foreground hover:bg-blue-pill/90 glow-blue">
              {paying ? "Opening checkout…" : "Subscribe — ₹499 / month"}
            </Button>
          </div>
        ) : (
          <section className="mt-10 grid gap-6 md:grid-cols-2">
            <PanelCard icon={PlayCircle} title="Recorded courses" desc="The full Red Pill premium education, uncut." cta="Open library" />
            <PanelCard icon={Radio} title="NY Session livestreams" desc="Live in the Premium Discord every session." cta="Open Discord" />
            <PanelCard icon={Sparkles} title="Weekly market review" desc="Posted every Sunday. Full breakdown." cta="Watch latest" />
            <PanelCard icon={CalendarPlus} title="Your monthly private call" desc="One free 1-on-1 each month." cta="Schedule" />
          </section>
        )}
      </main>
    </div>
  );
}

function PanelCard({ icon: Icon, title, desc, cta }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; cta: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 hover:border-blue-pill/40 transition-colors">
      <div className="size-10 rounded-lg bg-blue-pill/10 text-blue-pill flex items-center justify-center">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Button disabled variant="outline" size="sm" className="mt-5 bg-secondary border-border">
        {cta}
      </Button>
    </div>
  );
}