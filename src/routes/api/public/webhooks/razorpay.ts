import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Razorpay webhook — subscription lifecycle. Source of truth for a member's
 * paid/cancelled state. Uses upsert-on-miss (via `notes.user_id`) so an event
 * that arrives before `createSubscription` finishes writing the row is not
 * silently dropped.
 */
export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        type SubEntity = {
          id?: string;
          current_end?: number;
          charge_at?: number;
          notes?: Record<string, unknown> | null;
        };
        type PaymentEntity = {
          id?: string;
          subscription_id?: string;
          order_id?: string;
          amount?: number;
          notes?: Record<string, unknown> | null;
        };
        type OrderEntity = {
          id?: string;
          status?: string;
          notes?: Record<string, unknown> | null;
        };
        let payload: {
          event?: string;
          payload?: {
            subscription?: { entity?: SubEntity };
            payment?: { entity?: PaymentEntity };
            order?: { entity?: OrderEntity };
          };
        };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const event = payload.event ?? "";
        const s = payload.payload?.subscription?.entity;
        const p = payload.payload?.payment?.entity;
        const o = payload.payload?.order?.entity;

        // ── Red Pill: one-time order payments ───────────────────────────────
        const orderId = o?.id ?? p?.order_id;
        const orderNotes = o?.notes ?? p?.notes ?? null;
        const isRedPillOrder =
          !!orderId &&
          !p?.subscription_id &&
          (event === "order.paid" || event === "payment.captured") &&
          (!orderNotes || orderNotes.pill === "red" || typeof orderNotes.user_id === "string");
        if (isRedPillOrder) {
          try {
            const endsAt = new Date(Date.now() + 31 * 86400_000).toISOString();
            const patch = {
              status: "active",
              pill: "red" as const,
              current_period_end: endsAt,
            };
            const { data: updated, error: updErr } = await supabaseAdmin
              .from("subscriptions")
              .update(patch)
              .eq("razorpay_subscription_id", orderId!)
              .select("user_id");
            if (updErr) throw updErr;
            const noteUser =
              orderNotes && typeof orderNotes.user_id === "string" ? orderNotes.user_id : null;
            if ((updated?.length ?? 0) === 0 && noteUser) {
              await supabaseAdmin.from("subscriptions").upsert(
                { user_id: noteUser, razorpay_subscription_id: orderId!, ...patch },
                { onConflict: "user_id" },
              );
            }
          } catch (err) {
            console.error("Razorpay webhook (red pill order) error", event, err);
            return new Response("Handler error", { status: 500 });
          }
          return new Response("ok");
        }

        const subscriptionId = s?.id ?? p?.subscription_id;
        const userIdFromNotes =
          (s?.notes && typeof s.notes.user_id === "string" ? s.notes.user_id : null) ??
          (p?.notes && typeof p.notes.user_id === "string" ? p.notes.user_id : null);

        const activating =
          event === "subscription.activated" ||
          event === "subscription.charged" ||
          event === "subscription.resumed" ||
          event === "subscription.authenticated" ||
          (event === "payment.captured" && !!subscriptionId);
        const cancelling =
          event === "subscription.cancelled" ||
          event === "subscription.completed" ||
          event === "subscription.halted" ||
          event === "subscription.paused";

        const paymentDue =
          event === "subscription.pending" ||
          (event === "payment.failed" && !!subscriptionId);

        if (!subscriptionId || (!activating && !cancelling && !paymentDue)) {
          return new Response("ignored");
        }

        // Existing row (if any) — used for previous status and member details.
        const { data: existingRow } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id, status, pill, current_period_end")
          .eq("razorpay_subscription_id", subscriptionId)
          .maybeSingle();

        const notify = async (
          templateName: string,
          extra: Record<string, unknown> = {},
        ) => {
          try {
            const uid = existingRow?.user_id ?? userIdFromNotes;
            if (!uid) return;
            if (existingRow && existingRow.pill !== "blue") return;
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("email, full_name")
              .eq("id", uid)
              .maybeSingle();
            if (!profile?.email) return;
            const { sendTransactionalServer } = await import("@/lib/email/send.server");
            await sendTransactionalServer({
              templateName,
              recipientEmail: profile.email,
              idempotencyKey: `${templateName}-${subscriptionId}-${event}`,
              templateData: {
                name: profile.full_name?.split(" ")[0] ?? undefined,
                ...extra,
              },
            });
          } catch (err) {
            console.error("Blue Pill notification failed", templateName, err);
          }
        };

        const fmtDate = (iso?: string | null) =>
          iso
            ? new Date(iso).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : undefined;

        if (paymentDue) {
          await notify("bluepill-payment-due", {
            amount: p?.amount ? `₹${(p.amount / 100).toLocaleString("en-IN")}` : "₹499",
            dueDate: fmtDate(existingRow?.current_period_end) ?? "As soon as possible",
            billingUrl: "https://blueprint.ifvg.in/app/settings",
          });
          return new Response("ok");
        }

        try {
          let activatingPeriodEnd = s?.current_end ?? s?.charge_at;
          if (activating && !activatingPeriodEnd) {
            const keyId = process.env['RAZORPAY_KEY_ID'];
            const keySecret = process.env['RAZORPAY_KEY_SECRET'];
            if (keyId && keySecret) {
              const auth = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
              const remoteRes = await fetch(
                `https://api.razorpay.com/v1/subscriptions/${subscriptionId}`,
                { headers: { Authorization: auth } },
              );
              if (remoteRes.ok) {
                const remote = (await remoteRes.json()) as {
                  current_end?: number;
                  charge_at?: number;
                };
                activatingPeriodEnd = remote.current_end ?? remote.charge_at;
              }
            }
          }

          const resolvedPeriodEnd = activatingPeriodEnd
            ? new Date(activatingPeriodEnd * 1000).toISOString()
            : existingRow?.current_period_end;
          if (activating && !resolvedPeriodEnd) {
            throw new Error("Active subscription has no paid-through date; retrying reconciliation.");
          }

          const patch: {
            status?: string;
            current_period_end?: string;
            cancelled_at?: string;
          } = activating
            ? {
                status: "active",
                current_period_end: resolvedPeriodEnd,
              }
            : { status: "cancelled", cancelled_at: new Date().toISOString() };

          const { data: updated, error: updErr } = await supabaseAdmin
            .from("subscriptions")
            .update(patch)
            .eq("razorpay_subscription_id", subscriptionId)
            .select("user_id");
          if (updErr) throw updErr;

          // Row didn't exist yet (webhook beat createSubscription's DB write).
          // Recover by upserting using notes.user_id.
          if ((updated?.length ?? 0) === 0 && userIdFromNotes && activating) {
            await supabaseAdmin.from("subscriptions").upsert(
              {
                user_id: userIdFromNotes,
                razorpay_subscription_id: subscriptionId,
                ...patch,
              },
              { onConflict: "user_id" },
            );
          }

          // Cancellation stops renewal, but the member keeps access through
          // the period they already paid for. Revoke immediately only when no
          // future paid-through date exists; the sweep handles expiry later.
          const accessEndsAt = existingRow?.current_period_end
            ? new Date(existingRow.current_period_end).getTime()
            : 0;
          if (cancelling && accessEndsAt <= Date.now()) {
            const uid = existingRow?.user_id ?? userIdFromNotes;
            if (uid) {
              const { data: claims } = await supabaseAdmin
                .from("discord_role_claims")
                .select("id, discord_user_id")
                .eq("user_id", uid)
                .eq("status", "assigned");
              const { revokeDiscordRoles } = await import("@/lib/discord-roles.server");
              for (const claim of claims ?? []) {
                try {
                  await revokeDiscordRoles(claim.discord_user_id);
                  await supabaseAdmin
                    .from("discord_role_claims")
                    .update({
                      status: "revoked",
                      actioned_at: new Date().toISOString(),
                      error_message: "Subscription ended — roles removed automatically",
                    })
                    .eq("id", claim.id);
                } catch (err) {
                  console.error("Discord role revoke failed", claim.discord_user_id, err);
                }
              }
            }
          }

          // Lifecycle emails — only on a real state transition.
          if (activating && existingRow?.status !== "active") {
            await notify("bluepill-subscription-started", {
              amount: "₹499/month",
              nextChargeDate: fmtDate(patch.current_period_end) ?? "One month from today",
              appUrl: "https://blueprint.ifvg.in/app",
            });
          } else if (cancelling && existingRow?.status === "active") {
            await notify("bluepill-cancelled", {
              accessUntil:
                fmtDate(existingRow?.current_period_end) ??
                "The end of your current billing period",
              resubscribeUrl: "https://blueprint.ifvg.in/bluepill",
            });
          }
        } catch (err) {
          console.error("Razorpay webhook handler error", event, err);
          // Return 500 so Razorpay retries the event.
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});