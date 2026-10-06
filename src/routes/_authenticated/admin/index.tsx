import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminMetrics } from "@/lib/admin.functions";
import { Card, formatINR } from "@/components/app/sidebar";
import { Sparkline } from "@/components/app/sparkline";
import { SkeletonBlock, Stat, StatStrip } from "@/components/app/ui-kit";
import { ArrowRight, ArrowUpRight, BookOpen, ClipboardList, Ticket, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

function AdminHome() {
  const fn = useServerFn(adminMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "metrics"], queryFn: () => fn() });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-12 w-64" />
        <SkeletonBlock className="h-[340px]" />
        <SkeletonBlock className="h-32" />
      </div>
    );
  }

  const todayRev = data.todayRevenuePaise;
  const yesterdayRev = data.yesterdayRevenuePaise;
  const delta =
    yesterdayRev === 0
      ? todayRev > 0
        ? 100
        : 0
      : Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100);
  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em] md:text-[2.4rem] md:leading-[1.05]">
            Overview
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            How the community is doing, updated live.
          </p>
        </div>
        <span className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm text-muted-foreground">
          Last 30 days
        </span>
      </header>

      {/* Revenue */}
      <Card className="overflow-hidden">
        <div className="grid gap-8 p-7 md:grid-cols-[1fr_auto] md:p-9">
          <div>
            <p className="text-sm text-muted-foreground">Revenue today</p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <p className="font-display text-5xl font-extrabold tracking-[-0.04em] tabular-nums md:text-6xl">
                {formatINR(todayRev)}
              </p>
              <Delta value={delta} />
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-sm text-muted-foreground">Yesterday</p>
            <p className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] tabular-nums text-muted-foreground">
              {formatINR(yesterdayRev)}
            </p>
          </div>
        </div>
        <div className="border-t border-border bg-surface-2/40 px-2 pt-6 text-foreground">
          <Sparkline
            data={data.series.revenue}
            width={900}
            height={150}
            className="h-36 w-full"
            fill="currentColor"
            showAxis
          />
          <div className="flex justify-between px-5 pb-4 pt-2 text-xs text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </Card>

      {/* Key figures */}
      <StatStrip className="sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0 [&>div]:border-border sm:[&>div:nth-child(n+3)]:border-t lg:[&>div:nth-child(n+3)]:border-t-0">
        <Stat
          label="Monthly recurring"
          value={formatINR(data.mrrPaise)}
          sub={`${formatINR(data.arrPaise)} projected a year`}
        />
        <Stat
          label="Active members"
          value={data.activeSubs}
          sub={`${data.totalUsers} total accounts`}
        />
        <Stat label="New members" value={sum(data.series.signups)} sub="Past 30 days" />
        <Stat label="New subscriptions" value={sum(data.series.subs)} sub="Past 30 days" />
      </StatStrip>

      {/* Trends + people */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight">Recent signups</h2>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              All users <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {data.recentSignups.map((u: any) => (
              <li key={u.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-xs font-semibold">
                    {(u.full_name ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.full_name ?? "Unnamed"}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {dateFmt.format(new Date(u.created_at))}
                </p>
              </li>
            ))}
            {data.recentSignups.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">No signups yet.</li>
            )}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="p-7">
            <h2 className="font-display text-xl font-bold tracking-tight">Shortcuts</h2>
            <ul className="mt-4 space-y-1">
              <Shortcut
                to="/admin/users"
                icon={<Users className="size-4" />}
                label="Manage users"
              />
              <Shortcut
                to="/admin/courses"
                icon={<BookOpen className="size-4" />}
                label={`Courses (${data.publishedCourses} published)`}
              />
              <Shortcut
                to="/admin/promos"
                icon={<Ticket className="size-4" />}
                label="Promo codes"
              />
              <Shortcut
                to="/admin/waitlist"
                icon={<ClipboardList className="size-4" />}
                label="Red Pill waitlist"
              />
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Shortcut({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <li>
      <Link
        to={to as any}
        className="group -mx-3 flex h-11 items-center justify-between rounded-lg px-3 text-sm transition-colors hover:bg-hover/50"
      >
        <span className="flex items-center gap-3">
          <span className="text-muted-foreground">{icon}</span>
          {label}
        </span>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    </li>
  );
}

function Delta({ value }: { value: number }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span
      className={
        "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-sm font-medium tabular-nums " +
        (positive
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive")
      }
    >
      <ArrowUpRight className={"size-3.5 " + (positive ? "" : "rotate-90")} />
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}
