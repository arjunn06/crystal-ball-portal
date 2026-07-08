import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminMetrics } from "@/lib/admin.functions";
import { StatCard, formatINR, PageHeading } from "@/components/section-shell";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const fn = useServerFn(adminMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "metrics"], queryFn: () => fn() });

  if (isLoading) return <p className="label-mono text-muted-foreground">Loading dashboard…</p>;
  if (!data) return null;

  return (
    <div className="space-y-12">
      <PageHeading
        eyebrow="CONTROL ROOM · 001"
        title="The room, at a glance."
        description="A quiet ledger of everything moving inside the Blueprint. Members, revenue, and the pulse of the community."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total members" value={String(data.totalUsers)} sub="All-time signups" />
        <StatCard label="Active Blue Pill" value={String(data.activeBlueSubs)} sub={`MRR ~ ${formatINR(data.mrrPaise)}`} />
        <StatCard label="Red Pill paid" value={String(data.paidRedPill)} sub="Lifetime conversions" />
        <StatCard label="Lifetime revenue" value={formatINR(data.totalRevenuePaise)} sub="Every successful payment" />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 backdrop-blur-sm">
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative p-8 md:p-10">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="label-mono text-platinum flex items-center gap-3">
                <span className="inline-block h-px w-6 bg-platinum/60" />
                RECENT SIGNUPS
              </p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl font-semibold">The newest through the door.</h2>
            </div>
            <span className="label-mono text-muted-foreground">{data.recentSignups.length} of many</span>
          </div>
          <div className="hairline mb-4" />
          <ul>
            {data.recentSignups.map((u: any, i: number) => (
              <li key={u.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4 border-b border-border/40 last:border-0">
                <span className="label-mono text-platinum opacity-60 w-8">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{u.full_name ?? "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <p className="label-mono text-muted-foreground text-right">{new Date(u.created_at).toLocaleDateString()}</p>
              </li>
            ))}
            {data.recentSignups.length === 0 && <li className="py-6 text-center text-muted-foreground">No signups yet.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}