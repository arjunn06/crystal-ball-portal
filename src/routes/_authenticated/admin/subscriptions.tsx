import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListSubscriptions, adminGetInvoiceUrl } from "@/lib/admin.functions";
import { formatINR } from "@/components/app/sidebar";
import { Check, X, MoreHorizontal, Plus, Filter, Download, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  component: PaymentsPage,
});

type Sub = {
  id: string;
  status: string;
  razorpay_subscription_id: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  profile: { full_name: string | null; email: string | null } | null;
};

function PaymentsPage() {
  const fn = useServerFn(adminListSubscriptions);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "subs"], queryFn: () => fn() });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const rows: Sub[] = useMemo(() => {
    const list = (data ?? []) as Sub[];
    return statusFilter ? list.filter((s) => s.status === statusFilter) : list;
  }, [data, statusFilter]);

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="Status"
            active={statusFilter}
            onClear={() => setStatusFilter(null)}
            onPick={(v) => setStatusFilter(v)}
            options={["active", "cancelled", "created", "past_due"]}
          />
          <FilterChip label="Method" />
          <FilterChip label="Date" />
          <FilterChip label="Reason" />
          <FilterChip label="Product" />
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-lg border border-border/70 text-xs inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <Download className="size-3.5" /> Export
          </button>
          <button className="h-8 px-3 rounded-lg border border-border/70 text-xs inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
            <Pencil className="size-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/70 bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70 bg-surface-2/40">
              <tr>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Product</Th>
                <Th>Plan</Th>
                <Th>Reason</Th>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Paid</Th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {rows.map((s) => {
                const paidAt = s.status === "active" ? s.created_at : null;
                return (
                  <tr key={s.id} className="hover:bg-hover/40 text-[13px]">
                    <Td className="font-medium">{formatINR(499_00)}</Td>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                    <Td>The Blue Pill</Td>
                    <Td className="text-muted-foreground">₹499.00 / month</Td>
                    <Td className="text-muted-foreground">
                      {s.cancelled_at ? "Cancellation" : "Subscription renewal"}
                    </Td>
                    <Td>
                      <UserCell name={s.profile?.full_name} email={s.profile?.email} />
                    </Td>
                    <Td className="text-muted-foreground truncate max-w-[220px]">
                      {s.profile?.email ?? "—"}
                    </Td>
                    <Td className="text-muted-foreground">{paidAt ? timeAgo(paidAt) : "—"}</Td>
                    <Td>
                      <RowMenu sub={s} />
                    </Td>
                  </tr>
                );
              })}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-xs text-muted-foreground">
                    No payments yet.
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2.5 px-4 font-medium">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={"py-2.5 px-4 " + (className ?? "")}>{children}</td>;
}

function FilterChip({
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

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const good = s === "active";
  const bad = s === "cancelled" || s === "failed" || s === "past_due";
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium border " +
        (good
          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
          : bad
          ? "bg-destructive/15 text-destructive border-destructive/30"
          : "bg-surface-2 text-muted-foreground border-border")
      }
    >
      {good ? <Check className="size-3" /> : bad ? <X className="size-3" /> : null}
      {good ? "Succeeded" : bad ? (s === "cancelled" ? "Cancelled" : "Failed") : status}
    </span>
  );
}

function UserCell({ name, email }: { name?: string | null; email?: string | null }) {
  const initials = (name ?? email ?? "··").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="size-6 rounded-full bg-surface-2 border border-border grid place-items-center text-[10px] font-medium shrink-0">
        {initials}
      </div>
      <span className="truncate">{name ?? email?.split("@")[0] ?? "—"}</span>
    </div>
  );
}

function RowMenu({ sub }: { sub: Sub }) {
  const invoiceFn = useServerFn(adminGetInvoiceUrl);
  const invoice = useMutation({
    mutationFn: () =>
      invoiceFn({ data: { subscription_id: sub.razorpay_subscription_id ?? "" } }),
    onSuccess: (r: any) => {
      if (r?.url) window.open(r.url, "_blank");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not fetch invoice."),
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="size-6 grid place-items-center rounded-md text-muted-foreground hover:bg-hover">
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          disabled={!sub.razorpay_subscription_id || invoice.isPending}
          onClick={() => invoice.mutate()}
          className="text-xs"
        >
          <Download className="size-3.5 mr-2" />
          {invoice.isPending ? "Loading…" : "Download invoice"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const mo = Math.floor(days / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}