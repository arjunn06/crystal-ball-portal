import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import {
  createRedPillOrder,
  verifyRedPillPayment,
  reconcileRedPillOrder,
} from "@/lib/redpill-billing.functions";
import { getAccountOverview } from "@/lib/account.functions";
import { openRazorpay } from "@/lib/razorpay-checkout";
import { sendTransactionalEmail } from "@/lib/email/send";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, LogOut } from "lucide-react";
import { LogoIcon } from "@/components/logo-icon";
import { supabase } from "@/integrations/supabase/client";

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };
const archivo = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };

export const Route = createFileRoute("/_authenticated/enroll")({
  head: () => ({
    meta: [
      { title: "Enroll · The Red Pill — Blueprint" },
      {
        name: "description",
        content:
          "Enroll in The Red Pill: one month of live IFVG training on Zoom for ₹2,999, premium Discord included.",
      },
      { property: "og:title", content: "Enroll · The Red Pill — Blueprint" },
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

  const { data, refetch } = useQuery({
    queryKey: ["account", "overview"],
    queryFn: () => acct(),
  });

  useEffect(() => {
    // Blue Pill members may still enroll — only bounce out once Red Pill is active.
    if (data?.isSubscribed && data.pill === "red") {
      try {
        localStorage.removeItem("bp_intent");
      } catch {
        /* ignore */
      }
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
    mutationFn: () => create({}),
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
          theme: { color: "#E53935" },
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
                },
              });
              toast.success("You're in. Welcome to The Red Pill.");
              await sendWelcomeEmail(resp.razorpay_order_id!);
              try {
                localStorage.removeItem("bp_intent");
              } catch {
                /* ignore */
              }
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
    <div
      style={{ ...archivo, backgroundColor: "#F5EEE3", color: "#0B0B10" }}
      className="min-h-screen relative overflow-hidden flex flex-col"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            "radial-gradient(1200px 500px at 50% -100px, #FFCCC4 0%, #FADEDA 35%, rgba(245,238,227,0) 75%)",
        }}
      />

      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon className="text-black size-10" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#6B6B72] truncate max-w-[180px] hidden sm:inline">
            {data?.profile?.email}
          </span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#6B6B72] hover:text-[#0B0B10] transition-colors"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 grid place-items-center px-6 pt-4 pb-20">
        <div className="w-full max-w-xl">
          <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-[#0B0B10] text-white/90 text-[11px] font-semibold tracking-[0.16em] uppercase">
            <span className="size-1.5 rounded-full bg-[#FF2A1F]" />
            ONE STEP TO GO
            <span className="size-1.5 rounded-full bg-[#FF2A1F]" />
          </div>
          <h1
            style={{ ...clash, letterSpacing: "-0.005em" }}
            className="mt-5 text-[40px] md:text-[52px] font-bold leading-[1.05] text-[#0B0B10]"
          >
            Confirm your seat in
            <br />
            <span className="inline-flex items-center gap-3 flex-wrap">
              the
              <span
                className="inline-flex items-center h-11 md:h-12 px-4 rounded-full text-white text-[15px] md:text-[17px] font-semibold shadow-[0_10px_30px_-10px_rgba(229,57,53,0.7)]"
                style={{
                  background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)",
                  ...clash,
                }}
              >
                Red Pill
              </span>
            </span>
          </h1>
          <p className="mt-5 text-[16px] leading-[1.55] text-[#4A4A52] max-w-md">
            One month, live on Zoom with me. Course finished in week one, then we
            trade the market together for the rest of the month.
          </p>

          <div className="relative mt-10 overflow-hidden rounded-[24px] border border-black/5 bg-white p-7 md:p-9 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)]">
            <div
              aria-hidden
              className="absolute -top-20 -right-20 size-72 rounded-full opacity-40"
              style={{ background: "radial-gradient(closest-side,#FFCCC4,transparent)" }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-[#0B0B10]/5 text-[#0B0B10] text-[11px] font-semibold tracking-[0.16em] uppercase">
                RED PILL · ONE-TIME
              </div>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span style={clash} className="text-[52px] font-bold leading-none">
                  ₹2,999
                </span>
                <span className="text-[15px] text-[#6B6B72]">one-time</span>
              </div>
              <p className="mt-1.5 text-[12.5px] text-[#6B6B72]">
                Single payment, securely via Razorpay · no recurring charge
              </p>

              <ul className="mt-6 grid grid-cols-1 gap-2.5">
                {PERKS.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 rounded-2xl bg-[#F7F1E8] border border-black/5 px-4 py-3"
                  >
                    <span className="mt-0.5 size-5 rounded-full bg-white border border-black/5 grid place-items-center shrink-0">
                      <Check className="size-3 text-[#E53935]" strokeWidth={3} />
                    </span>
                    <span className="text-[14px] text-[#1A1A1F] font-medium">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                disabled
                className="mt-7 w-full h-13 py-4 rounded-full bg-[#0B0B10]/10 text-[#0B0B10] text-[15px] font-semibold border-0 disabled:opacity-100"
              >
                Slots full · Registrations closed
              </Button>

              <p className="mt-3 text-[11px] text-center text-[#6B6B72]">
                This cohort is fully booked.{" "}
                <Link to="/subscribe" className="underline">
                  Start with the Blue Pill at ₹499/mo
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 border-t border-black/5">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between text-[12px] text-[#6B6B72]">
          <span>© Blueprint · by Arjun IFVG</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
