import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createSubscription,
  verifySubscriptionPayment,
  reconcileSubscription,
} from "@/lib/billing.functions";
import { validatePromoCode } from "@/lib/promos.functions";
import { getAccountOverview } from "@/lib/account.functions";
import { useEffect, useState } from "react";
import { openRazorpay } from "@/lib/razorpay-checkout";
import { BLUE_PILL_BASE_PAISE, BLUE_PILL_TOTAL_PAISE, gstOn, formatRupees } from "@/lib/pricing";
import { toast } from "sonner";
import { Check, ArrowRight, Tag, X as XIcon, CircleNotch } from "@phosphor-icons/react";
import { CheckoutShell } from "@/components/site/checkout-shell";
import { btnPrimary } from "@/components/site/ui";
import { getIntent } from "@/lib/intent";

export const Route = createFileRoute("/_authenticated/subscribe")({
  head: () => ({ meta: [{ title: "Subscribe | Blueprint" }] }),
  component: Subscribe,
});

function Subscribe() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const acct = useServerFn(getAccountOverview);
  const create = useServerFn(createSubscription);
  const verify = useServerFn(verifySubscriptionPayment);
  const reconcile = useServerFn(reconcileSubscription);
  const validate = useServerFn(validatePromoCode);
  const { data, refetch } = useQuery({
    queryKey: ["account", "overview"],
    queryFn: () => acct(),
  });

  // Poll reconcile until Razorpay reports active (or we give up). Handles
  // "user paid but the client handler never ran" and webhook races.
  async function pollReconcile(maxMs = 30_000) {
    const started = Date.now();
    let delay = 1500;
    while (Date.now() - started < maxMs) {
      try {
        const r = await reconcile();
        if (r.status === "active") {
          await qc.invalidateQueries({ queryKey: ["account", "overview"] });
          return true;
        }
      } catch {
        /* keep polling */
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay + 500, 4000);
    }
    await refetch();
    return false;
  }
  const [codeInput, setCodeInput] = useState("");
  const [applied, setApplied] = useState<{
    code: string;
    discount_type: "percent_off_first" | "amount_off_first" | "trial_days";
    discount_value: number;
    description: string | null;
  } | null>(null);

  const apply = useMutation({
    mutationFn: () => validate({ data: { code: codeInput.trim() } }),
    onError: (e: any) => toast.error(e.message ?? "Invalid code"),
    onSuccess: (p) => {
      setApplied({
        code: p.code,
        discount_type: p.discount_type,
        discount_value: p.discount_value,
        description: p.description,
      });
      toast.success(`Code ${p.code} applied`);
    },
  });

  useEffect(() => {
    if (data?.isSubscribed) navigate({ to: "/app" });
  }, [data?.isSubscribed, navigate]);

  // Red Pill registrations are closed — clear any legacy intent so it can't
  // bounce a Blue Pill subscriber to the closed enrollment page.
  useEffect(() => {
    getIntent();
  }, []);

  // On mount, if there's a pending subscription row, sync with Razorpay in
  // case a previous checkout succeeded but never wrote back locally.
  useEffect(() => {
    if (data?.subscription?.razorpay_subscription_id && data.subscription.status !== "active") {
      reconcile()
        .then((r) => {
          if (r.changed) qc.invalidateQueries({ queryKey: ["account", "overview"] });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.subscription?.razorpay_subscription_id]);

  const mut = useMutation({
    mutationFn: () => create({ data: { promo_code: applied?.code ?? null } }),
    onError: (e: any) => toast.error(e.message),
    onSuccess: async ({ subscriptionId, keyId, trialEndsAt }) => {
      if (trialEndsAt) {
        toast.success(
          `Trial started. First charge on ${new Date(trialEndsAt).toLocaleDateString()}`,
        );
        navigate({ to: "/app" });
        return;
      }
      try {
        await openRazorpay({
          key: keyId,
          subscription_id: subscriptionId,
          name: "Blueprint · Blue Pill",
          description: "Monthly membership",
          theme: { color: "#3F7BEA" },
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
              await qc.invalidateQueries({ queryKey: ["account", "overview"] });
              navigate({ to: "/app" });
            } catch (e: any) {
              // Fall back to server-side reconciliation — the webhook or a
              // Razorpay poll will confirm the charge.
              toast.message("Confirming your payment…");
              const ok = await pollReconcile();
              if (ok) {
                toast.success("You're in.");
                navigate({ to: "/app" });
              } else {
                toast.error(e.message ?? "Payment verification failed");
              }
            }
          },
          modal: {
            ondismiss: () => {
              // User closed checkout — if a charge did land, sync it.
              pollReconcile(15_000).then((ok) => {
                if (ok) navigate({ to: "/app" });
              });
            },
          },
        });
      } catch (e: any) {
        toast.error(e.message ?? "Could not open checkout");
      }
    },
  });

  return (
    <CheckoutShell
      tone="blue"
      email={data?.profile?.email ?? ""}
      intro={
        <>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
            Activate your Blue Pill membership.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            Start your subscription to unlock every recorded session, live NY calls and the
            members-only Discord.
          </p>
        </>
      }
    >
      <h2 className="text-sm font-medium text-muted-foreground">The Blue Pill, monthly</h2>
      <p className="mt-2 font-display tabular text-6xl font-extrabold leading-none tracking-[-0.04em]">
        {formatRupees(BLUE_PILL_BASE_PAISE)}
        <span className="ml-2 font-sans text-base font-normal tracking-normal text-muted-foreground">
          /month
        </span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        + {formatRupees(gstOn(BLUE_PILL_BASE_PAISE))} GST (18%) ={" "}
        <span className="font-semibold text-foreground">{formatRupees(BLUE_PILL_TOTAL_PAISE)}</span>{" "}
        per month. Billed monthly through Razorpay.
      </p>

      <ul className="mt-7 space-y-3">
        {[
          "Every recorded session, uncut",
          "Live NY session calls",
          "Members-only Discord role",
          "Cancel anytime, no lock-in",
        ].map((f) => (
          <li key={f} className="flex items-start gap-3 text-[15px] leading-snug">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" weight="bold" />
            {f}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => mut.mutate()}
        disabled={mut.isPending}
        className={`${btnPrimary} mt-8 w-full`}
      >
        {mut.isPending ? (
          "Opening checkout"
        ) : (
          <>
            {applied?.discount_type === "trial_days"
              ? `Start ${applied.discount_value}-day free trial`
              : applied?.discount_type === "percent_off_first"
                ? `Subscribe, ${applied.discount_value}% off first month`
                : applied?.discount_type === "amount_off_first"
                  ? `Subscribe, ₹${applied.discount_value} off first month`
                  : `Subscribe for ${formatRupees(BLUE_PILL_TOTAL_PAISE)}/month`}
            <ArrowRight className="size-4" weight="bold" />
          </>
        )}
      </button>

      {/* Promo code */}
      <div className="mt-4">
        {applied ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="size-4 text-primary" weight="bold" />
              <span className="font-semibold">{applied.code}</span>
              <span className="text-muted-foreground">
                {applied.discount_type === "trial_days"
                  ? `${applied.discount_value} free trial days`
                  : applied.discount_type === "percent_off_first"
                    ? `${applied.discount_value}% off first month`
                    : `₹${applied.discount_value} off first month`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setApplied(null);
                setCodeInput("");
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Remove code"
            >
              <XIcon className="size-4" weight="bold" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && codeInput.trim()) {
                    e.preventDefault();
                    apply.mutate();
                  }
                }}
                placeholder="Promo code"
                aria-label="Promo code"
                className="h-10 w-full rounded-lg border border-border bg-input pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="button"
              onClick={() => codeInput.trim() && apply.mutate()}
              disabled={!codeInput.trim() || apply.isPending}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-hover disabled:opacity-50"
            >
              {apply.isPending ? (
                <CircleNotch className="size-4 animate-spin" weight="bold" />
              ) : (
                "Apply"
              )}
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Secure checkout by Razorpay. Cancel anytime from Settings.
      </p>
    </CheckoutShell>
  );
}
