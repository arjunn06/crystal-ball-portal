import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: pill }, { data: sub }, { data: app }, { data: payments }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, avatar_url, discord_username, discord_user_id, phone, banned_at, created_at").eq("id", userId).maybeSingle(),
      supabase.from("pill_choices").select("pill, chosen_at").eq("user_id", userId).maybeSingle(),
      supabase.from("subscriptions").select("status, current_period_end, razorpay_subscription_id").eq("user_id", userId).maybeSingle(),
      supabase.from("red_pill_applications").select("id, status, call_scheduled_at, admin_notes, created_at, updated_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("payments").select("id, pill, amount_paise, currency, status, created_at, razorpay_payment_id").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    return { profile, pill, subscription: sub, application: app, payments: payments ?? [] };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      full_name: z.string().max(100).optional().nullable(),
      avatar_url: z.string().url().max(500).optional().nullable().or(z.literal("")),
      discord_username: z.string().max(50).optional().nullable(),
      phone: z.string().max(30).optional().nullable(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const patch: any = { ...data };
    if (patch.avatar_url === "") patch.avatar_url = null;
    await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    return { ok: true };
  });