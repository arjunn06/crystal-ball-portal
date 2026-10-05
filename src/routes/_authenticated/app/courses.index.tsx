import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCourses } from "@/lib/courses.functions";
import { LogoIcon } from "@/components/logo-icon";
import { formatDuration } from "@/components/app/sidebar";
import { EmptyState, ProgressBar, SkeletonBlock, StatusPill } from "@/components/app/ui-kit";
import { BookOpen, Check, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/courses/")({
  component: CoursesList,
});

function CoursesList() {
  const fn = useServerFn(listCourses);
  const { data, isLoading } = useQuery({ queryKey: ["courses", "list"], queryFn: () => fn() });

  return (
    <div>
      <header className="mb-12">
        <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[3.4rem]">
          Courses
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          Every published session and module in the library.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="aspect-[4/3]" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No courses published yet"
          body="New sessions appear here as soon as they go live."
        />
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((c) => {
            const pct = c.lessonCount ? Math.round((c.completedCount / c.lessonCount) * 100) : 0;
            const done = c.lessonCount > 0 && c.completedCount === c.lessonCount;
            return (
              <Link
                key={c.id}
                to="/app/courses/$slug"
                params={{ slug: c.slug }}
                className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-surface-2">
                  {c.cover_url ? (
                    <img
                      src={c.cover_url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(420px_260px_at_20%_0%,hsl(214_80%_50%/0.3),transparent_70%),linear-gradient(180deg,hsl(214_24%_12%),var(--surface))]">
                      <LogoIcon className="absolute -bottom-6 -right-4 size-40 text-foreground/[0.06]" />
                    </div>
                  )}
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="grid size-14 place-items-center rounded-full bg-background/80 backdrop-blur">
                      <Play className="size-5 translate-x-0.5 fill-current" />
                    </span>
                  </span>
                  {done && (
                    <StatusPill
                      tone="success"
                      className="absolute left-3 top-3 bg-background/80 backdrop-blur"
                    >
                      <Check className="size-3.5" /> Completed
                    </StatusPill>
                  )}
                </div>
                <div className="px-1 pt-5">
                  <h2 className="font-display text-xl font-bold leading-snug tracking-[-0.02em]">
                    {c.title}
                  </h2>
                  {c.summary && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {c.summary}
                    </p>
                  )}
                  <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {c.lessonCount} lessons, {formatDuration(c.totalDurationSeconds)}
                    </span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} className="mt-2.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
