import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function b64urlEncode(s: string) {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function botFetch(path: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN is not configured.");
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API ${res.status}: ${body}`);
  }
  return res.json();
}

export const getDiscordConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("discord_config")
      .select("guild_id, guild_name, guild_icon, role_ids, roles_cache, bot_installed_at, updated_at")
      .eq("id", 1)
      .maybeSingle();
    const clientId = process.env.DISCORD_CLIENT_ID ?? null;
    return {
      config: data,
      clientConfigured: Boolean(clientId && process.env.DISCORD_CLIENT_SECRET),
      botConfigured: Boolean(process.env.DISCORD_BOT_TOKEN),
    };
  });

export const startDiscordConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId || !process.env.DISCORD_CLIENT_SECRET) {
      throw new Error("Discord OAuth is not configured. Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.");
    }
    const redirectUri = `${data.origin}/api/public/discord/callback`;
    const nonce = randomBytes(16).toString("hex");
    const state = `${nonce}.${b64urlEncode(redirectUri)}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("discord_config")
      .update({
        oauth_state: state,
        oauth_state_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", 1);

    const params = new URLSearchParams({
      client_id: clientId,
      scope: "bot",
      permissions: "268435456", // Manage Roles
      response_type: "code",
      redirect_uri: redirectUri,
      state,
      prompt: "consent",
    });
    return { url: `https://discord.com/api/oauth2/authorize?${params.toString()}` };
  });

export const listBotGuilds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const guilds = (await botFetch("/users/@me/guilds")) as Array<{
      id: string;
      name: string;
      icon: string | null;
    }>;
    return guilds.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`
        : null,
    }));
  });

export const listGuildRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ guild_id: z.string().regex(/^\d+$/) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const roles = (await botFetch(`/guilds/${data.guild_id}/roles`)) as Array<{
      id: string;
      name: string;
      color: number;
      position: number;
      managed: boolean;
    }>;
    return roles
      .filter((r) => r.name !== "@everyone" && !r.managed)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : null,
      }));
  });

export const saveDiscordConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        guild_id: z.string().regex(/^\d+$/),
        role_ids: z.array(z.string().regex(/^\d+$/)).min(1).max(10),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    // fetch metadata for cache
    const guilds = (await botFetch("/users/@me/guilds")) as Array<{
      id: string;
      name: string;
      icon: string | null;
    }>;
    const guild = guilds.find((g) => g.id === data.guild_id);
    if (!guild) throw new Error("Bot is not a member of that server.");
    const roles = (await botFetch(`/guilds/${data.guild_id}/roles`)) as Array<{
      id: string;
      name: string;
      color: number;
    }>;
    const rolesCache = data.role_ids.map((id) => {
      const r = roles.find((x) => x.id === id);
      return {
        id,
        name: r?.name ?? "Unknown role",
        color: r?.color ? `#${r.color.toString(16).padStart(6, "0")}` : null,
      };
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("discord_config")
      .update({
        guild_id: data.guild_id,
        guild_name: guild.name,
        guild_icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`
          : null,
        role_ids: data.role_ids,
        roles_cache: rolesCache,
      })
      .eq("id", 1);
    return { ok: true };
  });

export const disconnectDiscord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("discord_config")
      .update({
        guild_id: null,
        guild_name: null,
        guild_icon: null,
        role_ids: [],
        roles_cache: [],
        bot_installed_at: null,
        oauth_state: null,
        oauth_state_expires_at: null,
      })
      .eq("id", 1);
    return { ok: true };
  });