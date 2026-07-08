import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createSubscription, verifySubscriptionPayment } from "@/lib/billing.functions";
import { getAccountOverview } from "@/lib/account.functions";
import { useEffect } from "react";
import { openRazorpay } from "@/lib/razorpay-checkout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/subscribe")({
  head: () => ({ meta: [{ title: "Subscribe — Blueprint" }] }),
  component: Subscribe,
});

function Subscribe() {
  const navigate = useNavigate();
  const acct = useServerFn(getAccountOverview);
  const create = useServerFn(createSubscription);
  const verify = useServerFn(verifySubscriptionPayment);
  const { data } = useQuery({ queryKey: ["account", "overview"], queryFn: () => acct() });

  useEffect(() => {
    if (data?.isSubscribed) navigate({ to: "/app" });
  }, [data?.isSubscribed, navigate]);

  const mut = useMutation({
    mutationFn: () => create(),
    onError: (e: any) => toast.error(e.message),
    onSuccess: async ({ subscriptionId, keyId }) => {
      try {
        await openRazorpay({
          key: keyId,
          subscription_id: subscriptionId,
          name: "Blueprint · Blue Pill",
          description: "Monthly membership",
          theme: { color: "#A46BE0" },
          prefill: {
            email: data?.profile?.email ?? undefined,
            name: data?.profile?.full_name ?? undefined,
          },
          handler: async (resp) => {
            try {
              await verify({
                data: {
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_subscription_id: resp.razorpay_subscription_id!,
                  razorpay_signature: resp.razorpay_signature,
                },
              });
              toast.success("You're in.");
              navigate({ to: "/app" });
            } catch (e: any) {
              toast.error(e.message ?? "Payment verification failed");
            }
          },
        });
      } catch (e: any) {
        toast.error(e.message ?? "Could not open checkout");
      }
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center">
              <div className="size-2 rounded-full bg-primary" />
            </div>
            <span className="font-semibold tracking-tight">Blueprint</span>
          </Link>
          <span className="text-xs text-muted-foreground truncate">{data?.profile?.email}</span>
        </div>
      </header>

      <div className="flex-1 grid place-items-center px-6 py-14">
        <div className="w-full max-w-md">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            One step to go
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Activate your membership</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your Blue Pill subscription to unlock the full library, live calls, and the members-only Discord.
          </p>

          <div className="mt-8 rounded-2xl border border-border/70 bg-surface p-6">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">Blue Pill · Monthly</p>
              <p className="text-2xl font-semibold tracking-tight">
                ₹499<span className="text-sm text-muted-foreground font-normal">/mo</span>
              </p>
            </div>
            <ul className="mt-5 space-y-2">
              {[
                "Every recorded session",
                "Live NY session calls",
                "Members-only Discord role",
                "Cancel anytime",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="mt-6 w-full h-11 rounded-lg"
            >
              {mut.isPending ? "Opening checkout…" : "Subscribe · ₹499/mo"}
            </Button>
            <p className="mt-3 text-[11px] text-center text-muted-foreground">
              Secure checkout by Razorpay. You can cancel anytime from Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}