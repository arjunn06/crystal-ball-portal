import { createFileRoute } from "@tanstack/react-router";

/**
 * Entitlement sweep (cron, hourly).
 *
 * 1. Reconciles every non-terminal subscription against Razorpay so a failed
 *    renewal or a cancellation we never received flips locally too.
 * 2. Expires rows whose paid-through date has passed.
 * 3. Removes Discord roles from anyone who no longer has access.
 *
 * Authenticated with the service role key (same scheme as the email queue).
 */
export const Route = createFileRoute("/api/public/cron/subscription-sweep")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
        const auth = request.headers.get("authorization") ?? "";
        if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { isEntitled } = await import("@/lib/membership.server");
        const keyId = process.env['RAZORPAY_KEY_ID'];
        const secret = process.env['RAZORPAY_KEY_SECRET'];
        const rzpAuth =
          keyId && secret
            ? "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64")
            : null;

        const result = { reconciled: 0, expired: 0, rolesRevoked: 0, errors: [] as string[] };

        const { data: subs } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id, status, pill, current_period_end, razorpay_subscription_id");

        for (const sub of subs ?? []) {
          try {
            let status: string = sub.status;
            let periodEnd: string | null = sub.current_period_end;

            const { paidThroughFromRemote, latestPeriodEnd } = await import(
              "@/lib/razorpay.server"
            );

            // 1. Reconcile recurring (Blue Pill) subscriptions with Razorpay.
            if (
              rzpAuth &&
              sub.razorpay_subscription_id?.startsWith("sub_") &&
              status !== "expired"
            ) {
              const res = await fetch(
                `https://api.razorpay.com/v1/subscriptions/${sub.razorpay_subscription_id}`,
                { headers: { Authorization: rzpAuth } },
              );
              if (res.ok) {
                const remote = (await res.json()) as {
                  status?: string;
                  current_end?: number;
                  charge_at?: number;
                  end_at?: number;
                };
                const remoteStatus = remote.status ?? "";
                const active = ["active", "authenticated", "charged", "resumed"].includes(
                  remoteStatus,
                );
                const dead = ["cancelled", "completed", "halted", "paused", "expired"].includes(
                  remoteStatus,
                );
                // Never shorten a paid-through date — cancelling autopay keeps
                // access until the end of the period already paid for.
                const newEnd = latestPeriodEnd(periodEnd, paidThroughFromRemote(remote));
                const patch: {
                  status?: string;
                  cancelled_at?: string;
                  current_period_end?: string;
                } = {};
                if (dead && status !== "cancelled") {
                  patch.status = "cancelled";
                  patch.cancelled_at = new Date().toISOString();
                } else if (active && status !== "active") {
                  patch.status = "active";
                }
                if (newEnd && newEnd !== periodEnd) patch.current_period_end = newEnd;
                if (Object.keys(patch).length) {
                  await supabaseAdmin
                    .from("subscriptions")
                    .update(patch)
                    .eq("user_id", sub.user_id);
                  status = patch.status ?? status;
                  periodEnd = patch.current_period_end ?? periodEnd;
                  result.reconciled += 1;
                }
              }
            }

            // 2. Expire rows whose access window has closed.
            if (
              (status === "active" || status === "cancelled") &&
              (!periodEnd || new Date(periodEnd) <= new Date())
            ) {
              await supabaseAdmin
                .from("subscriptions")
                .update({ status: "expired" })
                .eq("user_id", sub.user_id);
              status = "expired";
              result.expired += 1;
            }


            // 3. Strip Discord roles when access is gone.
            if (!isEntitled({ status, current_period_end: periodEnd })) {
              const { data: claims } = await supabaseAdmin
                .from("discord_role_claims")
                .select("id, discord_user_id")
                .eq("user_id", sub.user_id)
                .eq("status", "assigned");
              if (claims?.length) {
                const { revokeDiscordRoles } = await import("@/lib/discord-roles.server");
                for (const claim of claims) {
                  await revokeDiscordRoles(claim.discord_user_id);
                  await supabaseAdmin
                    .from("discord_role_claims")
                    .update({
                      status: "revoked",
                      actioned_at: new Date().toISOString(),
                      error_message: "Access lapsed — roles removed automatically",
                    })
                    .eq("id", claim.id);
                  result.rolesRevoked += 1;
                }
              }
            }
          } catch (err) {
            result.errors.push(
              `${sub.user_id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        console.log("subscription-sweep", result);
        return Response.json(result);
      },
    },
  },
});
