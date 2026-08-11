import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isEntitled } from "@/lib/membership.server";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

type Pill = "red" | "blue";

async function assignDiscordRole(discordUserId: string, pill: Pill = "blue") {
  const { assignDiscordRoles } = await import("@/lib/discord-roles.server");
  await assignDiscordRoles(discordUserId, pill);
}

function b64urlEncode(s: string) {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/* ---------------- MEMBER ---------------- */

export const startMemberDiscordConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId || !process.env.DISCORD_CLIENT_SECRET) {
      throw new Error("Discord is not configured yet. Please try again later.");
    }
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, pill, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (!isEntitled(sub)) {
      throw new Error("You need an active membership to connect Discord.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cfg } = await supabaseAdmin
      .from("discord_config")
      .select("guild_id, role_ids, red_pill_role_ids")
      .eq("id", 1)
      .maybeSingle();
    const pillRoles = (sub!.pill === "red" ? cfg?.red_pill_role_ids : cfg?.role_ids) as
      | string[]
      | null
      | undefined;
    if (!cfg?.guild_id || !pillRoles?.length) {
      throw new Error("Discord isn't set up yet. Please check back soon.");
    }

    const redirectUri = `${data.origin}/api/public/discord/user-callback`;
    const nonce = randomBytes(16).toString("hex");
    const state = `u.${nonce}.${b64urlEncode(redirectUri)}`;
    await supabaseAdmin
      .from("profiles")
      .update({
        discord_oauth_state: state,
        discord_oauth_state_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", userId);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "identify guilds.join",
      state,
      prompt: "consent",
    });
    return { url: `https://discord.com/api/oauth2/authorize?${params.toString()}` };
  });

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
      .select("status, pill, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();
    if (!isEntitled(sub)) throw new Error("You need an active membership to claim your role.");

    await supabase.from("profiles").update({ discord_user_id: data.discord_user_id }).eq("id", userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claim } = await supabaseAdmin
      .from("discord_role_claims")
      .insert({ user_id: userId, discord_user_id: data.discord_user_id, status: "pending" })
      .select("id")
      .single();

    try {
      await assignDiscordRole(data.discord_user_id, (sub!.pill ?? "blue") as Pill);
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
    const { data: claimSub } = await supabaseAdmin
      .from("subscriptions")
      .select("pill")
      .eq("user_id", claim.user_id)
      .maybeSingle();
    try {
      await assignDiscordRole(claim.discord_user_id, (claimSub?.pill ?? "blue") as Pill);
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
    if (data.status === "revoked") {
      const { data: claim } = await supabaseAdmin
        .from("discord_role_claims")
        .select("discord_user_id")
        .eq("id", data.id)
        .maybeSingle();
      if (claim?.discord_user_id) {
        const { revokeDiscordRoles } = await import("@/lib/discord-roles.server");
        await revokeDiscordRoles(claim.discord_user_id);
      }
    }
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