import { BLUE_PILL_TOTAL_PAISE } from "@/lib/pricing";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function razorpayAuth() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Razorpay is not configured.");
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function razorpay(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: razorpayAuth(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.description ?? `Razorpay error (${res.status})`);
  return body;
}

const PROMO_TYPES = ["percent_off_first", "amount_off_first", "trial_days"] as const;

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Only letters, numbers, dashes and underscores"),
  description: z.string().trim().max(280).optional().nullable(),
  discount_type: z.enum(PROMO_TYPES),
  discount_value: z.number().int().positive(),
  max_redemptions: z.number().int().positive().nullable().optional(),
  per_user_limit: z.number().int().positive().max(100).default(1),
  expires_at: z.string().datetime().nullable().optional(),
  active: z.boolean().default(true),
  notes: z.string().trim().max(500).optional().nullable(),
  razorpay_offer_id: z.string().trim().max(60).nullable().optional(),
});

/**
 * Best-effort attempt to auto-create a Razorpay Offer. Razorpay Offers
 * require a payment_method + terms + a few other fields per offer, and one
 * offer only covers one payment method. Because of that, most admins should
 * create the offer in the Razorpay Dashboard and paste the offer_id — this
 * helper returns { id?, error? } so the caller can surface a clear warning.
 */
async function tryCreateRazorpayOffer(input: {
  code: string;
  discount_type: (typeof PROMO_TYPES)[number];
  discount_value: number;
  max_redemptions: number | null | undefined;
  expires_at: string | null | undefined;
}): Promise<{ id: string | null; error: string | null }> {
  if (input.discount_type === "trial_days") return { id: null, error: null };
  const planId = process.env.RAZORPAY_PLAN_ID;
  if (!planId) return { id: null, error: "RAZORPAY_PLAN_ID not configured." };
  try {
    const now = Math.floor(Date.now() / 1000);
    // Razorpay requires ends_at — fall back to 1 year if none supplied.
    const endsAt = input.expires_at
      ? Math.floor(new Date(input.expires_at).getTime() / 1000)
      : now + 365 * 86400;
    const body: Record<string, unknown> = {
      name: `Blueprint ${input.code}`.slice(0, 55),
      payment_method: "card",
      applicable_on: "subscription",
      redemption_type: input.max_redemptions === 1 ? "single" : "multiple",
      plan_ids: [planId],
      starts_at: now,
      ends_at: endsAt,
      terms: `Applicable on the first payment for the Blueprint subscription using code ${input.code}.`,
    };
    if (input.discount_type === "percent_off_first") {
      body.percent_rate = input.discount_value;
      body.max_cashback = Math.round(BLUE_PILL_TOTAL_PAISE * (input.discount_value / 100));
    } else {
      body.discount_amount = Math.round(input.discount_value * 100);
    }
    if (input.max_redemptions) body.max_offer_usage = input.max_redemptions;
    const offer = await razorpay(`/offers`, { method: "POST", body: JSON.stringify(body) });
    return { id: (offer?.id as string) ?? null, error: null };
  } catch (e) {
    const msg = (e as Error).message;
    console.warn("Razorpay offer creation failed:", msg);
    return { id: null, error: msg };
  }
}

export const adminListPromoCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminCreatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.toUpperCase();
    const { data: existing } = await supabaseAdmin
      .from("promo_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (existing) throw new Error("A promo code with that name already exists.");

    // If admin pasted an offer_id, trust it. Otherwise attempt auto-creation
    // for %/₹ codes and surface any Razorpay error back to the UI.
    let offerId: string | null = data.razorpay_offer_id?.trim() || null;
    let offerError: string | null = null;
    if (!offerId && data.discount_type !== "trial_days") {
      const result = await tryCreateRazorpayOffer({
        code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_redemptions: data.max_redemptions ?? null,
        expires_at: data.expires_at ?? null,
      });
      offerId = result.id;
      offerError = result.error;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("promo_codes")
      .insert({
        code,
        description: data.description ?? null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_redemptions: data.max_redemptions ?? null,
        per_user_limit: data.per_user_limit,
        expires_at: data.expires_at ?? null,
        active: data.active,
        notes: data.notes ?? null,
        razorpay_offer_id: offerId,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return {
      ok: true,
      promo: inserted,
      razorpay_linked: !!offerId,
      razorpay_error: offerError,
    };
  });

export const adminUpdatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        description: z.string().trim().max(280).nullable().optional(),
        max_redemptions: z.number().int().positive().nullable().optional(),
        per_user_limit: z.number().int().positive().max(100).optional(),
        expires_at: z.string().datetime().nullable().optional(),
        active: z.boolean().optional(),
        notes: z.string().trim().max(500).nullable().optional(),
        razorpay_offer_id: z.string().trim().max(60).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("promo_codes")
      .update(patch)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeletePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("promo_codes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListPromoRedemptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ promo_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: redemptions } = await supabaseAdmin
      .from("promo_redemptions")
      .select("id, user_id, subscription_id, details, created_at")
      .eq("promo_id", data.promo_id)
      .order("created_at", { ascending: false });
    const ids = (redemptions ?? []).map((r) => r.user_id);
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const m = new Map((profs ?? []).map((p) => [p.id, p]));
    return (redemptions ?? []).map((r) => ({ ...r, profile: m.get(r.user_id) ?? null }));
  });

/** Public: validate a code for the current user and return what discount would apply. */
export const validatePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().trim().min(1).max(40) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.toUpperCase();
    const { data: promo } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (!promo || !promo.active) throw new Error("That code isn't valid.");
    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now())
      throw new Error("That code has expired.");
    if (
      promo.max_redemptions !== null &&
      (promo.redemptions_count ?? 0) >= promo.max_redemptions
    )
      throw new Error("That code has been fully redeemed.");

    const { count } = await supabaseAdmin
      .from("promo_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_id", promo.id)
      .eq("user_id", context.userId);
    if ((count ?? 0) >= (promo.per_user_limit ?? 1))
      throw new Error("You've already used this code.");

    return {
      id: promo.id as string,
      code: promo.code as string,
      description: promo.description as string | null,
      discount_type: promo.discount_type as (typeof PROMO_TYPES)[number],
      discount_value: promo.discount_value as number,
      razorpay_offer_id: promo.razorpay_offer_id as string | null,
    };
  });

/** Server-side (billing) helper: re-validate and return promo details, or null if code omitted. */
export async function resolvePromoForCheckout(
  userId: string,
  code: string | null | undefined,
): Promise<{
  id: string;
  code: string;
  discount_type: (typeof PROMO_TYPES)[number];
  discount_value: number;
  razorpay_offer_id: string | null;
} | null> {
  if (!code) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const normalized = code.trim().toUpperCase();
  const { data: promo } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();
  if (!promo || !promo.active) throw new Error("That code isn't valid.");
  if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now())
    throw new Error("That code has expired.");
  if (
    promo.max_redemptions !== null &&
    (promo.redemptions_count ?? 0) >= promo.max_redemptions
  )
    throw new Error("That code has been fully redeemed.");
  const { count } = await supabaseAdmin
    .from("promo_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("promo_id", promo.id)
    .eq("user_id", userId);
  if ((count ?? 0) >= (promo.per_user_limit ?? 1))
    throw new Error("You've already used this code.");
  return {
    id: promo.id,
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    razorpay_offer_id: promo.razorpay_offer_id,
  };
}

/** Record a redemption and bump counter. Best-effort — never throws. */
export async function recordPromoRedemption(
  userId: string,
  promoId: string,
  subscriptionId: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("promo_redemptions")
      .insert({
        promo_id: promoId,
        user_id: userId,
        subscription_id: subscriptionId,
        details: details as any,
      });
    // Increment counter atomically-ish (best effort).
    const { data: promo } = await supabaseAdmin
      .from("promo_codes")
      .select("redemptions_count")
      .eq("id", promoId)
      .maybeSingle();
    await supabaseAdmin
      .from("promo_codes")
      .update({ redemptions_count: (promo?.redemptions_count ?? 0) + 1 })
      .eq("id", promoId);
  } catch (e) {
    console.error("recordPromoRedemption failed", e);
  }
}