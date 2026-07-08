import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview } from "@/lib/account.functions";
import { StatCard, formatINR, PageHeading } from "@/components/section-shell";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/")({
  component: AccountIndex,
});

function AccountIndex() {
  const fn = useServerFn(getMyOverview);
  const { data, isLoading } = useQuery({ queryKey: ["account", "overview"], queryFn: () => fn() });

  if (isLoading) return <p className="label-mono text-muted-foreground">Loading…</p>;
  if (!data) return null;

  const totalPaidPaise = data.payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount_paise, 0);
  const firstName = data.profile?.full_name?.split(" ")[0];

  return (
    <div className="space-y-12">
      <PageHeading
        eyebrow="THE INNER CIRCLE"
        title={`Welcome back${firstName ? `, ${firstName}` : ""}.`}
        description="Your membership, your progress, and every door still open to you. All in one place."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pill" value={data.pill?.pill ? data.pill.pill.toUpperCase() : "—"} sub={data.pill?.pill ? "Locked in" : <Link to="/choose" className="underline">Choose now</Link>} />
        <StatCard label="Subscription" value={data.subscription?.status?.toUpperCase() ?? "—"} sub={data.subscription?.current_period_end ? `Renews ${new Date(data.subscription.current_period_end).toLocaleDateString()}` : undefined} />
        <StatCard label="Lifetime spend" value={formatINR(totalPaidPaise)} />
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 backdrop-blur-sm p-8 md:p-10">
        <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative">
          <p className="label-mono text-red-pill flex items-center gap-3">
            <span className="inline-block h-px w-6 bg-red-pill/60" />
            RED PILL APPLICATION
          </p>
          {data.application ? (
            <>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-semibold tracking-tight">
                Status · <span className="text-gradient-red">{data.application.status.replace(/_/g, " ")}</span>
              </h2>
              {data.application.call_scheduled_at && (
                <p className="mt-3 text-muted-foreground">Call scheduled — <span className="font-mono text-foreground">{new Date(data.application.call_scheduled_at).toLocaleString()}</span></p>
              )}
              <Link to="/account/application" className="mt-6 inline-flex items-center gap-2 label-mono text-primary hover:text-primary/80 transition-colors">
                VIEW DETAILS <ArrowUpRight className="size-3.5" />
              </Link>
            </>
          ) : (
            <>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-semibold tracking-tight">No application on file.</h2>
              <p className="mt-3 max-w-lg text-muted-foreground">Take the Red Pill for direct 1-on-1 mentorship. Every session, uncut.</p>
              <Link to="/red-pill" className="mt-6 inline-flex items-center gap-2 label-mono text-primary hover:text-primary/80 transition-colors">
                START APPLICATION <ArrowUpRight className="size-3.5" />
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickLink to="/account/courses" tone="blue" eyebrow="COURSES" title="Watch your lessons" description="Every session in the library, on your rhythm." />
        <QuickLink to="/account/discord" tone="accent" eyebrow="DISCORD" title="Claim your premium role" description="Get the insignia. Enter the private sanctum." />
      </div>
    </div>
  );
}

function QuickLink({ to, tone, eyebrow, title, description }: { to: string; tone: "blue" | "accent"; eyebrow: string; title: string; description: string }) {
  const toneClass = tone === "blue" ? "text-blue-pill" : "text-accent";
  const glowClass = tone === "blue" ? "bg-blue-pill/15" : "bg-accent/15";
  return (
    <Link to={to as any} className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-7 transition-all hover:border-border">
      <div className={`pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full ${glowClass} blur-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-700`} />
      <div className="relative flex items-start justify-between gap-6">
        <div>
          <p className={`label-mono ${toneClass}`}>{eyebrow}</p>
          <h3 className="mt-3 font-display text-2xl font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">{description}</p>
        </div>
        <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}