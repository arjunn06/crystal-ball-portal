import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminMetrics } from "@/lib/admin.functions";
import { PageHeader, Card, formatINR } from "@/components/app/sidebar";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const fn = useServerFn(adminMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "metrics"], queryFn: () => fn() });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data) return null;

  return (
    <>
      <PageHeader title="Dashboard" description="Everything moving in the room." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat label="Members" value={String(data.totalUsers)} />
        <Stat label="Active subscriptions" value={String(data.activeSubs)} />
        <Stat label="MRR" value={formatINR(data.mrrPaise)} />
        <Stat label="Published courses" value={String(data.publishedCourses)} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold tracking-tight">Recent signups</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Newest members first.</p>
          </div>
          <p className="text-xs text-muted-foreground">{data.recentSignups.length} shown</p>
        </div>
        <ul className="divide-y divide-border/60">
          {data.recentSignups.map((u: any) => (
            <li key={u.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-8 rounded-full bg-surface-2 border border-border grid place-items-center text-[11px] font-medium shrink-0">
                  {(u.full_name ?? u.email ?? "··").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate">{u.full_name ?? "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                {new Date(u.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
          {data.recentSignups.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">No signups yet.</li>
          )}
        </ul>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </Card>
  );
}