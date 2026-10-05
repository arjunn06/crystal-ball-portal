import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findValidInvite } from "./redpill-invite.server";
import { RED_PILL_BASE_PAISE, RED_PILL_TOTAL_PAISE, gstOn } from "./pricing";

/** The Red Pill is a one-time ₹2,999 + 18% GST enrolment (one month, live). */
export const RED_PILL_AMOUNT_PAISE = RED_PILL_TOTAL_PAISE;
const ACCESS_DAYS = 31;
/** Registrations are open to everyone. */
const REGISTRATIONS_OPEN = true;

/**
 * Create a Razorpay *order* (one-time payment, not a subscription) for the
 * Red Pill program and stage a `pill: 'red'` subscription row for the user.
 */
export const createRedPillOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ inviteToken: z.string().trim().max(64).optional() }).parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const email = ((context.claims as any)?.email as string | undefined) ?? null;
    const invite = data.inviteToken ? await findValidInvite(data.inviteToken, email) : null;
    if (!REGISTRATIONS_OPEN && !invite) {
      throw new Error("Slots are full — Red Pill registrations are closed.");
    }
    const keyId = process.env['RAZORPAY_KEY_ID'];
    const secret = process.env['RAZORPAY_KEY_SECRET'];
    if (!keyId || !secret) throw new Error("Payments are not configured yet.");

    const { data: existing } = await supabase
      .from("subscriptions")
      .select("status, pill")
      .eq("user_id", userId)
      .maybeSingle();
    // Blue Pill members are allowed to upgrade into the Red Pill program.
    if (existing?.status === "active" && existing.pill === "red") {
      throw new Error("You already have active Red Pill access.");
    }

    const auth = "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: RED_PILL_AMOUNT_PAISE,
        currency: "INR",
        receipt: `redpill_${userId.slice(0, 8)}_${Date.now()}`,
        notes: {
          user_id: userId,
          pill: "red",
          base_paise: RED_PILL_BASE_PAISE,
          gst_paise: gstOn(RED_PILL_BASE_PAISE),
        },
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      console.error("Razorpay order error", body);
      throw new Error(body?.error?.description ?? "Could not start checkout.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Don't clobber an existing active (Blue Pill) subscription while the
    // payment is still pending — only stage a row when there's nothing active.
    if (existing?.status !== "active") {
      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: userId,
          razorpay_subscription_id: body.id as string,
          status: "created",
          pill: "red" as const,
          cancelled_at: null,
        },
        { onConflict: "user_id" },
      );
    }

    return {
      orderId: body.id as string,
      amount: RED_PILL_AMOUNT_PAISE,
      keyId,
    };
  });

/** Verify the Razorpay signature after a successful one-time payment. */
export const verifyRedPillPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        razorpay_payment_id: z.string(),
        razorpay_order_id: z.string(),
        razorpay_signature: z.string(),
        inviteToken: z.string().trim().max(64).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const secret = process.env['RAZORPAY_KEY_SECRET'];
    if (!secret) throw new Error("Payments are not configured.");
    const { createHmac } = await import("crypto");
    const expected = createHmac("sha256", secret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    if (expected !== data.razorpay_signature) throw new Error("Signature verification failed.");

    const endsAt = new Date(Date.now() + ACCESS_DAYS * 86400_000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "active", pill: "red" as const, current_period_end: endsAt })
      .eq("user_id", context.userId)
      .eq("razorpay_subscription_id", data.razorpay_order_id)
      .select("user_id");
    // Upgrading Blue → Red: the pending order was never staged on the row.
    if (!updated?.length) {
      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_id: context.userId,
          razorpay_subscription_id: data.razorpay_order_id,
          status: "active",
          pill: "red" as const,
          current_period_end: endsAt,
          cancelled_at: null,
        },
        { onConflict: "user_id" },
      );
    }
    return { ok: true, currentPeriodEnd: endsAt };
  });

/** Did a Red Pill order already get paid (closed tab / webhook race)? */
export const reconcileRedPillOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const keyId = process.env['RAZORPAY_KEY_ID'];
    const secret = process.env['RAZORPAY_KEY_SECRET'];
    if (!keyId || !secret) return { status: null as string | null, changed: false, pill: null as string | null };

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, razorpay_subscription_id, pill")
      .eq("user_id", userId)
      .maybeSingle();
    if (!sub?.razorpay_subscription_id || sub.pill !== "red") {
      return { status: sub?.status ?? null, changed: false, pill: sub?.pill ?? null };
    }
    if (sub.status === "active") return { status: "active", changed: false, pill: "red" };
    if (!sub.razorpay_subscription_id.startsWith("order_")) {
      return { status: sub.status, changed: false, pill: sub.pill };
    }

    const auth = "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64");
    const res = await fetch(
      `https://api.razorpay.com/v1/orders/${sub.razorpay_subscription_id}`,
      { headers: { Authorization: auth } },
    );
    if (!res.ok) return { status: sub.status, changed: false, pill: sub.pill };
    const order = (await res.json()) as { status?: string };
    if (order.status !== "paid") return { status: sub.status, changed: false, pill: sub.pill };

    const endsAt = new Date(Date.now() + ACCESS_DAYS * 86400_000).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "active", current_period_end: endsAt })
      .eq("user_id", userId);
    return { status: "active", changed: true, pill: "red" };
  });
