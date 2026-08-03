import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListUsers,
  adminBanUser,
  adminTerminateSubscription,
  adminReinitiatePayment,
  adminInviteTrialUser,
  adminDeleteUser,
  adminSetUserRole,
  adminListMemberships,
} from "@/lib/admin.functions";
import { adminGetUserDetail } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";
import { Plus, Mail, Filter, X, MoreHorizontal, Ban, XCircle, RefreshCw, UserPlus, Loader2, CalendarDays, Trash2, Shield, ShieldOff } from "lucide-react";
import { DiscordIcon } from "@/components/discord-icon";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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

type Membership = {
  id: string;
  user_id: string;
  status: string;
  razorpay_subscription_id: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  profile: { id: string; email: string | null; full_name: string | null; avatar_url: string | null } | null;
  payments_count: number;
  total_paid: number;
  last_payment_at: string | null;
  first_payment_at: string | null;
  last_invoice_url: string | null;
};

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
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

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
      {tab === "members" ? (
        <MembershipsTable onSelect={setDetailId} />
      ) : (
      <>
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
          <Button
            size="sm"
            className="h-8 rounded-lg text-xs gap-1.5"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="size-3.5" />
            Invite user
          </Button>
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
                  <tr
                    key={u.id}
                    onClick={() => setDetailId(u.id)}
                    className="hover:bg-hover/40 text-[13px] cursor-pointer"
                  >
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
                    <Td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <IconBtn href={u.email ? `mailto:${u.email}` : undefined}>
                          <Mail className="size-3.5" />
                        </IconBtn>
                        {u.discord_user_id && (
                          <IconBtn>
                            <DiscordIcon className="size-3.5" />
                          </IconBtn>
                        )}
                      </div>
                    </Td>
                    <Td onClick={(e) => e.stopPropagation()}>
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
      )}

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <UserDetailPane userId={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}

function MembershipsTable({ onSelect }: { onSelect: (id: string) => void }) {
  const fn = useServerFn(adminListMemberships);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "memberships"],
    queryFn: () => fn(),
  });
  const rows = (data ?? []) as Membership[];
  const mrr = rows.length * 499;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Stat label="Paying members" value={String(rows.length)} />
        <Stat label="Monthly recurring" value={`₹${mrr.toLocaleString("en-IN")}`} />
        <Stat
          label="Lifetime collected"
          value={`₹${Math.round(rows.reduce((s, r) => s + r.total_paid, 0) / 100).toLocaleString("en-IN")}`}
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70 bg-surface-2/40">
              <tr>
                <Th>Member</Th>
                <Th>Email</Th>
                <Th>Last payment</Th>
                <Th>Payments</Th>
                <Th>Paid to date</Th>
                <Th>Subscriber for</Th>
                <Th>Renews</Th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                    Loading payments…
                  </td>
                </tr>
              )}
              {rows.map((m) => {
                const initials = (m.profile?.full_name ?? m.profile?.email ?? "··")
                  .slice(0, 2)
                  .toUpperCase();
                const since = m.first_payment_at ?? m.created_at;
                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelect(m.user_id)}
                    className="hover:bg-hover/40 text-[13px] cursor-pointer"
                  >
                    <Td>
                      <div className="flex items-center gap-2">
                        {m.profile?.avatar_url ? (
                          <img src={m.profile.avatar_url} className="size-6 rounded-full object-cover shrink-0" alt="" />
                        ) : (
                          <div className="size-6 rounded-full bg-surface-2 border border-border grid place-items-center text-[10px] font-medium shrink-0">
                            {initials}
                          </div>
                        )}
                        <span className="truncate">
                          {m.profile?.full_name ?? m.profile?.email?.split("@")[0] ?? "—"}
                        </span>
                      </div>
                    </Td>
                    <Td className="text-muted-foreground truncate max-w-[220px]">
                      {m.profile?.email ?? "—"}
                    </Td>
                    <Td>
                      {m.last_payment_at ? (
                        <span title={new Date(m.last_payment_at).toLocaleString()}>
                          {timeAgo(m.last_payment_at)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-muted-foreground">{m.payments_count}</Td>
                    <Td className="font-medium">
                      ₹{Math.round(m.total_paid / 100).toLocaleString("en-IN")}
                    </Td>
                    <Td className="text-muted-foreground">{duration(since)}</Td>
                    <Td className="text-muted-foreground">
                      {m.current_period_end
                        ? new Date(m.current_period_end).toLocaleDateString()
                        : "—"}
                    </Td>
                    <Td>
                      {m.last_invoice_url ? (
                        <a
                          href={m.last_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Invoice
                        </a>
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-muted-foreground">
                    No paying members yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border/70 px-4 py-2.5 text-xs text-muted-foreground">
          Only active subscriptions with at least one successful payment are shown.
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80">{label}</p>
      <p className="text-lg font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function duration(iso: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5));
  if (days < 1) return "today";
  if (days < 31) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return `${years}y${rem ? ` ${rem}m` : ""}`;
}

function InviteUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const inviteFn = useServerFn(adminInviteTrialUser);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [trialDays, setTrialDays] = useState<number>(30);

  // Keep trial_days in sync when a renewal date is picked.
  function onRenewalChange(v: string) {
    setRenewalDate(v);
    if (!v) return;
    const target = new Date(v + "T23:59:59");
    const days = Math.max(1, Math.ceil((target.getTime() - Date.now()) / 86_400_000));
    setTrialDays(days);
  }

  function onTrialDaysChange(n: number) {
    setTrialDays(n);
    if (Number.isFinite(n) && n > 0) {
      const d = new Date(Date.now() + n * 86_400_000);
      setRenewalDate(d.toISOString().slice(0, 10));
    }
  }

  const invite = useMutation({
    mutationFn: () =>
      inviteFn({
        data: {
          email: email.trim(),
          trial_days: trialDays,
          full_name: fullName.trim() || undefined,
          redirect_to: window.location.origin + "/auth/callback",
        },
      }),
    onSuccess: (r: any) => {
      toast.success(
        r?.invited
          ? `Invite sent. Trial ends ${new Date(r.trial_ends).toLocaleDateString()}.`
          : `Trial granted through ${new Date(r.trial_ends).toLocaleDateString()}.`,
      );
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setEmail("");
      setFullName("");
      setRenewalDate("");
      setTrialDays(30);
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not invite user."),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today.getTime() + 86_400_000).toISOString().slice(0, 10);

  const canSubmit =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    trialDays >= 1 &&
    trialDays <= 365 &&
    !invite.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite user with trial</DialogTitle>
          <DialogDescription>
            Send an invite email and grant a manual trial matching their existing renewal
            date. They'll get full access until the trial ends.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) invite.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div>
            <Label htmlFor="invite-email" className="text-xs">Email</Label>
            <Input
              id="invite-email"
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-1.5 h-9 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="invite-name" className="text-xs">
              Full name <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="invite-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="mt-1.5 h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="invite-renewal" className="text-xs flex items-center gap-1">
                <CalendarDays className="size-3" /> Next renewal
              </Label>
              <Input
                id="invite-renewal"
                type="date"
                min={minDate}
                value={renewalDate}
                onChange={(e) => onRenewalChange(e.target.value)}
                className="mt-1.5 h-9 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="invite-days" className="text-xs">Trial days</Label>
              <Input
                id="invite-days"
                type="number"
                min={1}
                max={365}
                value={trialDays}
                onChange={(e) => onTrialDaysChange(parseInt(e.target.value || "0", 10))}
                className="mt-1.5 h-9 text-sm"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            Access ends automatically. Pick a date to set days, or set days to compute the date.
          </p>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={invite.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {invite.isPending ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  const delFn = useServerFn(adminDeleteUser);
  const roleFn = useServerFn(adminSetUserRole);

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
  const del = useMutation({
    mutationFn: () => delFn({ data: { user_id: user.id } }),
    onSuccess: () => { toast.success("User deleted."); invalidate(); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to delete."),
  });
  const setRole = useMutation({
    mutationFn: (role: "admin" | "member") =>
      roleFn({ data: { user_id: user.id, role } }),
    onSuccess: (_r, role) => {
      toast.success(role === "admin" ? "Promoted to admin." : "Admin role removed.");
      invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update role."),
  });

  const hasSub = !!user.subscription;
  const canTerminate = hasSub && user.subscription!.status !== "cancelled";
  const canReinit = status === "Due date missed" || status === "Payment pending";
  const isAdmin = user.roles.includes("admin");

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
        {isAdmin ? (
          <DropdownMenuItem
            className="text-xs"
            onClick={async () => {
              const ok = await confirm({
                title: "Remove admin role?",
                description: `${user.email ?? "This user"} will become a regular member.`,
                confirmLabel: "Remove admin",
              });
              if (ok) setRole.mutate("member");
            }}
          >
            <ShieldOff className="size-3.5 mr-2" /> Change to member
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-xs"
            onClick={async () => {
              const ok = await confirm({
                title: "Make admin?",
                description: `Grant ${user.email ?? "this user"} full admin access.`,
                confirmLabel: "Make admin",
              });
              if (ok) setRole.mutate("admin");
            }}
          >
            <Shield className="size-3.5 mr-2" /> Make admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
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
        <DropdownMenuItem
          className="text-xs text-destructive focus:text-destructive"
          onClick={async () => {
            const ok = await confirm({
              title: "Delete user?",
              description: `Permanently delete ${user.email ?? "this user"} and all their data. This cannot be undone.`,
              confirmLabel: "Delete user",
              destructive: true,
            });
            if (ok) del.mutate();
          }}
        >
          <Trash2 className="size-3.5 mr-2" /> Delete user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2.5 px-4 font-medium">{children}</th>;
}
function Td({
  children,
  className,
  onClick,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLTableCellElement>;
  title?: string;
}) {
  return (
    <td className={"py-2.5 px-4 " + (className ?? "")} onClick={onClick} title={title}>
      {children}
    </td>
  );
}

function UserDetailPane({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const fn = useServerFn(adminGetUserDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user-detail", userId],
    queryFn: () => fn({ data: { user_id: userId! } }),
    enabled: !!userId,
  });

  const p = data?.profile as any;
  const sub = data?.subscription as any;
  const claim = (data?.discord_claims ?? [])[0] as any;
  const prog = data?.progress;
  const pct = prog && prog.lessons_total ? Math.round((prog.lessons_done / prog.lessons_total) * 100) : 0;
  const name = p?.full_name ?? p?.email?.split("@")[0] ?? "—";

  return (
    <Sheet open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-surface">
        <SheetHeader>
          <SheetTitle className="text-base">User details</SheetTitle>
        </SheetHeader>

        {isLoading || !data ? (
          <div className="py-16 grid place-items-center text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin mb-2" />
            Loading user…
          </div>
        ) : (
          <div className="mt-4 space-y-6 text-[13px]">
            {/* Identity */}
            <div className="flex items-center gap-3">
              {p?.avatar_url ? (
                <img src={p.avatar_url} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <div className="size-12 rounded-full bg-surface-2 border border-border grid place-items-center text-sm font-medium">
                  {(p?.full_name ?? p?.email ?? "··").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p?.handle ? `@${p.handle}` : "no handle"} · {(data.roles ?? []).join(", ") || "member"}
                </p>
              </div>
            </div>

            {/* Contact */}
            <Section title="Contact">
              <Field label="Email" value={p?.email ?? "—"} />
              <Field
                label="Discord"
                value={p?.discord_user_id ? `ID ${p.discord_user_id}` : "not linked"}
              />
              <Field label="Joined" value={p?.created_at ? new Date(p.created_at).toLocaleDateString() : "—"} />
            </Section>

            {/* Membership */}
            <Section title="Membership">
              <Field label="Status" value={sub?.status ?? "no subscription"} />
              <Field
                label="Subscriber for"
                value={
                  data.first_payment_at
                    ? duration(data.first_payment_at)
                    : sub?.created_at
                      ? duration(sub.created_at)
                      : "—"
                }
              />
              <Field
                label="Renews"
                value={sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
              />
              <Field label="Payment method" value={data.default_method ?? "—"} />
              <Field
                label="Paid to date"
                value={`₹${Math.round((data.total_paid ?? 0) / 100).toLocaleString("en-IN")}`}
              />
            </Section>

            {/* Payment history */}
            <Section title={`Payment history (${data.payments.length})`}>
              {data.payments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No successful payments recorded.</p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {data.payments.map((pay) => (
                    <li key={pay.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">₹{Math.round(pay.amount / 100).toLocaleString("en-IN")}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {new Date(pay.created_at).toLocaleDateString()} · {pay.method ?? "method n/a"}
                        </p>
                      </div>
                      {pay.invoice_url && (
                        <a
                          href={pay.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0"
                        >
                          Invoice
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Discord role */}
            <Section title="Discord role">
              {claim ? (
                <>
                  <Field label="Claim" value={claim.status} />
                  <Field
                    label="Claimed at"
                    value={claim.actioned_at ?? claim.created_at ? new Date(claim.actioned_at ?? claim.created_at).toLocaleString() : "—"}
                  />
                  {claim.error_message && <Field label="Error" value={claim.error_message} />}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Role not claimed yet.</p>
              )}
            </Section>

            {/* Course progress */}
            <Section title="Course progress">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-1.5 flex-1 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {prog?.lessons_done}/{prog?.lessons_total} · {pct}%
                </span>
              </div>
              {prog?.courses.length ? (
                <ul className="space-y-1">
                  {prog.courses.map((c) => (
                    <li key={c.title} className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{c.title}</span>
                      <span>
                        {c.done}/{c.total}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Field
                label="Last activity"
                value={prog?.last_activity_at ? timeAgo(prog.last_activity_at) : "no lessons watched"}
              />
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-2/30 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground/80 mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-[13px] text-right break-words">{value}</span>
    </div>
  );
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