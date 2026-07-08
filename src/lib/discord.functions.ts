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

async function assignDiscordRole(discordUserId: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_MEMBER_ROLE_ID ?? process.env.DISCORD_BLUE_PILL_ROLE_ID;
  if (!token || !guildId || !roleId) throw new Error("Discord is not configured yet.");
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
        "Content-Length": "0",
      },
    },
  );
  if (!res.ok && res.status !== 204) {
    const body = await res.text();
    throw new Error(`Discord API ${res.status}: ${body}`);
  }
}

/* ---------------- MEMBER ---------------- */

export const claimDiscordRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        discord_user_id: z
          .string()
          .regex(/^\d{15,25}$/, "Use your numeric Discord ID (Developer Mode → right-click your name → Copy User ID)."),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();
    if (sub?.status !== "active") throw new Error("You need an active membership to claim your role.");

    await supabase.from("profiles").update({ discord_user_id: data.discord_user_id }).eq("id", userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claim } = await supabaseAdmin
      .from("discord_role_claims")
      .insert({ user_id: userId, discord_user_id: data.discord_user_id, status: "pending" })
      .select("id")
      .single();

    try {
      await assignDiscordRole(data.discord_user_id);
      await supabaseAdmin
        .from("discord_role_claims")
        .update({ status: "assigned", actioned_at: new Date().toISOString() })
        .eq("id", claim!.id);
      return { ok: true, status: "assigned" as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabaseAdmin
        .from("discord_role_claims")
        .update({ status: "failed", error_message: msg })
        .eq("id", claim!.id);
      return { ok: false, status: "failed" as const, error: msg };
    }
  });

export const getMyClaim = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("discord_role_claims")
      .select("id, discord_user_id, status, error_message, created_at, actioned_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

/* ---------------- ADMIN ---------------- */

export const adminListClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claims } = await supabaseAdmin
      .from("discord_role_claims")
      .select("*")
      .order("created_at", { ascending: false });
    const ids = (claims ?? []).map((c) => c.user_id);
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const m = new Map((profs ?? []).map((p) => [p.id, p]));
    return (claims ?? []).map((c) => ({ ...c, profile: m.get(c.user_id) ?? null }));
  });

export const adminRetryClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claim } = await supabaseAdmin
      .from("discord_role_claims")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!claim) throw new Error("Not found");
    try {
      await assignDiscordRole(claim.discord_user_id);
      await supabaseAdmin
        .from("discord_role_claims")
        .update({
          status: "assigned",
          actioned_by: context.userId,
          actioned_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", claim.id);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabaseAdmin
        .from("discord_role_claims")
        .update({
          status: "failed",
          error_message: msg,
          actioned_by: context.userId,
          actioned_at: new Date().toISOString(),
        })
        .eq("id", claim.id);
      throw e;
    }
  });

export const adminMarkClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["assigned", "revoked"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("discord_role_claims")
      .update({
        status: data.status,
        actioned_by: context.userId,
        actioned_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return { ok: true };
  });