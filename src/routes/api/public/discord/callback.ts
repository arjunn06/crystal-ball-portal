import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        const origin = url.origin;
        const done = (params: Record<string, string>) => {
          const q = new URLSearchParams(params);
          return Response.redirect(`${origin}/admin/discord?${q.toString()}`, 302);
        };
        if (error) {
          return done({ discord: "error", reason: errorDescription ?? error });
        }
        if (!code || !state) {
          return done({ discord: "error", reason: "Missing code or state" });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: cfg } = await supabaseAdmin
          .from("discord_config")
          .select("oauth_state, oauth_state_expires_at")
          .eq("id", 1)
          .maybeSingle();
        if (!cfg || cfg.oauth_state !== state) {
          return done({ discord: "error", reason: "Invalid state" });
        }
        if (cfg.oauth_state_expires_at && new Date(cfg.oauth_state_expires_at) < new Date()) {
          return done({ discord: "error", reason: "State expired" });
        }

        const dot = state.indexOf(".");
        if (dot < 0) return done({ discord: "error", reason: "Malformed state" });
        const redirectB64 = state.slice(dot + 1);
        let redirectUri: string;
        try {
          redirectUri = Buffer.from(
            redirectB64.replace(/-/g, "+").replace(/_/g, "/"),
            "base64",
          ).toString("utf8");
        } catch {
          return done({ discord: "error", reason: "Malformed state" });
        }

        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          return done({ discord: "error", reason: "Discord OAuth not configured" });
        }

        const body = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        });
        const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        if (!tokenRes.ok) {
          const t = await tokenRes.text();
          return done({ discord: "error", reason: `Token exchange failed: ${t.slice(0, 200)}` });
        }
        const tokenJson = (await tokenRes.json()) as {
          guild?: { id: string; name: string; icon: string | null };
        };

        const patch: {
          oauth_state: null;
          oauth_state_expires_at: null;
          bot_installed_at: string;
          guild_id?: string;
          guild_name?: string;
          guild_icon?: string | null;
        } = {
          oauth_state: null,
          oauth_state_expires_at: null,
          bot_installed_at: new Date().toISOString(),
        };
        if (tokenJson.guild) {
          patch.guild_id = tokenJson.guild.id;
          patch.guild_name = tokenJson.guild.name;
          patch.guild_icon = tokenJson.guild.icon
            ? `https://cdn.discordapp.com/icons/${tokenJson.guild.id}/${tokenJson.guild.icon}.png?size=64`
            : null;
        }
        await supabaseAdmin.from("discord_config").update(patch).eq("id", 1);

        return done({ discord: "connected" });
      },
    },
  },
});