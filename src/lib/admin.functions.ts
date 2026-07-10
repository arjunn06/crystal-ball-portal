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

/** Best-effort audit trail — never throw from here. */
async function logAudit(
  ctx: { supabase: any; userId: string; claims?: any },
  entry: {
    action: string;
    target_user_id?: string | null;
    target_email?: string | null;
    details?: Record<string, unknown>;
  },
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const actorEmail =
      (ctx.claims as any)?.email ??
      (await ctx.supabase.from("profiles").select("email").eq("id", ctx.userId).maybeSingle())
        .data?.email ??
      null;
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: ctx.userId,
      actor_email: actorEmail,
      target_user_id: entry.target_user_id ?? null,
      target_email: entry.target_email ?? null,
      action: entry.action,
      details: (entry.details ?? {}) as any,
    });
  } catch (e) {
    console.error("admin audit log failed", e);
  }
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
        .gte("created_at", since.toISOString())
        .not("razorpay_subscription_id", "is", null),
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

/** Fetch the latest Razorpay invoice for a subscription and return its short URL. */
export const adminGetInvoiceUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ subscription_id: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const body = await razorpay(
      `/invoices?subscription_id=${encodeURIComponent(data.subscription_id)}&count=1`,
    );
    const inv = body?.items?.[0];
    if (!inv?.short_url) throw new Error("No invoice available yet.");
    return { url: inv.short_url as string };
  });

/** Terminate a user's subscription immediately (not at cycle end). */
export const adminTerminateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("razorpay_subscription_id, status")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (!sub?.razorpay_subscription_id) throw new Error("No subscription found.");
    if (sub.razorpay_subscription_id && sub.status !== "cancelled") {
      await razorpay(`/subscriptions/${sub.razorpay_subscription_id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancel_at_cycle_end: 0 }),
      }).catch(() => null);
    }
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", data.user_id);
    await logAudit(context, {
      action: "subscription.terminate",
      target_user_id: data.user_id,
      details: { razorpay_subscription_id: sub.razorpay_subscription_id },
    });
    return { ok: true };
  });

/** Reinitiate payment — return the hosted URL for the pending invoice. */
export const adminReinitiatePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("razorpay_subscription_id")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (!sub?.razorpay_subscription_id) throw new Error("No subscription found.");
    const body = await razorpay(
      `/invoices?subscription_id=${encodeURIComponent(sub.razorpay_subscription_id)}&count=10`,
    );
    const pending = (body?.items ?? []).find(
      (i: any) => i.status === "issued" || i.status === "partially_paid" || i.status === "expired",
    );
    const inv = pending ?? body?.items?.[0];
    if (!inv?.short_url) throw new Error("No pending invoice to pay.");
    await logAudit(context, {
      action: "payment.reinitiate",
      target_user_id: data.user_id,
      details: { invoice_id: inv?.id, invoice_status: inv?.status },
    });
    return { url: inv.short_url as string };
  });

/** Ban / unban a user via Supabase Auth admin API. */
export const adminBanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), ban: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      ban_duration: data.ban ? "876000h" : "none",
    } as any);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: data.ban ? "user.ban" : "user.unban",
      target_user_id: data.user_id,
    });
    return { ok: true };
  });

/** Permanently delete a user. Removes auth user; DB cascades handle profile/roles/subs. */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.user_id === context.userId) {
      throw new Error("You can't delete your own account.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Capture identity before we wipe the row for the audit trail.
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", data.user_id)
      .maybeSingle();

    // Best-effort: cancel any live Razorpay subscription first.
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("razorpay_subscription_id, status")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (sub?.razorpay_subscription_id && sub.status !== "cancelled") {
      await razorpay(`/subscriptions/${sub.razorpay_subscription_id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancel_at_cycle_end: 0 }),
      }).catch(() => null);
    }

    // Explicitly clear app rows in case FKs aren't ON DELETE CASCADE.
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("profiles").delete().eq("id", data.user_id);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: "user.delete",
      target_user_id: data.user_id,
      target_email: targetProfile?.email ?? null,
      details: {
        full_name: targetProfile?.full_name ?? null,
        razorpay_subscription_id: sub?.razorpay_subscription_id ?? null,
      },
    });
    return { ok: true };
  });

/** Grant or revoke the admin role for a user. */
export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "member"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.role === "admin") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: data.user_id, role: "admin" },
          { onConflict: "user_id,role" },
        );
      if (error) throw new Error(error.message);
      await logAudit(context, {
        action: "role.grant",
        target_user_id: data.user_id,
        details: { role: "admin" },
      });
    } else {
      if (data.user_id === context.userId) {
        throw new Error("You can't remove your own admin role.");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
      await logAudit(context, {
        action: "role.revoke",
        target_user_id: data.user_id,
        details: { role: "admin" },
      });
    }
    return { ok: true };
  });

/**
 * Invite a user by email and grant them a manual trial subscription that lasts
 * `trial_days` from now. Used to port members from the previous platform: their
 * trial should match their existing renewal date, and they can subscribe
 * normally after the trial ends.
 */
export const adminInviteTrialUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        trial_days: z.number().int().min(1).max(365),
        redirect_to: z.string().url().optional(),
        full_name: z.string().trim().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Find existing auth user by email (paginate defensively).
    let existingUserId: string | null = null;
    for (let page = 1; page <= 20 && !existingUserId; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw new Error(error.message);
      const match = list.users.find((u) => u.email?.toLowerCase() === data.email);
      if (match) existingUserId = match.id;
      if (list.users.length < 200) break;
    }

    let userId = existingUserId;
    let invited = false;

    if (!userId) {
      const { data: inv, error: invErr } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
          redirectTo: data.redirect_to,
          data: data.full_name ? { full_name: data.full_name } : undefined,
        });
      if (invErr || !inv?.user) throw new Error(invErr?.message ?? "Could not send invite.");
      userId = inv.user.id;
      invited = true;
    } else {
      // Existing user — check they don't already have an active paid subscription.
      const { data: sub } = await supabaseAdmin
        .from("subscriptions")
        .select("status, razorpay_subscription_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (sub?.status === "active" && sub.razorpay_subscription_id) {
        throw new Error("User already has an active paid subscription.");
      }
    }

    const periodEnd = new Date(Date.now() + data.trial_days * 86_400_000).toISOString();
    const { error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          status: "active",
          current_period_end: periodEnd,
          cancelled_at: null,
          razorpay_subscription_id: null,
        },
        { onConflict: "user_id" },
      );
    if (subErr) throw new Error(subErr.message);

    await logAudit(context, {
      action: invited ? "user.invite_trial" : "trial.grant",
      target_user_id: userId,
      target_email: data.email,
      details: {
        trial_days: data.trial_days,
        trial_ends: periodEnd,
        full_name: data.full_name ?? null,
      },
    });

    return { ok: true, user_id: userId, invited, trial_ends: periodEnd };
  });

/** List recent admin audit log entries. */
export const adminListAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("id, actor_id, actor_email, target_user_id, target_email, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });