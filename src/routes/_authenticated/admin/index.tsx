import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminMetrics } from "@/lib/admin.functions";
import { StatCard, formatINR } from "@/components/section-shell";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const fn = useServerFn(adminMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "metrics"], queryFn: () => fn() });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total members" value={String(data.totalUsers)} />
        <StatCard label="Active Blue Pill" value={String(data.activeBlueSubs)} sub={`MRR ~ ${formatINR(data.mrrPaise)}`} />
        <StatCard label="Red Pill paid" value={String(data.paidRedPill)} />
        <StatCard label="Lifetime revenue" value={formatINR(data.totalRevenuePaise)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="label-mono text-muted-foreground mb-3">RECENT SIGNUPS</p>
        <ul className="divide-y divide-border">
          {data.recentSignups.map((u: any) => (
            <li key={u.id} className="py-3 flex justify-between text-sm">
              <div>
                <p>{u.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}