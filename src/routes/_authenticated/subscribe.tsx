import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createSubscription, verifySubscriptionPayment } from "@/lib/billing.functions";
import { getAccountOverview } from "@/lib/account.functions";
import { useEffect } from "react";
import { openRazorpay } from "@/lib/razorpay-checkout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { LogoIcon } from "@/components/logo-icon";

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };
const archivo = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };

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
    <div
      style={{ ...archivo, backgroundColor: "#F5EEE3", color: "#0B0B10" }}
      className="min-h-screen relative overflow-hidden flex flex-col"
    >
      {/* warm gradient wash — matches landing page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            "radial-gradient(1200px 500px at 50% -100px, #FFD7B8 0%, #FBE6D0 35%, rgba(245,238,227,0) 75%)",
        }}
      />

      {/* NAV */}
      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon className="text-black size-10" />
        </Link>
        <span className="text-[12px] text-[#6B6B72] truncate max-w-[50%]">
          {data?.profile?.email}
        </span>
      </header>

      <div className="relative z-10 flex-1 grid place-items-center px-6 pt-4 pb-20">
        <div className="w-full max-w-xl">
          <div className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-[#0B0B10] text-white/90 text-[11px] font-semibold tracking-[0.16em] uppercase">
            <span className="size-1.5 rounded-full bg-[#FF6B35]" />
            ONE STEP TO GO
            <span className="size-1.5 rounded-full bg-[#FF6B35]" />
          </div>
          <h1
            style={{ ...clash, letterSpacing: "-0.005em" }}
            className="mt-5 text-[40px] md:text-[52px] font-bold leading-[1.05] text-[#0B0B10]"
          >
            Activate your
            <br />
            <span className="inline-flex items-center gap-3 flex-wrap">
              membership
              <span
                className="inline-flex items-center h-11 md:h-12 px-4 rounded-full text-white text-[15px] md:text-[17px] font-semibold shadow-[0_10px_30px_-10px_rgba(229,57,53,0.7)]"
                style={{
                  background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)",
                  ...clash,
                }}
              >
                Blue Pill
              </span>
            </span>
          </h1>
          <p className="mt-5 text-[16px] leading-[1.55] text-[#4A4A52] max-w-md">
            Start your Blue Pill subscription to unlock every recorded session,
            live NY calls, and the members-only Discord.
          </p>

          <div
            className="relative mt-10 overflow-hidden rounded-[24px] border border-black/5 bg-white p-7 md:p-9 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)]"
          >
            <div
              aria-hidden
              className="absolute -top-20 -right-20 size-72 rounded-full opacity-40"
              style={{ background: "radial-gradient(closest-side,#FFD7B8,transparent)" }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-[#0B0B10]/5 text-[#0B0B10] text-[11px] font-semibold tracking-[0.16em] uppercase">
                BLUE PILL · MONTHLY
              </div>
              <div className="mt-5 flex items-baseline gap-1">
                <span style={clash} className="text-[52px] font-bold leading-none">
                  ₹499
                </span>
                <span className="text-[15px] text-[#6B6B72]">/month</span>
              </div>
              <p className="mt-1.5 text-[12.5px] text-[#6B6B72]">
                Billed monthly, securely via Razorpay
              </p>

              <ul className="mt-6 grid grid-cols-1 gap-2.5">
                {[
                  "Every recorded session, uncut",
                  "Live NY session calls",
                  "Members-only Discord role",
                  "Cancel anytime, no lock-in",
                ].map((f) => (
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
                onClick={() => mut.mutate()}
                disabled={mut.isPending}
                className="mt-7 w-full h-13 py-4 rounded-full text-white text-[15px] font-semibold shadow-[0_12px_30px_-10px_rgba(229,57,53,0.65)] hover:-translate-y-px transition-transform border-0"
                style={{ background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)" }}
              >
                {mut.isPending ? (
                  "Opening checkout…"
                ) : (
                  <>
                    Subscribe · ₹499/mo
                    <ArrowRight className="size-4 ml-1" />
                  </>
                )}
              </Button>
              <p className="mt-3 text-[11px] text-center text-[#6B6B72]">
                Secure checkout by Razorpay. Cancel anytime from Settings.
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