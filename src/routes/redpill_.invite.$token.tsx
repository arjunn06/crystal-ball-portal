import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { LogoIcon } from "@/components/logo-icon";
import { getRedPillInvite } from "@/lib/redpill-invite.functions";
import { setRedPillInvite } from "@/lib/intent";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redpill_/invite/$token")({
  head: () => ({
    meta: [
      { title: "Your Red Pill invite — Blueprint" },
      {
        name: "description",
        content:
          "Your priority slot in The Red Pill is reserved. Complete payment to confirm your seat and claim your premium Discord role.",
      },
      { property: "og:title", content: "Your Red Pill invite — Blueprint" },
      {
        property: "og:description",
        content: "Complete payment to confirm your Red Pill seat and claim Discord access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvitePage,
});

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };
const archivo = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };

const PERKS = [
  "Full course completed in week one, live on Zoom",
  "Rest of the month we trade the market together",
  "My own executions broken down every day",
  "Premium Discord role for the whole program",
];

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const lookup = useServerFn(getRedPillInvite);
  const { data, isLoading } = useQuery({
    queryKey: ["redpill-invite", token],
    queryFn: () => lookup({ data: { token } }),
  });

  useEffect(() => {
    if (data?.status === "valid") setRedPillInvite(token);
  }, [data?.status, token]);

  async function continueToPayment() {
    setRedPillInvite(token);
    const { data: session } = await supabase.auth.getSession();
    navigate({ to: session.session ? "/enroll" : "/auth" });
  }

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
            "radial-gradient(1200px 500px at 50% -100px, #FFC6BC 0%, #FADEDA 35%, rgba(245,238,227,0) 75%)",
        }}
      />

      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 h-20 flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon className="text-black size-10" />
        </Link>
      </header>

      <main className="relative z-10 flex-1 grid place-items-center px-6 pb-20">
        <div className="w-full max-w-xl">
          {isLoading && (
            <div className="flex items-center gap-2 text-[14px] text-[#6B6B72]">
              <Loader2 className="size-4 animate-spin" /> Checking your invite…
            </div>
          )}

          {!isLoading && data?.status !== "valid" && (
            <div className="rounded-[24px] border border-black/5 bg-white p-9 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)]">
              <h1 style={clash} className="text-[30px] font-bold leading-tight">
                {data?.status === "used"
                  ? "This invite has already been used."
                  : data?.status === "expired"
                    ? "This invite has expired."
                    : "This invite link isn't valid."}
              </h1>
              <p className="mt-4 text-[15px] text-[#5A5A62]">
                {data?.status === "used"
                  ? "Your seat is already confirmed — sign in to claim your Discord role."
                  : "Reach out to us and we'll issue a fresh link for your priority slot."}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  className="inline-flex items-center h-12 px-6 rounded-full text-white text-[14px] font-semibold"
                  style={{ background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)" }}
                >
                  Sign in
                </Link>
                <Link
                  to="/redpill"
                  className="inline-flex items-center h-12 px-6 rounded-full bg-[#F7F1E8] border border-black/5 text-[14px] font-semibold"
                >
                  Back to Red Pill
                </Link>
              </div>
            </div>
          )}

          {!isLoading && data?.status === "valid" && (
            <>
              <span
                className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-white text-[11px] font-bold tracking-[0.16em] uppercase"
                style={{ background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)" }}
              >
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
                WAITLIST · PRIORITY SLOT
              </span>
              <h1
                style={{ ...clash, letterSpacing: "-0.005em" }}
                className="mt-6 text-[40px] md:text-[50px] font-bold leading-[1.05]"
              >
                Your seat is reserved.
              </h1>
              <p className="mt-5 text-[16px] leading-[1.55] text-[#4A4A52]">
                This link is reserved for <strong>{data.email}</strong>. Sign in with that email,
                complete the one-time payment and your premium Discord role is unlocked
                immediately after.
              </p>

              <div className="mt-9 rounded-[24px] border border-black/5 bg-white p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)]">
                <div className="inline-flex items-center h-7 px-3 rounded-full bg-[#0B0B10]/5 text-[11px] font-semibold tracking-[0.16em] uppercase">
                  RED PILL · ONE-TIME
                </div>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span style={clash} className="text-[44px] font-bold leading-none">
                    ₹2,999
                  </span>
                  <span className="text-[14px] text-[#6B6B72]">one month, live</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {PERKS.map((p) => (
                    <li key={p} className="flex gap-3 text-[14.5px] text-[#3A3A42]">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#E53935]/10 text-[#E53935]">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={continueToPayment}
                  className="mt-8 inline-flex w-full items-center justify-center h-14 rounded-full text-white text-[15px] font-semibold shadow-[0_16px_40px_-14px_rgba(229,57,53,0.8)] hover:brightness-105 transition"
                  style={{ background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)" }}
                >
                  Complete payment · ₹2,999
                </button>
                <p className="mt-3 text-center text-[11.5px] text-[#6B6B72]">
                  Single-use link · expires{" "}
                  {new Date(data.expires_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
