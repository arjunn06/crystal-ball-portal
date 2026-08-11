import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/discord/user-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const oauthError = url.searchParams.get("error");
        const oauthErrDesc = url.searchParams.get("error_description");
        const origin = url.origin;
        const done = (params: Record<string, string>) => {
          const q = new URLSearchParams(params);
          return Response.redirect(`${origin}/app/discord?${q.toString()}`, 302);
        };

        if (oauthError) return done({ discord: "error", reason: oauthErrDesc ?? oauthError });
        if (!code || !state) return done({ discord: "error", reason: "Missing code or state" });
        if (!state.startsWith("u.")) return done({ discord: "error", reason: "Invalid state" });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, discord_oauth_state, discord_oauth_state_expires_at")
          .eq("discord_oauth_state", state)
          .maybeSingle();
        if (!profile) return done({ discord: "error", reason: "Invalid or expired session" });
        if (
          profile.discord_oauth_state_expires_at &&
          new Date(profile.discord_oauth_state_expires_at) < new Date()
        ) {
          return done({ discord: "error", reason: "Session expired, please try again" });
        }
        const userId = profile.id;

        // parse redirect_uri from state
        const parts = state.split(".");
        if (parts.length < 3) return done({ discord: "error", reason: "Malformed state" });
        let redirectUri: string;
        try {
          redirectUri = Buffer.from(
            parts[2].replace(/-/g, "+").replace(/_/g, "/"),
            "base64",
          ).toString("utf8");
        } catch {
          return done({ discord: "error", reason: "Malformed state" });
        }

        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!clientId || !clientSecret || !botToken) {
          return done({ discord: "error", reason: "Discord not configured" });
        }

        // clear state
        await supabaseAdmin
          .from("profiles")
          .update({ discord_oauth_state: null, discord_oauth_state_expires_at: null })
          .eq("id", userId);

        // 1. exchange code
        const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
          }).toString(),
        });
        if (!tokenRes.ok) {
          const t = await tokenRes.text();
          return done({ discord: "error", reason: `Token exchange failed: ${t.slice(0, 160)}` });
        }
        const tokenJson = (await tokenRes.json()) as { access_token: string };

        // 2. get discord user
        const meRes = await fetch("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bearer ${tokenJson.access_token}` },
        });
        if (!meRes.ok) return done({ discord: "error", reason: "Could not read Discord profile" });
        const me = (await meRes.json()) as { id: string; username: string };
        const discordUserId = me.id;

        // 3. verify active subscription (defensive)
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("status, pill, current_period_end")
          .eq("user_id", userId)
          .maybeSingle();
        const { isEntitled } = await import("@/lib/membership.server");
        if (!isEntitled(sub)) {
          return done({ discord: "error", reason: "Active membership required" });
        }

        // 4. get configured guild + roles for this member's pill
        const { data: cfg } = await supabaseAdmin
          .from("discord_config")
          .select("guild_id, role_ids, red_pill_role_ids")
          .eq("id", 1)
          .maybeSingle();
        const guildId = cfg?.guild_id as string | undefined;
        const isRed = sub!.pill === "red";
        const roleIds = ((isRed ? cfg?.red_pill_role_ids : cfg?.role_ids) ?? []) as string[];
        if (!guildId || roleIds.length === 0) {
          return done({
            discord: "error",
            reason: `Discord ${isRed ? "Red Pill" : "Blue Pill"} roles are not configured yet`,
          });
        }

        // 5. save discord id + create/update claim row
        await supabaseAdmin
          .from("profiles")
          .update({ discord_user_id: discordUserId })
          .eq("id", userId);

        const { data: claim } = await supabaseAdmin
          .from("discord_role_claims")
          .insert({ user_id: userId, discord_user_id: discordUserId, status: "pending" })
          .select("id")
          .single();

        try {
          // 6. check membership; if missing, add via guilds.join
          const memRes = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
            { headers: { Authorization: `Bot ${botToken}` } },
          );
          if (memRes.status === 404) {
            const joinRes = await fetch(
              `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bot ${botToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ access_token: tokenJson.access_token }),
              },
            );
            if (!joinRes.ok && joinRes.status !== 204 && joinRes.status !== 201) {
              const t = await joinRes.text();
              throw new Error(`Could not add you to server: ${t.slice(0, 160)}`);
            }
          } else if (!memRes.ok) {
            const t = await memRes.text();
            throw new Error(`Membership check failed: ${t.slice(0, 160)}`);
          }

          // 7. assign roles
          for (const roleId of roleIds) {
            const rr = await fetch(
              `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bot ${botToken}`,
                  "Content-Type": "application/json",
                  "Content-Length": "0",
                },
              },
            );
            if (!rr.ok && rr.status !== 204) {
              const t = await rr.text();
              throw new Error(`Role assign failed: ${t.slice(0, 160)}`);
            }
          }

          await supabaseAdmin
            .from("discord_role_claims")
            .update({ status: "assigned", actioned_at: new Date().toISOString() })
            .eq("id", claim!.id);
          return done({ discord: "connected", username: me.username });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await supabaseAdmin
            .from("discord_role_claims")
            .update({ status: "failed", error_message: msg })
            .eq("id", claim!.id);
          return done({ discord: "error", reason: msg });
        }
      },
    },
  },
});
