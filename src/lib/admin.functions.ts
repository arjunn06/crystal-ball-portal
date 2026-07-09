import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

export const adminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    since.setHours(0, 0, 0, 0);
    const [users, active, published, recent, signups30, subs30, cancelledCount] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabaseAdmin
        .from("profiles")
        .select("created_at")
        .gte("created_at", since.toISOString()),
      supabaseAdmin
        .from("subscriptions")
        .select("created_at, status")
        .gte("created_at", since.toISOString()),
      supabaseAdmin
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "cancelled"),
    ]);
    const activeCount = active.count ?? 0;

    // Build 30-day buckets for sparklines.
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const bucket = (rows: { created_at: string }[]) => {
      const map = new Map(days.map((d) => [d, 0]));
      (rows ?? []).forEach((r) => {
        const k = r.created_at.slice(0, 10);
        if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
      });
      return days.map((d) => map.get(d) ?? 0);
    };
    const signupSeries = bucket(signups30.data ?? []);
    const subSeries = bucket(subs30.data ?? []);
    const price = 499_00; // paise per active sub / month
    const revenueSeries = (subs30.data ?? []).reduce<number[]>(
      (acc, r: any) => {
        const k = r.created_at.slice(0, 10);
        const idx = days.indexOf(k);
        if (idx >= 0 && r.status === "active") acc[idx] = (acc[idx] ?? 0) + price;
        return acc;
      },
      Array(days.length).fill(0) as number[],
    );

    return {
      totalUsers: users.count ?? 0,
      activeSubs: activeCount,
      cancelledSubs: cancelledCount.count ?? 0,
      publishedCourses: published.count ?? 0,
      mrrPaise: activeCount * 499 * 100,
      arrPaise: activeCount * 499 * 100 * 12,
      recentSignups: recent.data ?? [],
      series: { days, signups: signupSeries, subs: subSeries, revenue: revenueSeries },
      todayRevenuePaise: revenueSeries[revenueSeries.length - 1] ?? 0,
      yesterdayRevenuePaise: revenueSeries[revenueSeries.length - 2] ?? 0,
    };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }, { data: subs }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, avatar_url, discord_user_id, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, status, current_period_end, cancelled_at"),
    ]);
    const rMap = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = rMap.get(r.user_id) ?? [];
      arr.push(r.role);
      rMap.set(r.user_id, arr);
    });
    const sMap = new Map((subs ?? []).map((s) => [s.user_id, s]));
    return (profiles ?? []).map((p) => ({
      ...p,
      roles: rMap.get(p.id) ?? [],
      subscription: sMap.get(p.id) ?? null,
    }));
  });

export const adminListSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    const ids = (subs ?? []).map((s) => s.user_id);
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const m = new Map((profs ?? []).map((p) => [p.id, p]));
    return (subs ?? []).map((s) => ({ ...s, profile: m.get(s.user_id) ?? null }));
  });