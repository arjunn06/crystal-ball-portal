import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCourseDetail, markLessonComplete } from "@/lib/courses.functions";
import { useMemo, useState } from "react";
import { Check, ChevronDown, Play, CheckCircle2 } from "lucide-react";
import { formatDuration } from "@/components/section-shell";

export const Route = createFileRoute("/_authenticated/account/courses/$slug")({
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const fn = useServerFn(getCourseDetail);
  const markFn = useServerFn(markLessonComplete);
  const { data, isLoading } = useQuery({ queryKey: ["course", slug], queryFn: () => fn({ data: { slug } }) });
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const mut = useMutation({
    mutationFn: (vars: { lesson_id: string; completed: boolean }) => markFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course", slug] }),
  });

  const totalDurationSec = useMemo(() => {
    if (!data) return 0;
    return (data.lessons as any[]).reduce((s, l) => s + (l.duration_seconds ?? 0), 0);
  }, [data]);

  if (isLoading) return <p className="label-mono text-muted-foreground">Loading course…</p>;
  if (!data) return null;

  const { course, modules, lessons, completed } = data;
  const completedSet = completed as Set<string>;
  const activeLesson = lessons.find((l: any) => l.id === activeLessonId) ?? lessons[0];
  const progressPct = lessons.length ? Math.round((completedSet.size / lessons.length) * 100) : 0;
  const isRed = course.required_pill === "red";

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className={`relative overflow-hidden rounded-3xl border border-border/70 ${isRed ? "bg-aurora-crimson" : "bg-aurora-steel"}`}>
        {course.cover_url && (
          <img src={course.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
        <div className="relative p-8 md:p-10">
          <Link to="/account/courses" className="label-mono text-muted-foreground hover:text-foreground transition-colors">← ALL COURSES</Link>
          <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-2xl">
              <p className={`label-mono ${isRed ? "text-red-pill" : "text-blue-pill"} flex items-center gap-3`}>
                <span className={`inline-block h-px w-6 ${isRed ? "bg-red-pill/60" : "bg-blue-pill/60"}`} />
                {course.required_pill.toUpperCase()} PILL COURSE
              </p>
              <h1 className="mt-4 text-balance font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
                {course.title}
              </h1>
              {course.summary && <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">{course.summary}</p>}
            </div>
            <div className="min-w-[220px] shrink-0">
              <p className="label-mono text-muted-foreground">PROGRESS</p>
              <p className="mt-2 font-display text-3xl font-semibold text-gradient-platinum">{progressPct}%</p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${isRed ? "bg-red-pill" : "bg-blue-pill"} transition-all duration-500`} style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{completedSet.size} of {lessons.length} lessons · {formatDuration(totalDurationSec)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* PLAYER */}
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-black">
            {activeLesson?.video_url ? (
              <VideoEmbed url={activeLesson.video_url} />
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Play className="size-10" />
                <p className="label-mono">NO VIDEO ATTACHED</p>
              </div>
            )}
          </div>

          {activeLesson && (
            <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-6">
              <p className="label-mono text-muted-foreground">NOW PLAYING</p>
              <h2 className="mt-2 font-display text-2xl md:text-3xl font-semibold tracking-tight">{activeLesson.title}</h2>
              {activeLesson.duration_seconds && (
                <p className="mt-1 text-xs text-muted-foreground font-mono">{formatDuration(activeLesson.duration_seconds)}</p>
              )}
              {activeLesson.description && (
                <>
                  <div className="hairline my-5" />
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{activeLesson.description}</p>
                </>
              )}
              <div className="mt-6">
                <button
                  onClick={() => mut.mutate({ lesson_id: activeLesson.id, completed: !completedSet.has(activeLesson.id) })}
                  className={`label-mono inline-flex items-center gap-2 rounded-full px-5 py-2.5 border transition-all ${
                    completedSet.has(activeLesson.id)
                      ? "bg-blue-pill/15 border-blue-pill/60 text-blue-pill"
                      : "border-border hover:border-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  {completedSet.has(activeLesson.id) ? <><CheckCircle2 className="size-4" /> COMPLETED</> : <>MARK AS COMPLETE</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CURRICULUM SIDEBAR */}
        <aside className="lg:sticky lg:top-24 self-start rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm overflow-hidden max-h-[calc(100vh-8rem)] flex flex-col">
          <div className="p-5 border-b border-border/60">
            <p className="label-mono text-muted-foreground">CURRICULUM</p>
            <p className="mt-1 font-display text-lg">{modules.length} modules · {lessons.length} lessons</p>
          </div>
          <div className="overflow-y-auto divide-y divide-border/50">
            {modules.map((m: any, mi: number) => {
              const mLessons = lessons.filter((l: any) => l.module_id === m.id);
              const mDone = mLessons.filter((l: any) => completedSet.has(l.id)).length;
              const hasActive = mLessons.some((l: any) => l.id === activeLesson?.id);
              const isOpen = openModules[m.id] ?? hasActive ?? true;
              return (
                <div key={m.id}>
                  <button
                    onClick={() => setOpenModules((p) => ({ ...p, [m.id]: !isOpen }))}
                    className="w-full grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className="label-mono text-platinum opacity-60 w-6">{String(mi + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{m.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{mDone}/{mLessons.length} complete</p>
                    </div>
                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <ul className="pb-2">
                      {mLessons.map((l: any) => {
                        const active = activeLesson?.id === l.id;
                        const done = completedSet.has(l.id);
                        return (
                          <li key={l.id}>
                            <button
                              onClick={() => setActiveLessonId(l.id)}
                              className={`w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 pl-4 pr-3 py-2 text-sm border-l-2 transition-all ${
                                active
                                  ? "border-primary bg-primary/5 text-foreground"
                                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
                              }`}
                            >
                              <span className="flex size-5 items-center justify-center shrink-0">
                                {done ? (
                                  <Check className="size-4 text-blue-pill" />
                                ) : (
                                  <Play className={`size-3 ${active ? "text-primary fill-primary" : "opacity-60"}`} />
                                )}
                              </span>
                              <span className="truncate text-left">{l.title}</span>
                              {l.duration_seconds && (
                                <span className="text-[11px] font-mono opacity-70">{formatDuration(l.duration_seconds)}</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                      {mLessons.length === 0 && (
                        <li className="pl-12 py-2 text-xs text-muted-foreground">No lessons yet</li>
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
            {modules.length === 0 && <p className="p-5 text-sm text-muted-foreground">No modules yet.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function VideoEmbed({ url }: { url: string }) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (yt) return <iframe className="aspect-video w-full" src={`https://www.youtube.com/embed/${yt[1]}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
  if (vimeo) return <iframe className="aspect-video w-full" src={`https://player.vimeo.com/video/${vimeo[1]}`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
  return <video controls className="aspect-video w-full" src={url} />;
}