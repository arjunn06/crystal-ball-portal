import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Razorpay webhook — subscription lifecycle only. This is the source of truth
 * for a member's paid/cancelled state.
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

        let payload: { event?: string; payload?: { subscription?: { entity?: { id?: string; current_end?: number } } } };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const event = payload.event;
        const s = payload.payload?.subscription?.entity;

        try {
          if (
            event === "subscription.activated" ||
            event === "subscription.charged" ||
            event === "subscription.resumed"
          ) {
            if (s?.id) {
              await supabaseAdmin
                .from("subscriptions")
                .update({
                  status: "active",
                  current_period_end: s.current_end
                    ? new Date(s.current_end * 1000).toISOString()
                    : null,
                })
                .eq("razorpay_subscription_id", s.id);
            }
          } else if (
            event === "subscription.cancelled" ||
            event === "subscription.completed" ||
            event === "subscription.halted" ||
            event === "subscription.paused"
          ) {
            if (s?.id) {
              await supabaseAdmin
                .from("subscriptions")
                .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
                .eq("razorpay_subscription_id", s.id);
            }
          }
        } catch (err) {
          console.error("Razorpay webhook handler error", event, err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});