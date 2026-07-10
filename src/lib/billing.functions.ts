import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolvePromoForCheckout, recordPromoRedemption } from "@/lib/promos.functions";

/**
 * Create (or reuse) a Razorpay subscription for the current user and return
 * the details Checkout needs to open. This is the only paid product.
 */
export const createSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ promo_code: z.string().trim().min(1).max(40).optional().nullable() }).optional().parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const promo = await resolvePromoForCheckout(userId, data?.promo_code ?? null);
    const planId = process.env.RAZORPAY_PLAN_ID;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!planId || !keyId || !secret) throw new Error("Payments are not configured yet.");

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("status, razorpay_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing?.status === "active") throw new Error("You already have an active membership.");

    const body: Record<string, unknown> = {
      plan_id: planId,
      total_count: 120,
      customer_notify: 1,
      notes: { user_id: userId, promo_code: promo?.code ?? null },
    };
    let trialEndsAt: string | null = null;
    if (promo) {
      if (promo.discount_type === "trial_days") {
        const startAt = Math.floor(Date.now() / 1000) + promo.discount_value * 86400;
        body.start_at = startAt;
        trialEndsAt = new Date(startAt * 1000).toISOString();
      } else if (promo.razorpay_offer_id) {
        body.offer_id = promo.razorpay_offer_id;
      }
    }

    const auth = "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const respBody = await res.json();
    if (!res.ok) {
      console.error("Razorpay error", respBody);
      throw new Error(respBody?.error?.description ?? "Could not start subscription.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          razorpay_subscription_id: respBody.id,
          status: trialEndsAt ? "active" : "created",
          current_period_end: trialEndsAt,
        },
        { onConflict: "user_id" },
      );

    if (promo) {
      await recordPromoRedemption(userId, promo.id, respBody.id as string, {
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      });
    }

    return {
      subscriptionId: respBody.id as string,
      keyId,
      trialEndsAt,
      appliedPromo: promo ? { code: promo.code, discount_type: promo.discount_type, discount_value: promo.discount_value } : null,
    };
  });

/**
 * Optimistic client-side verification after checkout success. The webhook is
 * still the source of truth, but this lets the UI unlock immediately.
 */
export const verifySubscriptionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        razorpay_payment_id: z.string(),
        razorpay_subscription_id: z.string(),
        razorpay_signature: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Payments are not configured.");
    const { createHmac } = await import("crypto");
    const payload = `${data.razorpay_payment_id}|${data.razorpay_subscription_id}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    if (expected !== data.razorpay_signature) throw new Error("Signature verification failed.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "active" })
      .eq("razorpay_subscription_id", data.razorpay_subscription_id)
      .eq("user_id", context.userId);
    return { ok: true };
  });