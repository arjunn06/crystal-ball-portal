import { RED_PILL_BASE_PAISE, RED_PILL_TOTAL_PAISE, gstOn, formatRupees } from "@/lib/pricing";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  createRedPillOrder,
  verifyRedPillPayment,
  reconcileRedPillOrder,
} from "@/lib/redpill-billing.functions";
import { getAccountOverview } from "@/lib/account.functions";
import { openRazorpay } from "@/lib/razorpay-checkout";
import { sendTransactionalEmail } from "@/lib/email/send";
import { toast } from "sonner";
import { Check } from "@phosphor-icons/react";
import { CheckoutShell } from "@/components/site/checkout-shell";
import { btnPrimary } from "@/components/site/ui";
import { getRedPillInviteToken, clearRedPillInvite } from "@/lib/intent";

export const Route = createFileRoute("/_authenticated/enroll")({
  head: () => ({
    meta: [
      { title: "Enroll in The Red Pill | Blueprint" },
      {
        name: "description",
        content:
          "Enroll in The Red Pill: one month of live IFVG training on Zoom for ₹2,999, premium Discord included.",
      },
      { property: "og:title", content: "Enroll in The Red Pill | Blueprint" },
      {
        property: "og:description",
        content: "One month, live on Zoom. ₹2,999 one-time with premium Discord access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Enroll,
});

const PERKS = [
  "Full course completed in week one, live on Zoom",
  "Rest of the month we trade together, live",
  "My executions broken down in real time",
  "Premium Discord role for the full program",
  "Live Q&A any time during a session",
];

function Enroll() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const acct = useServerFn(getAccountOverview);
  const create = useServerFn(createRedPillOrder);
  const verify = useServerFn(verifyRedPillPayment);
  const reconcile = useServerFn(reconcileRedPillOrder);

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  useEffect(() => {
    setInviteToken(getRedPillInviteToken());
  }, []);

  const { data, refetch } = useQuery({
    queryKey: ["account", "overview"],
    queryFn: () => acct(),
  });

  useEffect(() => {
    // Blue Pill members may still enroll — only bounce out once Red Pill is active.
    if (data?.isSubscribed && data.pill === "red") {
      clearRedPillInvite();
      navigate({ to: "/app/discord" });
    }
  }, [data?.isSubscribed, data?.pill, navigate]);

  // If a previous checkout succeeded but never wrote back, sync it.
  useEffect(() => {
    if (data && !data.isSubscribed && data.subscription?.pill === "red") {
      reconcile()
        .then((r) => {
          if (r.changed) qc.invalidateQueries({ queryKey: ["account", "overview"] });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.subscription?.razorpay_subscription_id]);

  async function sendWelcomeEmail(orderId: string) {
    const email = data?.profile?.email;
    if (!email) return;
    try {
      await sendTransactionalEmail({
        templateName: "redpill-enrolled",
        recipientEmail: email,
        idempotencyKey: `redpill-enrolled-${orderId}`,
        templateData: {
          name: data?.profile?.full_name ?? undefined,
          claimUrl: `${window.location.origin}/app/discord`,
        },
      });
    } catch (e) {
      console.error("Failed to send enrolment email", e);
    }
  }

  async function pollReconcile(maxMs = 30_000) {
    const started = Date.now();
    let delay = 1500;
    while (Date.now() - started < maxMs) {
      try {
        const r = await reconcile();
        if (r.status === "active" && r.pill === "red") {
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

  const mut = useMutation({
    mutationFn: () => create({ data: { inviteToken: inviteToken ?? undefined } }),
    onError: (e: any) => toast.error(e.message ?? "Could not start checkout"),
    onSuccess: async ({ orderId, keyId, amount }) => {
      try {
        await openRazorpay({
          key: keyId,
          order_id: orderId,
          amount,
          currency: "INR",
          name: "Blueprint · Red Pill",
          description: "One month live mentorship",
          theme: { color: "#D9423C" },
          prefill: {
            email: data?.profile?.email ?? undefined,
            name: data?.profile?.full_name ?? undefined,
          },
          handler: async (resp) => {
            try {
              await verify({
                data: {
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_order_id: resp.razorpay_order_id!,
                  razorpay_signature: resp.razorpay_signature,
                  inviteToken: inviteToken ?? undefined,
                },
              });
              toast.success("You're in. Welcome to The Red Pill.");
              await sendWelcomeEmail(resp.razorpay_order_id!);
              clearRedPillInvite();
              await qc.invalidateQueries({ queryKey: ["account", "overview"] });
              navigate({ to: "/app/discord" });
            } catch (e: any) {
              toast.message("Confirming your payment…");
              const ok = await pollReconcile();
              if (ok) {
                toast.success("You're in.");
                await sendWelcomeEmail(resp.razorpay_order_id!);
                navigate({ to: "/app/discord" });
              } else {
                toast.error(e.message ?? "Payment verification failed");
              }
            }
          },
          modal: {
            ondismiss: () => {
              pollReconcile(15_000).then(async (ok) => {
                if (ok) {
                  await sendWelcomeEmail(orderId);
                  navigate({ to: "/app/discord" });
                }
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
      tone="red"
      email={data?.profile?.email ?? ""}
      intro={
        <>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
            Confirm your seat in the Red Pill.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            One month, live on Zoom with Arjun. The course is finished in week one, then we trade
            the market together for the rest of the month.
          </p>
        </>
      }
    >
      <h2 className="text-sm font-medium text-muted-foreground">The Red Pill, one-time payment</h2>
      <p className="mt-2 font-display tabular text-6xl font-extrabold leading-none tracking-[-0.04em]">
        {formatRupees(RED_PILL_BASE_PAISE)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        + {formatRupees(gstOn(RED_PILL_BASE_PAISE))} GST (18%) ={" "}
        <span className="font-semibold text-foreground">{formatRupees(RED_PILL_TOTAL_PAISE)}</span> total
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Single payment through Razorpay. No recurring charge.
      </p>

      <ul className="mt-7 space-y-3">
        {PERKS.map((f) => (
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
        {mut.isPending ? "Opening checkout" : `Complete payment for ${formatRupees(RED_PILL_TOTAL_PAISE)}`}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {inviteToken ? "Priority slot from the waitlist. " : ""}Secure payment through Razorpay.
      </p>
    </CheckoutShell>
  );
}
