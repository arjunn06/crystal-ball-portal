import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Red Pill registrations are closed to the public, but waitlist members get a
 * single-use "magic link" from the admin panel that unlocks checkout for them.
 */

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function newToken() {
  const raw = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  return raw.slice(0, 40);
}

/** Waitlist entries + whether an invite has been issued / used. */
export const adminListWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: entries }, { data: invites }] = await Promise.all([
      supabaseAdmin
        .from("redpill_waitlist")
        .select("id, email, phone, name, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin
        .from("redpill_invites")
        .select("id, token, email, expires_at, used_at, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    const byEmail = new Map<string, any>();
    for (const inv of invites ?? []) {
      const key = inv.email.toLowerCase();
      if (!byEmail.has(key)) byEmail.set(key, inv);
    }
    return {
      entries: (entries ?? []).map((e) => {
        const inv = byEmail.get(e.email.toLowerCase()) ?? null;
        return {
          ...e,
          invite: inv
            ? {
                token: inv.token as string,
                expires_at: inv.expires_at as string,
                used_at: (inv.used_at as string | null) ?? null,
              }
            : null,
        };
      }),
    };
  });

/** Issue (or re-issue) a single-use payment link for a waitlist email. */
export const adminCreateRedPillInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        waitlist_id: z.string().uuid().optional(),
        name: z.string().trim().max(120).optional(),
        expires_in_days: z.number().int().min(1).max(90).default(14),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = newToken();
    const expires = new Date(Date.now() + data.expires_in_days * 86_400_000).toISOString();
    const { error } = await supabaseAdmin.from("redpill_invites").insert({
      token,
      email: data.email,
      name: data.name ?? null,
      waitlist_id: data.waitlist_id ?? null,
      created_by: context.userId,
      expires_at: expires,
    });
    if (error) throw new Error(error.message);
    return { token, expires_at: expires };
  });

/** Public lookup used by the invite landing page. */
export const getRedPillInvite = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().trim().min(10).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inv } = await supabaseAdmin
      .from("redpill_invites")
      .select("email, name, expires_at, used_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!inv) return { status: "invalid" as const };
    if (inv.used_at) return { status: "used" as const, email: inv.email };
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      return { status: "expired" as const, email: inv.email };
    }
    return {
      status: "valid" as const,
      email: inv.email as string,
      name: (inv.name as string | null) ?? null,
      expires_at: inv.expires_at as string,
    };
  });
