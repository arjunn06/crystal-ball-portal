import { RED_PILL_BASE_PAISE, RED_PILL_TOTAL_PAISE, gstOn, formatRupees } from "@/lib/pricing";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "@phosphor-icons/react";
import { CheckoutShell } from "@/components/site/checkout-shell";
import { btnPrimary } from "@/components/site/ui";
import { setRedPillInvite } from "@/lib/intent";
import { SHARED_INVITE_TOKEN } from "@/lib/redpill-invite.shared";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redpill_/invite")({
  head: () => ({
    meta: [
      { title: "Your Red Pill invite | Blueprint" },
      {
        name: "description",
        content:
          "Your priority slot in The Red Pill is reserved. Complete payment to confirm your seat and claim your premium Discord role.",
      },
      { property: "og:title", content: "Your Red Pill invite | Blueprint" },
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

const PERKS = [
  "Full course completed in week one, live on Zoom",
  "Rest of the month we trade the market together",
  "My own executions broken down every day",
  "Premium Discord role for the whole program",
];

function InvitePage() {
  const navigate = useNavigate();

  async function continueToPayment() {
    setRedPillInvite(SHARED_INVITE_TOKEN);
    const { data: session } = await supabase.auth.getSession();
    navigate({ to: session.session ? "/enroll" : "/auth" });
  }

  return (
    <CheckoutShell
      tone="red"
      intro={
        <>
          <h1 className="font-display text-[clamp(2.4rem,5vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
            Your seat is reserved.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            Sign in with the email you joined the waitlist with, complete the one-time payment and
            your premium Discord role unlocks right after.
          </p>
        </>
      }
    >
      <h2 className="text-sm font-medium text-muted-foreground">Waitlist priority slot</h2>
      <p className="mt-2 font-display tabular text-6xl font-extrabold leading-none tracking-[-0.04em]">
        {formatRupees(RED_PILL_BASE_PAISE)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        + {formatRupees(gstOn(RED_PILL_BASE_PAISE))} GST (18%) ={" "}
        <span className="font-semibold text-foreground">{formatRupees(RED_PILL_TOTAL_PAISE)}</span>{" "}
        total
      </p>
      <p className="mt-2 text-sm text-muted-foreground">One month, live. One-time payment.</p>
      <ul className="mt-7 space-y-3">
        {PERKS.map((p) => (
          <li key={p} className="flex items-start gap-3 text-[15px] leading-snug">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" weight="bold" />
            {p}
          </li>
        ))}
      </ul>
      <button type="button" onClick={continueToPayment} className={`${btnPrimary} mt-8 w-full`}>
        Complete payment for {formatRupees(RED_PILL_TOTAL_PAISE)}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Limited seats. Closes once slots are filled.
      </p>
    </CheckoutShell>
  );
}
