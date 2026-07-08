import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Create (or reuse) a Razorpay subscription for the current user and return
 * the details Checkout needs to open. This is the only paid product.
 */
export const createSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
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

    const auth = "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planId,
        total_count: 120,
        customer_notify: 1,
        notes: { user_id: userId },
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      console.error("Razorpay error", body);
      throw new Error(body?.error?.description ?? "Could not start subscription.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        { user_id: userId, razorpay_subscription_id: body.id, status: "created" },
        { onConflict: "user_id" },
      );

    return { subscriptionId: body.id as string, keyId };
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