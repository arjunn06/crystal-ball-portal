import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook secret not configured", { status: 500 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const event = payload?.event as string;

        try {
          if (event === "payment.captured") {
            const p = payload.payload?.payment?.entity;
            if (p?.order_id) {
              await supabaseAdmin
                .from("payments")
                .update({
                  razorpay_payment_id: p.id,
                  status: "success",
                })
                .eq("razorpay_order_id", p.order_id);
              const userId = p.notes?.user_id as string | undefined;
              if (userId && p.notes?.pill === "red") {
                await supabaseAdmin
                  .from("red_pill_applications")
                  .update({ status: "paid" })
                  .eq("user_id", userId)
                  .eq("status", "approved");
              }
            }
          } else if (event === "payment.failed") {
            const p = payload.payload?.payment?.entity;
            if (p?.order_id) {
              await supabaseAdmin
                .from("payments")
                .update({ status: "failed", razorpay_payment_id: p.id })
                .eq("razorpay_order_id", p.order_id);
            }
          } else if (
            event === "subscription.activated" ||
            event === "subscription.charged" ||
            event === "subscription.resumed"
          ) {
            const s = payload.payload?.subscription?.entity;
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
            const s = payload.payload?.subscription?.entity;
            if (s?.id) {
              await supabaseAdmin
                .from("subscriptions")
                .update({ status: "cancelled" })
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