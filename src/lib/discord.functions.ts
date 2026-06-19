import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function roleIdForKind(kind: string) {
  if (kind === "red_pill") return process.env.DISCORD_RED_PILL_ROLE_ID;
  return process.env.DISCORD_BLUE_PILL_ROLE_ID;
}

async function assignDiscordRole(discordUserId: string, roleKind: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = roleIdForKind(roleKind);
  if (!token || !guildId || !roleId) throw new Error("Discord not configured");
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
    method: "PUT",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", "Content-Length": "0" },
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.text();
    throw new Error(`Discord API ${res.status}: ${body}`);
  }
}

/* ---------- Member ---------- */
export const submitDiscordClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ discord_user_id: z.string().regex(/^\d{15,25}$/, "Use your numeric Discord ID") }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Verify the user has the right entitlement (active subscription or paid red pill)
    const [sub, paid] = await Promise.all([
      supabase.from("subscriptions").select("status").eq("user_id", userId).maybeSingle(),
      supabase.from("payments").select("id").eq("user_id", userId).eq("pill", "red").eq("status", "success").limit(1),
    ]);
    const isBlue = sub.data?.status === "active";
    const isRed = (paid.data ?? []).length > 0;
    if (!isBlue && !isRed) throw new Error("Discord role requires an active membership.");
    const role_kind = isRed ? "red_pill" : "blue_pill";

    await supabase.from("profiles").update({ discord_user_id: data.discord_user_id }).eq("id", userId);

    const { data: claim } = await supabase
      .from("discord_role_claims")
      .insert({ user_id: userId, discord_user_id: data.discord_user_id, role_kind, status: "pending" })
      .select("id")
      .single();

    // Try automatic assignment
    try {
      await assignDiscordRole(data.discord_user_id, role_kind);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("discord_role_claims")
        .update({ status: "assigned", actioned_at: new Date().toISOString() })
        .eq("id", claim!.id);
      return { ok: true, status: "assigned" as const };
    } catch (e: any) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("discord_role_claims")
        .update({ status: "failed", error_message: String(e?.message ?? e) })
        .eq("id", claim!.id);
      return { ok: false, status: "failed" as const, error: String(e?.message ?? e) };
    }
  });

export const myDiscordClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("discord_role_claims")
      .select("id, discord_user_id, role_kind, status, error_message, created_at, actioned_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

/* ---------- Admin ---------- */
export const adminListClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claims } = await supabaseAdmin
      .from("discord_role_claims")
      .select("*")
      .order("created_at", { ascending: false });
    const ids = (claims ?? []).map((c: any) => c.user_id);
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, email, full_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const m = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return (claims ?? []).map((c: any) => ({ ...c, profile: m.get(c.user_id) ?? null }));
  });

export const adminRetryClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claim } = await supabaseAdmin.from("discord_role_claims").select("*").eq("id", data.id).maybeSingle();
    if (!claim) throw new Error("Not found");
    try {
      await assignDiscordRole(claim.discord_user_id, claim.role_kind);
      await supabaseAdmin
        .from("discord_role_claims")
        .update({ status: "assigned", actioned_by: context.userId, actioned_at: new Date().toISOString(), error_message: null })
        .eq("id", claim.id);
      return { ok: true };
    } catch (e: any) {
      await supabaseAdmin
        .from("discord_role_claims")
        .update({ status: "failed", error_message: String(e?.message ?? e), actioned_by: context.userId, actioned_at: new Date().toISOString() })
        .eq("id", claim.id);
      throw e;
    }
  });

export const adminMarkClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["assigned", "revoked"]) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("discord_role_claims")
      .update({ status: data.status, actioned_by: context.userId, actioned_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });