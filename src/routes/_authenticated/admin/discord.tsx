import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListClaims, adminMarkClaim, adminRetryClaim } from "@/lib/discord.functions";
import {
  getDiscordConfig,
  startDiscordConnect,
  listBotGuilds,
  listGuildRoles,
  saveDiscordConfig,
  disconnectDiscord,
} from "@/lib/discord-admin.functions";
import { PageHeader, Card } from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  Users,
} from "lucide-react";

type SearchParams = { discord?: "connected" | "error"; reason?: string };

export const Route = createFileRoute("/_authenticated/admin/discord")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    discord: s.discord === "connected" || s.discord === "error" ? s.discord : undefined,
    reason: typeof s.reason === "string" ? s.reason : undefined,
  }),
  component: DiscordAdminPage,
});

function DiscordAdminPage() {
  const search = useSearch({ from: "/_authenticated/admin/discord" });
  const qc = useQueryClient();

  useEffect(() => {
    if (search.discord === "connected") toast.success("Discord bot connected.");
    if (search.discord === "error") toast.error(search.reason ?? "Discord connection failed.");
    if (search.discord) {
      qc.invalidateQueries({ queryKey: ["admin", "discord", "config"] });
      qc.invalidateQueries({ queryKey: ["admin", "discord", "guilds"] });
      const url = new URL(window.location.href);
      url.searchParams.delete("discord");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title="Discord"
        description="Connect your Discord server and pick the roles paying members receive."
      />
      <ConfigCard />
      <div className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight mb-3">Recent role claims</h2>
        <ClaimsTable />
      </div>
    </>
  );
}

function ConfigCard() {
  const qc = useQueryClient();
  const getCfg = useServerFn(getDiscordConfig);
  const startFn = useServerFn(startDiscordConnect);
  const disconnectFn = useServerFn(disconnectDiscord);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "discord", "config"],
    queryFn: () => getCfg(),
  });

  const connectMut = useMutation({
    mutationFn: () => startFn({ data: { origin: window.location.origin } }),
    onSuccess: (r) => {
      window.location.href = r.url;
    },
    onError: (e: any) => toast.error(e.message),
  });

  const disconnectMut = useMutation({
    mutationFn: () => disconnectFn(),
    onSuccess: () => {
      toast.success("Disconnected.");
      qc.invalidateQueries({ queryKey: ["admin", "discord", "config"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <Card className="p-6 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </Card>
    );
  }

  const cfg = data?.config;
  const connected = Boolean(cfg?.bot_installed_at);
  const hasGuild = Boolean(cfg?.guild_id);
  const hasRoles = (cfg?.role_ids?.length ?? 0) > 0;

  if (!data?.clientConfigured) {
    return (
      <Card className="p-8 text-center">
        <Shield className="size-8 mx-auto text-muted-foreground" />
        <h3 className="mt-3 font-semibold tracking-tight">Discord OAuth not configured</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          The Discord Client ID and Secret aren't set yet. Add them in project secrets, then
          reload this page.
        </p>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card className="p-10 text-center">
        <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center">
          <LinkIcon className="size-6 text-primary" />
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight">Connect your Discord server</h3>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
          Install the Blueprint bot into your server. You'll pick which server, then choose the
          roles paying members should receive.
        </p>
        <Button
          onClick={() => connectMut.mutate()}
          disabled={connectMut.isPending}
          className="mt-6 h-11 px-6 rounded-lg"
        >
          {connectMut.isPending ? "Redirecting…" : "Connect Account"}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 flex items-center gap-4">
        <div className="size-11 rounded-xl border border-border bg-surface overflow-hidden grid place-items-center shrink-0">
          {cfg?.guild_icon ? (
            <img src={cfg.guild_icon} alt="" className="size-full object-cover" />
          ) : (
            <Users className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {cfg?.guild_name ?? "Pick a server below"}
            </p>
            {hasGuild && hasRoles && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 rounded-full px-2 py-0.5">
                <CheckCircle2 className="size-3" /> Live
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasRoles
              ? `${cfg!.role_ids!.length} role${cfg!.role_ids!.length > 1 ? "s" : ""} assigned to paying members`
              : "Finish setup by picking a server and roles"}
          </p>
        </div>
        <button
          onClick={() => disconnectMut.mutate()}
          disabled={disconnectMut.isPending}
          className="text-xs px-2.5 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5"
        >
          <Trash2 className="size-3.5" /> Disconnect
        </button>
      </Card>

      <GuildAndRolePicker
        currentGuildId={cfg?.guild_id ?? null}
        currentRoleIds={cfg?.role_ids ?? []}
        currentRedRoleIds={cfg?.red_pill_role_ids ?? []}
      />
    </div>
  );
}

function GuildAndRolePicker({
  currentGuildId,
  currentRoleIds,
  currentRedRoleIds,
}: {
  currentGuildId: string | null;
  currentRoleIds: string[];
  currentRedRoleIds: string[];
}) {
  const qc = useQueryClient();
  const listGuilds = useServerFn(listBotGuilds);
  const listRoles = useServerFn(listGuildRoles);
  const saveFn = useServerFn(saveDiscordConfig);

  const [selectedGuild, setSelectedGuild] = useState<string | null>(currentGuildId);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoleIds);
  const [selectedRedRoles, setSelectedRedRoles] = useState<string[]>(currentRedRoleIds);

  useEffect(() => {
    setSelectedGuild(currentGuildId);
    setSelectedRoles(currentRoleIds);
    setSelectedRedRoles(currentRedRoleIds);
  }, [currentGuildId, currentRoleIds.join(","), currentRedRoleIds.join(",")]);

  const guildsQuery = useQuery({
    queryKey: ["admin", "discord", "guilds"],
    queryFn: () => listGuilds(),
  });

  const rolesQuery = useQuery({
    queryKey: ["admin", "discord", "roles", selectedGuild],
    queryFn: () => listRoles({ data: { guild_id: selectedGuild! } }),
    enabled: Boolean(selectedGuild),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          guild_id: selectedGuild!,
          role_ids: selectedRoles,
          red_pill_role_ids: selectedRedRoles,
        },
      }),
    onSuccess: () => {
      toast.success("Saved. Members will receive these roles.");
      qc.invalidateQueries({ queryKey: ["admin", "discord", "config"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const dirty = useMemo(() => {
    if (selectedGuild !== currentGuildId) return true;
    const changed = (a: string[], b: string[]) =>
      a.length !== b.length || [...a].sort().some((v, i) => v !== [...b].sort()[i]);
    return changed(selectedRoles, currentRoleIds) || changed(selectedRedRoles, currentRedRoleIds);
  }, [selectedGuild, selectedRoles, selectedRedRoles, currentGuildId, currentRoleIds, currentRedRoleIds]);

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold tracking-tight text-sm">Choose a server</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Servers where the Blueprint bot is installed.
            </p>
          </div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "discord", "guilds"] })}
            className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-hover inline-flex items-center gap-1.5"
          >
            <RefreshCw className="size-3" /> Refresh
          </button>
        </div>
        {guildsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading servers…
          </p>
        ) : (guildsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The bot isn't in any servers yet. Click Connect Account above to install it.
          </p>
        ) : (
          <div className="grid gap-2">
            {guildsQuery.data!.map((g) => {
              const active = selectedGuild === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    if (selectedGuild !== g.id) {
                      setSelectedGuild(g.id);
                      setSelectedRoles([]);
                    }
                  }}
                  className={
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors " +
                    (active
                      ? "border-primary/60 bg-primary/5"
                      : "border-border bg-surface hover:bg-hover")
                  }
                >
                  <div className="size-9 rounded-lg overflow-hidden bg-surface-2 border border-border grid place-items-center shrink-0">
                    {g.icon ? (
                      <img src={g.icon} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium">
                        {g.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm flex-1 truncate">{g.name}</p>
                  {active && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selectedGuild && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold tracking-tight text-sm">Roles per offering</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Members receive the roles configured for the pill they bought.
              </p>
            </div>
            <button
              onClick={() =>
                qc.invalidateQueries({
                  queryKey: ["admin", "discord", "roles", selectedGuild],
                })
              }
              className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-hover inline-flex items-center gap-1.5"
            >
              <RefreshCw className="size-3" /> Refresh
            </button>
          </div>
          {rolesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Loading roles…
            </p>
          ) : (rolesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignable roles found.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              <RoleGroup
                label="Blue Pill"
                hint="₹499/mo subscribers"
                accent="#AB47BC"
                roles={rolesQuery.data!}
                selected={selectedRoles}
                onToggle={(id, on) =>
                  setSelectedRoles((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)))
                }
              />
              <RoleGroup
                label="Red Pill"
                hint="₹2,999 live mentorship"
                accent="#E53935"
                roles={rolesQuery.data!}
                selected={selectedRedRoles}
                onToggle={(id, on) =>
                  setSelectedRedRoles((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)))
                }
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Blue Pill: {selectedRoles.length} · Red Pill: {selectedRedRoles.length}
            </p>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={
                !dirty || selectedRoles.length === 0 || saveMut.isPending
              }
              className="h-10 rounded-lg"
            >
              {saveMut.isPending ? "Saving…" : "Save configuration"}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

function RoleGroup({
  label,
  hint,
  accent,
  roles,
  selected,
  onToggle,
}: {
  label: string;
  hint: string;
  accent: string;
  roles: Array<{ id: string; name: string; color: string | null }>;
  selected: string[];
  onToggle: (id: string, on: boolean) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="size-2.5 rounded-full" style={{ background: accent }} />
        <p className="text-sm font-medium">{label}</p>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </div>
      <div className="grid gap-1.5">
        {roles.map((r) => {
          const checked = selected.includes(r.id);
          return (
            <label
              key={r.id}
              className={
                "flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors " +
                (checked
                  ? "border-primary/50 bg-primary/5"
                  : "border-border bg-surface hover:bg-hover")
              }
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(r.id, e.target.checked)}
                className="size-4 accent-primary"
              />
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ background: r.color ?? "#8B8B96" }}
              />
              <span className="text-sm flex-1 truncate">{r.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ClaimsTable() {
  const qc = useQueryClient();
  const list = useServerFn(adminListClaims);
  const retry = useServerFn(adminRetryClaim);
  const mark = useServerFn(adminMarkClaim);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "claims"],
    queryFn: () => list(),
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => retry({ data: { id } }),
    onSuccess: () => {
      toast.success("Assigned");
      qc.invalidateQueries({ queryKey: ["admin", "claims"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markMut = useMutation({
    mutationFn: (v: { id: string; status: "assigned" | "revoked" }) => mark({ data: v }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "claims"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b border-border/70">
              <tr>
                <th className="py-3 px-4 font-medium">Member</th>
                <th className="py-3 px-4 font-medium">Discord ID</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Error</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(data ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-hover/40 align-top">
                  <td className="py-3 px-4">
                    <p className="truncate">{c.profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.profile?.email}</p>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">{c.discord_user_id}</td>
                  <td className="py-3 px-4 text-xs capitalize">{c.status}</td>
                  <td className="py-3 px-4 text-xs text-destructive max-w-[240px] truncate">
                    {c.error_message ?? ""}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {c.status !== "assigned" && (
                      <button
                        onClick={() => retryMut.mutate(c.id)}
                        className="text-xs px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-hover"
                      >
                        Retry
                      </button>
                    )}
                    {c.status !== "assigned" && (
                      <button
                        onClick={() => markMut.mutate({ id: c.id, status: "assigned" })}
                        className="text-xs px-2.5 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary"
                      >
                        Mark done
                      </button>
                    )}
                    {c.status === "assigned" && (
                      <button
                        onClick={() => markMut.mutate({ id: c.id, status: "revoked" })}
                        className="text-xs px-2.5 py-1 rounded-md border border-destructive/40 text-destructive"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No claims yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}