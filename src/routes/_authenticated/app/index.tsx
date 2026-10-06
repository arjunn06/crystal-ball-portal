import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAccountOverview } from "@/lib/account.functions";
import { listCourses } from "@/lib/courses.functions";
import { getMyClaim } from "@/lib/discord.functions";
import { LogoIcon } from "@/components/logo-icon";
import { formatDuration } from "@/components/app/sidebar";
import {
  EmptyState,
  ProgressBar,
  SkeletonBlock,
  Stat,
  StatStrip,
  StatusPill,
} from "@/components/app/ui-kit";
import { ArrowRight, BookOpen, Check, Play } from "lucide-react";
import { DiscordIcon } from "@/components/discord-icon";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Home,
});

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function Home() {
  const acct = useServerFn(getAccountOverview);
  const list = useServerFn(listCourses);
  const claim = useServerFn(getMyClaim);
  const { data: overview } = useQuery({
    queryKey: ["account", "overview"],
    queryFn: () => acct(),
  });
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses", "list"],
    queryFn: () => list(),
    enabled: overview?.isSubscribed,
  });
  const { data: discord } = useQuery({ queryKey: ["discord", "claim"], queryFn: () => claim() });

  const firstName = overview?.profile?.full_name?.split(" ")[0];
  const all = courses ?? [];
  const totalDone = all.reduce((s, c) => s + c.completedCount, 0);
  const totalLessons = all.reduce((s, c) => s + c.lessonCount, 0);
  const next = all.find((c) => c.completedCount < c.lessonCount) ?? all[0];
  const sub = overview?.subscription;
  const active = sub?.status === "active";
  const willCancel = !!sub?.cancelled_at;
  const roleActive = discord?.status === "assigned";

  return (
    <div className="space-y-14">
      <header>
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[3.4rem]">
          {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          Your library, progress and membership in one place.
        </p>
      </header>

      {/* Continue learning */}
      {coursesLoading || !overview ? (
        <SkeletonBlock className="h-[300px]" />
      ) : next ? (
        <Link
          to="/app/courses/$slug"
          params={{ slug: next.slug }}
          className="group grid overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-foreground/25 md:grid-cols-[1.15fr_1fr]"
        >
          <div className="relative aspect-video overflow-hidden bg-surface-2 md:aspect-auto md:min-h-[300px]">
            {next.cover_url ? (
              <img
                src={next.cover_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(520px_320px_at_20%_0%,hsl(214_80%_50%/0.32),transparent_70%),linear-gradient(180deg,hsl(214_24%_12%),var(--surface))]">
                <LogoIcon className="absolute -bottom-6 -right-4 size-40 text-foreground/[0.06]" />
              </div>
            )}
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition-transform duration-300 group-hover:scale-110">
                <Play className="size-6 translate-x-0.5 fill-current" />
              </span>
            </span>
          </div>
          <div className="flex flex-col justify-between gap-10 p-7 md:p-9">
            <div>
              <p className="text-sm text-muted-foreground">Continue learning</p>
              <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] md:text-[1.9rem]">
                {next.title}
              </h2>
              {next.summary && (
                <p className="mt-3 line-clamp-2 text-[15px] leading-relaxed text-muted-foreground">
                  {next.summary}
                </p>
              )}
            </div>
            <div>
              <div className="mb-2.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground tabular-nums">
                  {next.completedCount} of {next.lessonCount} lessons
                </span>
                <span className="font-medium tabular-nums">
                  {next.lessonCount
                    ? Math.round((next.completedCount / next.lessonCount) * 100)
                    : 0}
                  %
                </span>
              </div>
              <ProgressBar
                value={next.lessonCount ? (next.completedCount / next.lessonCount) * 100 : 0}
              />
              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground">
                  {next.completedCount > 0 ? "Resume" : "Start"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDuration(next.totalDurationSeconds)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No courses published yet"
          body="New sessions appear here as soon as they go live."
        />
      )}

      {/* Figures */}
      <StatStrip className="sm:grid-cols-3">
        <Stat
          label="Membership"
          value={
            overview ? (
              <span className="inline-flex items-center gap-3">
                {active ? (willCancel ? "Ending" : "Active") : "Inactive"}
                {active && !willCancel && <StatusPill tone="blue">Blue Pill</StatusPill>}
              </span>
            ) : (
              "-"
            )
          }
          sub={
            sub?.current_period_end
              ? `${willCancel ? "Ends" : "Renews"} ${dateFmt.format(new Date(sub.current_period_end))}`
              : undefined
          }
        />
        <Stat
          label="Lessons completed"
          value={
            <>
              {totalDone}
              <span className="text-muted-foreground"> / {totalLessons}</span>
            </>
          }
          sub={
            totalLessons
              ? `${Math.round((totalDone / totalLessons) * 100)}% of the library`
              : undefined
          }
        />
        <Stat
          label="Courses"
          value={all.length}
          sub={`${all.reduce((s, c) => s + c.moduleCount, 0)} modules`}
        />
      </StatStrip>

      {/* Discord */}
      <section
        aria-labelledby="discord-heading"
        className="grid items-center gap-6 rounded-2xl border border-border bg-surface p-7 md:grid-cols-[auto_1fr_auto] md:p-8"
      >
        <span className="grid size-14 place-items-center rounded-xl bg-[#5865F2]/15 text-[#8e99ff]">
          <DiscordIcon className="size-7" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="discord-heading" className="font-display text-xl font-bold tracking-tight">
              {roleActive ? "Your Discord role is active" : "Claim your Discord role"}
            </h2>
            {roleActive && (
              <StatusPill tone="success">
                <Check className="size-3.5" /> Connected
              </StatusPill>
            )}
          </div>
          <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {roleActive
              ? "You can see the members channels, trade alerts and live streams."
              : "Link your account to unlock the members channels, trade alerts and live streams."}
          </p>
        </div>
        <Button asChild variant={roleActive ? "outline" : "default"} className="h-11 px-5">
          <Link to="/app/discord">{roleActive ? "Manage" : "Connect Discord"}</Link>
        </Button>
      </section>
    </div>
  );
}
