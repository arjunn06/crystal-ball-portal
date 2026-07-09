import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminMetrics } from "@/lib/admin.functions";
import { Card, formatINR } from "@/components/app/sidebar";
import { Sparkline } from "@/components/app/sparkline";
import { Bell, Wallet, TrendingUp, Users, BookOpen, Repeat, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const fn = useServerFn(adminMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "metrics"], queryFn: () => fn() });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const todayRev = data.todayRevenuePaise;
  const yesterdayRev = data.yesterdayRevenuePaise;
  const delta =
    yesterdayRev === 0
      ? todayRev > 0
        ? 100
        : 0
      : Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100);

  return (
    <>
      {/* TODAY */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Today</h2>
        <button className="size-8 grid place-items-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground">
          <Bell className="size-4" />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] mb-10">
        <Card className="p-6">
          <div className="flex items-start gap-10">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Gross revenue</p>
                <DeltaPill value={delta} />
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatINR(todayRev)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{timeLabel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Yesterday</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatINR(yesterdayRev)}
              </p>
            </div>
          </div>
          <div className="mt-6 h-32">
            <Sparkline
              data={data.series.revenue}
              width={800}
              height={128}
              className="w-full h-full"
              fill="currentColor"
              showAxis
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total MRR</p>
              <Wallet className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {formatINR(data.mrrPaise)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatINR(data.arrPaise)} projected ARR
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Active members</p>
              <span className="text-[10px] font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-full px-1.5 py-0.5">
                Live
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{data.activeSubs}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.totalUsers} total accounts
            </p>
          </Card>
        </div>
      </div>

      {/* STATS */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Stats</h2>
        <div className="flex gap-1 text-xs">
          <Chip>Last 30 days</Chip>
          <Chip>All products</Chip>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-10">
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Gross revenue"
          value={formatINR(data.series.revenue.reduce((s, v) => s + v, 0))}
          series={data.series.revenue}
        />
        <StatCard
          icon={<Users className="size-4" />}
          label="New members"
          value={String(data.series.signups.reduce((s, v) => s + v, 0))}
          series={data.series.signups}
        />
        <StatCard
          icon={<Repeat className="size-4" />}
          label="New subscriptions"
          value={String(data.series.subs.reduce((s, v) => s + v, 0))}
          series={data.series.subs}
        />
        <StatCard
          icon={<Wallet className="size-4" />}
          label="MRR"
          value={formatINR(data.mrrPaise)}
          series={data.series.subs.map((v) => v * 499_00)}
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="ARR"
          value={formatINR(data.arrPaise)}
          series={data.series.subs.map((v) => v * 499_00 * 12)}
        />
        <StatCard
          icon={<BookOpen className="size-4" />}
          label="Published courses"
          value={String(data.publishedCourses)}
          series={Array(30).fill(data.publishedCourses)}
        />
      </div>

      {/* Recent signups strip */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold tracking-tight">Recent signups</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Newest members first.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {data.recentSignups.length} shown
          </p>
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

function DeltaPill({ value }: { value: number }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span
      className={
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
        (positive
          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
          : "bg-destructive/15 text-destructive border border-destructive/30")
      }
    >
      <ArrowUpRight className={"size-2.5 " + (positive ? "" : "rotate-90")} />
      {positive ? "+" : ""}{value}%
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/70 bg-surface px-2.5 py-1 text-muted-foreground">
      {children}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  series,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  series: number[];
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="size-6 rounded-md border border-border/70 grid place-items-center text-primary">
            {icon}
          </div>
          <p className="text-sm">{label}</p>
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="mt-3 h-16">
        <Sparkline data={series} width={280} height={64} className="w-full h-full" />
      </div>
    </Card>
  );
}