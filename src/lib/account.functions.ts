import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAccountOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: subscription }, { data: roles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, discord_user_id, created_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status, current_period_end, cancelled_at, razorpay_subscription_id, pill")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const { isEntitled } = await import("@/lib/membership.server");
    return {
      profile,
      subscription,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      isSubscribed: isEntitled(subscription),
      pill: (subscription?.pill ?? "blue") as "red" | "blue",
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        full_name: z.string().max(120).optional().nullable(),
        avatar_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const patch: { full_name?: string | null; avatar_url?: string | null } = {};
    if ("full_name" in data) patch.full_name = data.full_name ?? null;
    if ("avatar_url" in data) patch.avatar_url = data.avatar_url === "" ? null : (data.avatar_url ?? null);
    await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    return { ok: true };
  });

export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("razorpay_subscription_id, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (!sub) throw new Error("No active subscription.");
    if (sub.status === "cancelled") throw new Error("Already cancelled.");


    // Manual / invited trials have no Razorpay subscription — just mark them
    // cancelled locally; access continues until current_period_end.
    if (!sub.razorpay_subscription_id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("subscriptions")
        .update({ cancelled_at: new Date().toISOString() })
        .eq("user_id", userId);
      return { ok: true };
    }

    const id = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!id || !secret) throw new Error("Razorpay is not configured.");
    const auth = "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
    const res = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${sub.razorpay_subscription_id}/cancel`,
      {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ cancel_at_cycle_end: 1 }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Razorpay cancel failed", res.status, body);
      throw new Error("Failed to cancel with payment provider.");
    }

    // Cancelling autopay stops renewal only. Make sure the stored paid-through
    // date reflects the period the member already paid for so access lasts.
    const { fetchRemoteSubscription, paidThroughFromRemote, latestPeriodEnd } = await import(
      "@/lib/razorpay.server"
    );
    const remoteEnd = paidThroughFromRemote(
      await fetchRemoteSubscription(sub.razorpay_subscription_id),
    );
    const keepEnd = latestPeriodEnd(sub.current_period_end, remoteEnd);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({
        cancelled_at: new Date().toISOString(),
        ...(keepEnd ? { current_period_end: keepEnd } : {}),
      })
      .eq("user_id", userId);
    return { ok: true };

  });