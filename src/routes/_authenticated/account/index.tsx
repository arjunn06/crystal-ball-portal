import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview } from "@/lib/account.functions";
import { StatCard, formatINR } from "@/components/section-shell";

export const Route = createFileRoute("/_authenticated/account/")({
  component: AccountIndex,
});

function AccountIndex() {
  const fn = useServerFn(getMyOverview);
  const { data, isLoading } = useQuery({ queryKey: ["account", "overview"], queryFn: () => fn() });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return null;

  const totalPaidPaise = data.payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount_paise, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Welcome back{data.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""}.</h1>
        <p className="mt-1 text-muted-foreground">Your membership at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pill" value={data.pill?.pill ? data.pill.pill.toUpperCase() : "—"} sub={data.pill?.pill ? "Locked in" : <Link to="/choose" className="underline">Choose now</Link>} />
        <StatCard label="Subscription" value={data.subscription?.status?.toUpperCase() ?? "—"} sub={data.subscription?.current_period_end ? `Renews ${new Date(data.subscription.current_period_end).toLocaleDateString()}` : undefined} />
        <StatCard label="Lifetime spend" value={formatINR(totalPaidPaise)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="label-mono text-muted-foreground mb-3">RED PILL APPLICATION</p>
        {data.application ? (
          <>
            <p className="text-lg">Status: <span className="font-mono">{data.application.status}</span></p>
            {data.application.call_scheduled_at && (
              <p className="text-sm text-muted-foreground mt-1">Call: {new Date(data.application.call_scheduled_at).toLocaleString()}</p>
            )}
            <Link to="/account/application" className="mt-4 inline-block label-mono text-primary">VIEW DETAILS →</Link>
          </>
        ) : (
          <p className="text-muted-foreground">No application yet. <Link to="/red-pill" className="text-primary underline">Start one</Link></p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/account/courses" className="rounded-xl border border-border bg-card p-6 hover:bg-muted/30 transition">
          <p className="label-mono text-blue-pill">COURSES</p>
          <p className="mt-2 text-lg">Watch your lessons</p>
        </Link>
        <Link to="/account/discord" className="rounded-xl border border-border bg-card p-6 hover:bg-muted/30 transition">
          <p className="label-mono text-accent">DISCORD</p>
          <p className="mt-2 text-lg">Claim your premium role</p>
        </Link>
      </div>
    </div>
  );
}