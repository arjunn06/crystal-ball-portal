import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCoursesForMember } from "@/lib/courses.functions";
import { PageHeading } from "@/components/section-shell";
import { PlayCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/courses")({
  component: CoursesIndex,
});

function CoursesIndex() {
  const fn = useServerFn(listCoursesForMember);
  const { data, isLoading } = useQuery({ queryKey: ["account", "courses"], queryFn: () => fn() });

  if (isLoading) return <p className="label-mono text-muted-foreground">Loading library…</p>;
  const courses = data?.courses ?? [];

  return (
    <div className="space-y-12">
      <PageHeading
        eyebrow="THE LIBRARY"
        title="Every session. Every framework."
        description="Watch at your own rhythm. Mark lessons complete. Come back to the ones that shape your edge."
      />

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-12 text-center">
          <p className="label-mono text-muted-foreground">EMPTY LIBRARY</p>
          <p className="mt-3 font-display text-xl">No courses published yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">The first releases land soon. Check back.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((c: any, i: number) => (
            <CourseCard key={c.id} c={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ c, index }: { c: any; index: number }) {
  const isRed = c.required_pill === "red";
  return (
    <Link
      to="/account/courses/$slug"
      params={{ slug: c.slug }}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm transition-all hover:border-border"
    >
      {/* Cover / gradient */}
      <div className={`relative aspect-[16/9] overflow-hidden ${isRed ? "bg-aurora-crimson" : "bg-aurora-steel"}`}>
        {c.cover_url && (
          <img
            src={c.cover_url}
            alt={c.title}
            className="absolute inset-0 h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-4 left-4 label-mono text-platinum">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className={`absolute top-4 right-4 label-mono px-2 py-1 rounded-full border backdrop-blur-sm ${isRed ? "border-red-pill/40 text-red-pill bg-red-pill/10" : "border-blue-pill/40 text-blue-pill bg-blue-pill/10"}`}>
          {c.required_pill.toUpperCase()} PILL
        </div>
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="size-10 text-foreground drop-shadow-lg" />
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight">{c.title}</h3>
        {c.summary && <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{c.summary}</p>}
        <div className="hairline mt-5" />
        <p className="mt-4 label-mono text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-2">
          ENTER COURSE →
        </p>
      </div>
    </Link>
  );
}