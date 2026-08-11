/**
 * Server-only helpers for granting and removing Discord roles.
 * Used by the claim flows, the admin panel and the entitlement sweep.
 */
export type Pill = "red" | "blue";

type Cfg = { guild_id: string | null; role_ids: string[]; red_pill_role_ids: string[] };

export async function getDiscordConfig(): Promise<Cfg | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("discord_config")
    .select("guild_id, role_ids, red_pill_role_ids")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return null;
  return {
    guild_id: data.guild_id ?? null,
    role_ids: (data.role_ids ?? []) as string[],
    red_pill_role_ids: (data.red_pill_role_ids ?? []) as string[],
  };
}

export function rolesForPill(cfg: Cfg, pill: Pill) {
  return pill === "red" ? cfg.red_pill_role_ids : cfg.role_ids;
}

/** Every managed role, regardless of pill — used when removing access. */
export function allManagedRoles(cfg: Cfg) {
  return Array.from(new Set([...cfg.role_ids, ...cfg.red_pill_role_ids]));
}

export async function assignDiscordRoles(discordUserId: string, pill: Pill = "blue") {
  const token = process.env['DISCORD_BOT_TOKEN'];
  if (!token) throw new Error("Discord bot is not configured.");
  const cfg = await getDiscordConfig();
  const roleIds = cfg ? rolesForPill(cfg, pill) : [];
  if (!cfg?.guild_id || roleIds.length === 0) {
    throw new Error(
      `Discord ${pill === "red" ? "Red Pill" : "Blue Pill"} roles are not configured yet. Ask an admin to finish setup.`,
    );
  }
  for (const roleId of roleIds) {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${cfg.guild_id}/members/${discordUserId}/roles/${roleId}`,
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
      throw new Error(`Discord API ${res.status}: ${await res.text()}`);
    }
  }
}

/**
 * Remove managed roles from a member. `pill` limits removal to one pill's
 * roles; omit it to strip every managed role (used when access lapses).
 * 404s are treated as success — the member already left the server.
 */
export async function revokeDiscordRoles(discordUserId: string, pill?: Pill) {
  const token = process.env['DISCORD_BOT_TOKEN'];
  if (!token) throw new Error("Discord bot is not configured.");
  const cfg = await getDiscordConfig();
  if (!cfg?.guild_id) throw new Error("Discord server is not configured.");
  const roleIds = pill ? rolesForPill(cfg, pill) : allManagedRoles(cfg);
  for (const roleId of roleIds) {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${cfg.guild_id}/members/${discordUserId}/roles/${roleId}`,
      { method: "DELETE", headers: { Authorization: `Bot ${token}` } },
    );
    if (!res.ok && res.status !== 204 && res.status !== 404) {
      throw new Error(`Discord API ${res.status}: ${await res.text()}`);
    }
  }
}
