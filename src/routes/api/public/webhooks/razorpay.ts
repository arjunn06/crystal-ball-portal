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
          notes?: Record<string, unknown> | null;
        };
        let payload: {
          event?: string;
          payload?: {
            subscription?: { entity?: SubEntity };
            payment?: { entity?: PaymentEntity };
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

        if (!subscriptionId || (!activating && !cancelling)) {
          return new Response("ignored");
        }

        try {
          const patch: {
            status?: string;
            current_period_end?: string;
            cancelled_at?: string;
          } = activating
            ? {
                status: "active",
                ...(s?.current_end
                  ? { current_period_end: new Date(s.current_end * 1000).toISOString() }
                  : s?.charge_at
                    ? { current_period_end: new Date(s.charge_at * 1000).toISOString() }
                    : {}),
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