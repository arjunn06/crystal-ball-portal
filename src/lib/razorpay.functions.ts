import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay keys not configured");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function rzp(path: string, init: RequestInit = {}) {
  const res = await fetch(`${RAZORPAY_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json();
  if (!res.ok) {
    console.error("Razorpay error", path, body);
    throw new Error(body?.error?.description ?? "Razorpay request failed");
  }
  return body;
}

/** Create a one-time Razorpay order for the Red Pill (₹4,999). */
export const createRedPillOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Caller must have an approved application
    const { data: app } = await supabase
      .from("red_pill_applications")
      .select("id,status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!app || app.status !== "approved") {
      throw new Error("Red Pill payment is unlocked only after approval.");
    }

    const amount = 4999 * 100; // paise
    const order = await rzp("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `rp_${userId.slice(0, 8)}_${Date.now()}`,
        notes: { user_id: userId, pill: "red", application_id: app.id },
      }),
    });

    // Persist a pending payment row (service role bypasses RLS for inserts)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").insert({
      user_id: userId,
      pill: "red",
      amount_paise: amount,
      currency: "INR",
      razorpay_order_id: order.id,
      status: "created",
    });

    return {
      orderId: order.id as string,
      amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID!,
    };
  });

/** Create a Razorpay subscription for the Blue Pill (₹499/month). */
export const createBluePillSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const planId = process.env.RAZORPAY_PLAN_ID;
    if (!planId) throw new Error("RAZORPAY_PLAN_ID not configured");

    // Don't double-subscribe
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("status, razorpay_subscription_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing?.status === "active") {
      throw new Error("You already have an active subscription.");
    }

    const sub = await rzp("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        total_count: 120, // 10 years; effectively renews until cancelled
        customer_notify: 1,
        notes: { user_id: userId, pill: "blue" },
      }),
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        razorpay_subscription_id: sub.id,
        status: "created",
      },
      { onConflict: "user_id" },
    );

    return {
      subscriptionId: sub.id as string,
      keyId: process.env.RAZORPAY_KEY_ID!,
    };
  });

/** Client-side verification fallback after Checkout success (webhook is the source of truth). */
export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        razorpay_order_id: z.string().optional(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
        razorpay_subscription_id: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { createHmac } = await import("crypto");
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const payload = data.razorpay_subscription_id
      ? `${data.razorpay_payment_id}|${data.razorpay_subscription_id}`
      : `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    if (expected !== data.razorpay_signature) {
      throw new Error("Signature verification failed");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.razorpay_order_id) {
      await supabaseAdmin
        .from("payments")
        .update({ razorpay_payment_id: data.razorpay_payment_id, status: "captured" })
        .eq("razorpay_order_id", data.razorpay_order_id)
        .eq("user_id", context.userId);
      await supabaseAdmin
        .from("red_pill_applications")
        .update({ status: "paid" })
        .eq("user_id", context.userId)
        .eq("status", "approved");
    }
    if (data.razorpay_subscription_id) {
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "active" })
        .eq("razorpay_subscription_id", data.razorpay_subscription_id);
    }
    return { ok: true };
  });