import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createRedPillOrder, verifyPayment } from "@/lib/razorpay.functions";
import { openRazorpay } from "@/lib/razorpay-checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, Clock, CreditCard, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/red-pill")({
  head: () => ({ meta: [{ title: "The Red Pill — Blueprint" }] }),
  component: RedPill,
});

type App = {
  id: string;
  status: "pending_call" | "call_scheduled" | "call_completed" | "approved" | "rejected" | "paid";
  call_scheduled_at: string | null;
};

function RedPill() {
  const navigate = useNavigate();
  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [when, setWhen] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const createOrder = useServerFn(createRedPillOrder);
  const verify = useServerFn(verifyPayment);

  async function payRedPill() {
    setPaying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { orderId, amount, currency, keyId } = await createOrder();
      await openRazorpay({
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: "Blueprint by Arjun IFVG",
        description: "Red Pill — One-time mentorship",
        prefill: { email: user?.email ?? undefined },
        theme: { color: "#0a0f1f" },
        handler: async (resp) => {
          try {
            await verify({ data: resp });
            setApp((a) => (a ? { ...a, status: "paid" } : a));
            toast.success("Payment received. Welcome to the Red Pill.");
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

  useEffect(() => {
    supabase.from("red_pill_applications")
      .select("id,status,call_scheduled_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { setApp(data as App | null); setLoading(false); });
  }, []);

  async function bookCall(e: React.FormEvent) {
    e.preventDefault();
    if (!when) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate({ to: "/auth" }); return; }
    const { data, error } = await supabase.from("red_pill_applications").insert({
      user_id: user.id,
      status: "call_scheduled",
      call_scheduled_at: new Date(when).toISOString(),
    }).select("id,status,call_scheduled_at").single();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setApp(data as App);
    toast.success("Call requested. You'll get a confirmation email shortly.");
  }

  const steps = [
    { key: "book", label: "Book discovery call", icon: CalendarClock, done: !!app },
    { key: "meet", label: "Attend the call", icon: Clock, done: app?.status === "call_completed" || app?.status === "approved" || app?.status === "paid" },
    { key: "approve", label: "Admin approval", icon: Mail, done: app?.status === "approved" || app?.status === "paid" },
    { key: "pay", label: "Pay ₹4,999", icon: CreditCard, done: app?.status === "paid" },
    { key: "discord", label: "Claim Discord role", icon: CheckCircle2, done: app?.status === "paid" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="font-display text-lg font-semibold">blueprint<span className="text-primary">.</span></Link>
        <Link to="/choose" className="text-xs text-muted-foreground hover:text-foreground">← change pill</Link>
      </header>

      <main className="relative mx-auto max-w-4xl px-6 pb-20">
        <p className="label-mono text-red-pill">The Red Pill</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Full mentorship. <span className="text-gradient-red">Earn it.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          The Red Pill starts with a 1-on-1 discovery call. After we talk and you're approved,
          you complete the ₹4,999 one-time payment and unlock direct mentorship + the Red Pill Discord role.
        </p>

        {/* Progress */}
        <ol className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.key} className={`rounded-xl border p-4 ${s.done ? "border-red-pill/50 bg-red-pill/5" : "border-border bg-card"}`}>
              <div className="flex items-center gap-2">
                <s.icon className={`size-4 ${s.done ? "text-red-pill" : "text-muted-foreground"}`} />
                <span className="label-mono text-muted-foreground">Step 0{i + 1}</span>
              </div>
              <p className={`mt-2 text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
            </li>
          ))}
        </ol>

        {/* Stage content */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-8">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your application…</p>
          ) : !app ? (
            <form onSubmit={bookCall} className="space-y-4">
              <h2 className="text-xl font-semibold">Book your discovery call</h2>
              <p className="text-sm text-muted-foreground">
                Pick a time that works for you. It'll sync to my Google Calendar and you'll get a confirmation email.
              </p>
              <div className="max-w-sm">
                <Label htmlFor="when">Preferred date & time</Label>
                <Input id="when" type="datetime-local" required value={when}
                  onChange={(e) => setWhen(e.target.value)} className="mt-1.5 bg-input border-border" />
              </div>
              <Button type="submit" disabled={submitting} className="bg-red-pill text-red-pill-foreground hover:bg-red-pill/90 glow-red">
                {submitting ? "Booking…" : "Request call"}
              </Button>
            </form>
          ) : app.status === "call_scheduled" || app.status === "pending_call" ? (
            <div>
              <h2 className="text-xl font-semibold">Call scheduled</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {app.call_scheduled_at && new Date(app.call_scheduled_at).toLocaleString()}
              </p>
              <p className="mt-4 text-sm">A confirmation email is on its way. After we meet, the admin will mark the call complete and review your application.</p>
            </div>
          ) : app.status === "call_completed" ? (
            <div>
              <h2 className="text-xl font-semibold">Awaiting approval</h2>
              <p className="mt-2 text-sm text-muted-foreground">Your call is done. You'll get a "You're In" email as soon as the admin approves you.</p>
            </div>
          ) : app.status === "approved" ? (
            <div>
              <h2 className="text-xl font-semibold">You're in. Complete payment.</h2>
              <p className="mt-2 text-sm text-muted-foreground">One-time payment of ₹4,999. After payment you'll unlock the Red Pill Discord role.</p>
              <Button onClick={payRedPill} disabled={paying} className="mt-6 bg-red-pill text-red-pill-foreground hover:bg-red-pill/90 glow-red">
                {paying ? "Opening checkout…" : "Pay ₹4,999"}
              </Button>
            </div>
          ) : app.status === "paid" ? (
            <div>
              <h2 className="text-xl font-semibold">Welcome to the Red Pill.</h2>
              <p className="mt-2 text-sm text-muted-foreground">Claim your Discord role to unlock private mentorship channels.</p>
              <Button disabled className="mt-6 bg-red-pill text-red-pill-foreground hover:bg-red-pill/90 glow-red">
                Claim Red Pill role (Discord wires up next)
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Your application wasn't approved this round. Reach out if you'd like to discuss.</p>
          )}
        </div>
      </main>
    </div>
  );
}