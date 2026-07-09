import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListUsers,
  adminBanUser,
  adminTerminateSubscription,
  adminReinitiatePayment,
} from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { Plus, Mail, MessageCircle, Filter, X, MoreHorizontal, Ban, XCircle, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/app/confirm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

type Row = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  discord_user_id: string | null;
  created_at: string;
  roles: string[];
  subscription: { status: string; current_period_end: string | null; cancelled_at: string | null } | null;
};

type Tab = "all" | "members" | "visitors";

const JOINED_OPTIONS = [
  "Recently joined",
  "Last 24 hours",
  "Last 7 days",
  "Last 30 days",
  "Oldest first",
] as const;
type JoinedOpt = (typeof JOINED_OPTIONS)[number];

function UsersPage() {
  const fn = useServerFn(adminListUsers);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: () => fn() });
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [joinedFilter, setJoinedFilter] = useState<JoinedOpt | null>("Recently joined");

  const rows: Row[] = useMemo(() => {
    let list = (data ?? []) as Row[];
    if (tab === "members") list = list.filter((u) => u.subscription);
    if (tab === "visitors") list = list.filter((u) => !u.subscription);
    if (statusFilter) {
      list = list.filter((u) => statusFor(u) === statusFilter);
    }
    if (joinedFilter) {
      const now = Date.now();
      const within = (ms: number) => (u: Row) => now - new Date(u.created_at).getTime() <= ms;
      if (joinedFilter === "Last 24 hours") list = list.filter(within(864e5));
      else if (joinedFilter === "Last 7 days") list = list.filter(within(7 * 864e5));
      else if (joinedFilter === "Last 30 days") list = list.filter(within(30 * 864e5));
      list = [...list].sort((a, b) => {
        const av = new Date(a.created_at).getTime();
        const bv = new Date(b.created_at).getTime();
        return joinedFilter === "Oldest first" ? av - bv : bv - av;
      });
    }
    if (q) {
      const t = q.toLowerCase();
      list = list.filter(
        (u) =>
          (u.email ?? "").toLowerCase().includes(t) ||
          (u.full_name ?? "").toLowerCase().includes(t),
      );
    }
    return list;
  }, [data, tab, statusFilter, joinedFilter, q]);

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border/70 mb-4 text-sm">
        {(["all", "members", "visitors"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "pb-2.5 border-b-2 -mb-px transition-colors " +
              (tab === t
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {t === "all" ? "Users" : t === "members" ? "Memberships" : "Visitors"}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            label="Status"
            active={statusFilter}
            onClear={() => setStatusFilter(null)}
            onPick={(v) => setStatusFilter(v)}
            options={[
              "Joined",
              "Active",
              "Payment pending",
              "Due date missed",
              "Cancelling",
              "Cancelled",
              "Churned",
              "Banned",
            ]}
          />
          <Chip
            label="Date joined"
            active={joinedFilter}
            onClear={() => setJoinedFilter(null)}
            onPick={(v) => setJoinedFilter(v as JoinedOpt)}
            options={JOINED_OPTIONS as unknown as string[]}
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search users"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-8 w-48 text-xs bg-surface border-border rounded-lg"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/70 bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70 bg-surface-2/40">
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Roles</Th>
                <Th>Joined</Th>
                <Th>Renews</Th>
                <Th>Contact</Th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {rows.map((u) => {
                const initials = (u.full_name ?? u.email ?? "··").slice(0, 2).toUpperCase();
                const status = statusFor(u);
                return (
                  <tr key={u.id} className="hover:bg-hover/40 text-[13px]">
                    <Td>
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            className="size-6 rounded-full object-cover shrink-0"
                            alt=""
                          />
                        ) : (
                          <div className="size-6 rounded-full bg-surface-2 border border-border grid place-items-center text-[10px] font-medium shrink-0">
                            {initials}
                          </div>
                        )}
                        <span className="truncate">
                          {u.full_name ?? u.email?.split("@")[0] ?? "—"}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-muted-foreground truncate max-w-[240px]">
                      {u.email ?? "—"}
                    </Td>
                    <Td>
                      <StatusPill status={status} />
                    </Td>
                    <Td className="text-muted-foreground">
                      {u.roles.length ? u.roles.join(", ") : "member"}
                    </Td>
                    <Td className="text-muted-foreground">{timeAgo(u.created_at)}</Td>
                    <Td className="text-muted-foreground">
                      {u.subscription?.current_period_end
                        ? new Date(u.subscription.current_period_end).toLocaleDateString()
                        : "—"}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <IconBtn href={u.email ? `mailto:${u.email}` : undefined}>
                          <Mail className="size-3.5" />
                        </IconBtn>
                        {u.discord_user_id && (
                          <IconBtn>
                            <MessageCircle className="size-3.5" />
                          </IconBtn>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <RowMenu user={u} status={status} />
                    </Td>
                  </tr>
                );
              })}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                    No matches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/70 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {rows.length} of {(data ?? []).length}</span>
        </div>
      </div>
    </>
  );
}

function statusFor(u: Row): string {
  const s = u.subscription;
  if (!s) return "Joined";
  const periodFuture = s.current_period_end && new Date(s.current_period_end) > new Date();
  if (s.status === "active") return s.cancelled_at ? "Cancelling" : "Active";
  if (s.status === "cancelled") return periodFuture ? "Cancelled" : "Churned";
  if (s.status === "created") return "Payment pending";
  if (s.status === "authenticated" || s.status === "past_due" || s.status === "halted")
    return "Due date missed";
  return s.status;
}

function RowMenu({ user, status }: { user: Row; status: string }) {
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const banFn = useServerFn(adminBanUser);
  const termFn = useServerFn(adminTerminateSubscription);
  const reinitFn = useServerFn(adminReinitiatePayment);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const ban = useMutation({
    mutationFn: () => banFn({ data: { user_id: user.id, ban: true } }),
    onSuccess: () => { toast.success("User banned."); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to ban."),
  });
  const terminate = useMutation({
    mutationFn: () => termFn({ data: { user_id: user.id } }),
    onSuccess: () => { toast.success("Subscription terminated."); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to terminate."),
  });
  const reinit = useMutation({
    mutationFn: () => reinitFn({ data: { user_id: user.id } }),
    onSuccess: (r: any) => { if (r?.url) window.open(r.url, "_blank"); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to reinitiate."),
  });

  const hasSub = !!user.subscription;
  const canTerminate = hasSub && user.subscription!.status !== "cancelled";
  const canReinit = status === "Due date missed" || status === "Payment pending";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="size-6 grid place-items-center rounded-md text-muted-foreground hover:bg-hover hover:text-foreground">
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {canReinit && (
          <DropdownMenuItem
            onClick={() => reinit.mutate()}
            className="text-xs"
          >
            <RefreshCw className="size-3.5 mr-2" /> Reinitiate payment
          </DropdownMenuItem>
        )}
        {canTerminate && (
          <DropdownMenuItem
            className="text-xs text-destructive focus:text-destructive"
            onClick={async () => {
              const ok = await confirm({
                title: "Terminate subscription?",
                description: `Immediately cancel ${user.email ?? "this user"}'s subscription. This cannot be undone.`,
                confirmLabel: "Terminate",
                destructive: true,
              });
              if (ok) terminate.mutate();
            }}
          >
            <XCircle className="size-3.5 mr-2" /> Terminate subscription
          </DropdownMenuItem>
        )}
        {(canReinit || canTerminate) && <DropdownMenuSeparator />}
        <DropdownMenuItem
          className="text-xs text-destructive focus:text-destructive"
          onClick={async () => {
            const ok = await confirm({
              title: "Ban user?",
              description: `Prevent ${user.email ?? "this user"} from signing in.`,
              confirmLabel: "Ban user",
              destructive: true,
            });
            if (ok) ban.mutate();
          }}
        >
          <Ban className="size-3.5 mr-2" /> Ban user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2.5 px-4 font-medium">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"py-2.5 px-4 " + (className ?? "")}>{children}</td>;
}

function IconBtn({ children, href }: { children: React.ReactNode; href?: string }) {
  const cls = "size-6 grid place-items-center rounded-md text-muted-foreground hover:bg-hover hover:text-foreground";
  return href ? (
    <a href={href} className={cls}>{children}</a>
  ) : (
    <button className={cls}>{children}</button>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    Joined: "bg-sky-500/15 text-sky-500 border-sky-500/30",
    "Payment pending": "bg-amber-500/15 text-amber-500 border-amber-500/30",
    "Due date missed": "bg-amber-500/15 text-amber-500 border-amber-500/30",
    Cancelling: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    Cancelled: "bg-surface-2 text-muted-foreground border-border",
    Churned: "bg-destructive/15 text-destructive border-destructive/30",
    Banned: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const cls = map[status] ?? "bg-surface-2 text-muted-foreground border-border";
  return (
    <span className={"inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium border " + cls}>
      {status}
    </span>
  );
}

function Chip({
  label,
  active,
  onClear,
  onPick,
  options,
}: {
  label: string;
  active?: string | null;
  onClear?: () => void;
  onPick?: (v: string) => void;
  options?: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-7 px-2.5 rounded-full border border-dashed border-border/80 text-xs inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:border-border"
      >
        {active ? (
          <>
            <Filter className="size-3" />
            {label}: <span className="text-foreground font-medium">{active}</span>
            <span
              onClick={(e) => { e.stopPropagation(); onClear?.(); }}
              className="ml-1 opacity-70 hover:opacity-100"
            >
              <X className="size-3" />
            </span>
          </>
        ) : (
          <>
            <Plus className="size-3" /> {label}
          </>
        )}
      </button>
      {open && options && (
        <div className="absolute z-20 mt-1 w-40 rounded-lg border border-border bg-popover shadow-lg p-1">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => { onPick?.(o); setOpen(false); }}
              className="w-full text-left px-2 py-1.5 rounded-md text-xs hover:bg-hover"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) {
    const h = Math.floor(diff / 3_600_000);
    return h < 1 ? "just now" : `${h}h ago`;
  }
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const mo = Math.floor(days / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}