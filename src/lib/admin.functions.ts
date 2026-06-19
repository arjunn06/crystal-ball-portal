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

/* ---------- Metrics ---------- */
export const adminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [users, subs, paidRed, recent, paymentsAll] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("payments").select("id", { count: "exact", head: true }).eq("pill", "red").eq("status", "success"),
      supabaseAdmin.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false }).limit(8),
      supabaseAdmin.from("payments").select("amount_paise, pill, status, created_at").eq("status", "success"),
    ]);

    const totalRevenuePaise = (paymentsAll.data ?? []).reduce((s, p: any) => s + (p.amount_paise ?? 0), 0);
    const activeSubs = subs.count ?? 0;
    const mrrPaise = activeSubs * 499 * 100;

    return {
      totalUsers: users.count ?? 0,
      activeBlueSubs: activeSubs,
      paidRedPill: paidRed.count ?? 0,
      totalRevenuePaise,
      mrrPaise,
      recentSignups: recent.data ?? [],
    };
  });

/* ---------- Users ---------- */
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }, { data: pills }, { data: subs }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, email, full_name, discord_username, banned_at, created_at").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("pill_choices").select("user_id, pill"),
      supabaseAdmin.from("subscriptions").select("user_id, status"),
    ]);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    });
    const pillMap = new Map((pills ?? []).map((p: any) => [p.user_id, p.pill]));
    const subMap = new Map((subs ?? []).map((s: any) => [s.user_id, s.status]));
    return (profiles ?? []).map((p: any) => ({
      ...p,
      roles: roleMap.get(p.id) ?? [],
      pill: pillMap.get(p.id) ?? null,
      sub_status: subMap.get(p.id) ?? null,
    }));
  });

export const adminToggleAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), grant: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: data.user_id, role: "admin" }, { onConflict: "user_id,role" });
    } else {
      if (data.user_id === context.userId) throw new Error("You cannot remove your own admin role.");
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id).eq("role", "admin");
    }
    return { ok: true };
  });

export const adminSetBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), banned: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) throw new Error("You cannot ban yourself.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ banned_at: data.banned ? new Date().toISOString() : null }).eq("id", data.user_id);
    return { ok: true };
  });

/* ---------- Applications ---------- */
export const adminListApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: apps } = await supabaseAdmin
      .from("red_pill_applications")
      .select("id, user_id, status, call_scheduled_at, admin_notes, created_at, updated_at")
      .order("created_at", { ascending: false });
    const ids = (apps ?? []).map((a: any) => a.user_id);
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const m = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return (apps ?? []).map((a: any) => ({ ...a, profile: m.get(a.user_id) ?? null }));
  });

export const adminUpdateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending_call", "call_scheduled", "approved", "rejected", "paid"]).optional(),
      admin_notes: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.status) patch.status = data.status;
    if (typeof data.admin_notes === "string") patch.admin_notes = data.admin_notes;
    await supabaseAdmin.from("red_pill_applications").update(patch).eq("id", data.id);
    return { ok: true };
  });

/* ---------- Payments ---------- */
export const adminListPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pays } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, pill, amount_paise, currency, razorpay_order_id, razorpay_payment_id, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, razorpay_subscription_id, status, current_period_end, created_at")
      .order("created_at", { ascending: false });
    const ids = Array.from(new Set([...(pays ?? []).map((p: any) => p.user_id), ...(subs ?? []).map((s: any) => s.user_id)]));
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const m = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return {
      payments: (pays ?? []).map((p: any) => ({ ...p, profile: m.get(p.user_id) ?? null })),
      subscriptions: (subs ?? []).map((s: any) => ({ ...s, profile: m.get(s.user_id) ?? null })),
    };
  });

/* ---------- Bookings ---------- */
export const adminListBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("id, user_id, kind, scheduled_at, google_event_id, notes, created_at")
      .order("scheduled_at", { ascending: false });
    const ids = (bookings ?? []).map((b: any) => b.user_id);
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const m = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return (bookings ?? []).map((b: any) => ({ ...b, profile: m.get(b.user_id) ?? null }));
  });

export const adminDeleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("bookings").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------- Role check for gate ---------- */
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });