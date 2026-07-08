import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCourses } from "@/lib/courses.functions";
import { PageHeader, Card, formatDuration } from "@/components/app/sidebar";
import { Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/courses")({
  component: CoursesList,
});

function CoursesList() {
  const fn = useServerFn(listCourses);
  const { data, isLoading } = useQuery({ queryKey: ["courses", "list"], queryFn: () => fn() });

  return (
    <>
      <PageHeader title="Courses" description="Every published session and module in the library." />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (data?.length ?? 0) === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No courses published yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data!.map((c) => {
            const pct = c.lessonCount ? Math.round((c.completedCount / c.lessonCount) * 100) : 0;
            return (
              <Link
                key={c.id}
                to="/app/courses/$slug"
                params={{ slug: c.slug }}
                className="group"
              >
                <Card className="overflow-hidden card-hover">
                  <div className="relative aspect-[16/9] bg-surface-2 overflow-hidden">
                    {c.cover_url ? (
                      <img
                        src={c.cover_url}
                        alt={c.title}
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
                    )}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium">
                      <Play className="size-3 text-primary fill-primary" />
                      {c.lessonCount} lessons
                    </div>
                    {pct > 0 && (
                      <div className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium">
                        {pct}%
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="font-semibold tracking-tight">{c.title}</p>
                    {c.summary && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.summary}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {c.moduleCount} module{c.moduleCount === 1 ? "" : "s"} · {formatDuration(c.totalDurationSeconds)}
                      </span>
                      <span>
                        {c.completedCount}/{c.lessonCount}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}