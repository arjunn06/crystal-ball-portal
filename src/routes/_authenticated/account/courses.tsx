import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCoursesForMember } from "@/lib/courses.functions";

export const Route = createFileRoute("/_authenticated/account/courses")({
  component: CoursesIndex,
});

function CoursesIndex() {
  const fn = useServerFn(listCoursesForMember);
  const { data, isLoading } = useQuery({ queryKey: ["account", "courses"], queryFn: () => fn() });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const courses = data?.courses ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Courses</h1>
      {courses.length === 0 ? (
        <p className="text-muted-foreground">No courses published yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((c: any) => (
            <Link
              key={c.id}
              to="/account/courses/$slug"
              params={{ slug: c.slug }}
              className="rounded-xl border border-border bg-card p-6 hover:bg-muted/30 transition"
            >
              <p className={`label-mono ${c.required_pill === "red" ? "text-red-pill" : "text-blue-pill"}`}>{c.required_pill.toUpperCase()} PILL</p>
              <h3 className="mt-2 font-display text-xl font-semibold">{c.title}</h3>
              {c.summary && <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}