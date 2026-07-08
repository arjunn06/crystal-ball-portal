import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAccountOverview } from "@/lib/account.functions";
import { listCourses } from "@/lib/courses.functions";
import { PageHeader, Card, formatDuration } from "@/components/app/sidebar";
import { ArrowRight, BookOpen, MessageCircle, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Home,
});

function Home() {
  const acct = useServerFn(getAccountOverview);
  const list = useServerFn(listCourses);
  const { data: overview } = useQuery({
    queryKey: ["account", "overview"],
    queryFn: () => acct(),
  });
  const { data: courses } = useQuery({
    queryKey: ["courses", "list"],
    queryFn: () => list(),
    enabled: overview?.isSubscribed,
  });

  const firstName = overview?.profile?.full_name?.split(" ")[0];
  const totalDone = (courses ?? []).reduce((s, c) => s + c.completedCount, 0);
  const totalLessons = (courses ?? []).reduce((s, c) => s + c.lessonCount, 0);
  const nextCourse = (courses ?? []).find((c) => c.completedCount < c.lessonCount) ?? courses?.[0];

  return (
    <>
      <PageHeader
        title={`Welcome${firstName ? `, ${firstName}` : ""}.`}
        description="Your library and role, all in one place."
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Membership" value={overview?.subscription?.status === "active" ? "Active" : "—"} sub={overview?.subscription?.current_period_end ? `Renews ${new Date(overview.subscription.current_period_end).toLocaleDateString()}` : undefined} />
        <StatCard label="Courses" value={String(courses?.length ?? 0)} sub={`${courses?.reduce((s, c) => s + c.moduleCount, 0) ?? 0} modules · ${totalLessons} lessons`} />
        <StatCard label="Progress" value={`${totalDone}/${totalLessons}`} sub="Lessons completed" />
      </div>

      {nextCourse && (
        <Card className="mb-8 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="size-11 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center text-primary shrink-0">
              <Play className="size-4 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Continue where you left off</p>
              <p className="mt-0.5 font-semibold truncate">{nextCourse.title}</p>
              <p className="text-xs text-muted-foreground">
                {nextCourse.completedCount}/{nextCourse.lessonCount} lessons · {formatDuration(nextCourse.totalDurationSeconds)}
              </p>
            </div>
          </div>
          <Link to="/app/courses/$slug" params={{ slug: nextCourse.slug }}>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 h-10 text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
              Resume <ArrowRight className="size-4" />
            </button>
          </Link>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <QuickLink
          to="/app/courses"
          icon={<BookOpen className="size-4" />}
          title="Browse courses"
          description="All published sessions and modules."
        />
        <QuickLink
          to="/app/discord"
          icon={<MessageCircle className="size-4" />}
          title="Claim your Discord role"
          description="Get the members-only role and access the private server."
        />
      </div>
    </>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground truncate">{sub}</p>}
    </Card>
  );
}

function QuickLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link to={to as any}>
      <Card className="p-5 card-hover group flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-surface-2 border border-border grid place-items-center text-primary">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
      </Card>
    </Link>
  );
}