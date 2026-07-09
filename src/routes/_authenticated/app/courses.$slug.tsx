import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCourse, getLessonVideoUrl, setLessonComplete } from "@/lib/courses.functions";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronLeft, Play } from "lucide-react";
import { Card, formatDuration } from "@/components/app/sidebar";

export const Route = createFileRoute("/_authenticated/app/courses/$slug")({
  component: CoursePlayer,
});

function CoursePlayer() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getCourse);
  const mark = useServerFn(setLessonComplete);
  const { data, isLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => get({ data: { slug } }),
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const mut = useMutation({
    mutationFn: (v: { lesson_id: string; completed: boolean }) => mark({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course", slug] }),
  });

  const completed = useMemo(
    () => new Set(data?.completedLessonIds ?? []),
    [data?.completedLessonIds],
  );

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data) return null;

  const { course, modules, lessons } = data;
  const active = lessons.find((l) => l.id === activeId) ?? lessons[0];
  const totalDuration = lessons.reduce((s, l) => s + (l.duration_seconds ?? 0), 0);
  const pct = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0;

  return (
    <>
      <Link
        to="/app/courses"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="size-3.5" /> Courses
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black relative">
              {active?.video_url ? (
                <VideoEmbed url={active.video_url} lessonId={active.id} />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
                  No video yet
                </div>
              )}
            </div>
          </Card>

          {active && (
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Now playing</p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight">{active.title}</h1>
                  {active.duration_seconds && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDuration(active.duration_seconds)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    mut.mutate({
                      lesson_id: active.id,
                      completed: !completed.has(active.id),
                    })
                  }
                  className={
                    completed.has(active.id)
                      ? "inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary px-3 h-9 text-xs font-medium shrink-0"
                      : "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface hover:bg-hover px-3 h-9 text-xs font-medium shrink-0"
                  }
                >
                  {completed.has(active.id) ? (
                    <>
                      <Check className="size-3.5" /> Completed
                    </>
                  ) : (
                    <>Mark complete</>
                  )}
                </button>
              </div>
              {active.description && (
                <>
                  <div className="divider my-5" />
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {active.description}
                  </p>
                </>
              )}
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">Course</p>
            <h2 className="mt-1 font-semibold tracking-tight">{course.title}</h2>
            <p className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {modules.length} modules · {lessons.length} lessons
              </span>
              <span>{formatDuration(totalDuration)}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-surface-2 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
            </div>
          </Card>

          <Card className="overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border/70">
              <p className="text-xs font-medium">Curriculum</p>
            </div>
            <div className="overflow-y-auto no-scrollbar divide-y divide-border/60">
              {modules.map((m, mi) => {
                const mLessons = lessons.filter((l) => l.module_id === m.id);
                const done = mLessons.filter((l) => completed.has(l.id)).length;
                const hasActive = mLessons.some((l) => l.id === active?.id);
                const isOpen = openModules[m.id] ?? hasActive ?? true;
                return (
                  <div key={m.id}>
                    <button
                      onClick={() => setOpenModules((p) => ({ ...p, [m.id]: !isOpen }))}
                      className="w-full grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3 text-left hover:bg-hover/60 transition-colors"
                    >
                      <span className="text-[11px] text-muted-foreground tabular-nums w-5">
                        {String(mi + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {done}/{mLessons.length} complete
                        </p>
                      </div>
                      <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <ul className="pb-2">
                        {mLessons.map((l) => {
                          const isActive = active?.id === l.id;
                          const isDone = completed.has(l.id);
                          return (
                            <li key={l.id}>
                              <button
                                onClick={() => setActiveId(l.id)}
                                className={
                                  isActive
                                    ? "w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 pl-10 pr-4 py-2 text-sm bg-primary/10 text-foreground"
                                    : "w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 pl-10 pr-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-hover/60 transition-colors"
                                }
                              >
                                <span className="flex size-5 items-center justify-center shrink-0">
                                  {isDone ? (
                                    <Check className="size-3.5 text-primary" />
                                  ) : (
                                    <Play className={`size-3 ${isActive ? "text-primary fill-primary" : "opacity-60"}`} />
                                  )}
                                </span>
                                <span className="truncate text-left">{l.title}</span>
                                {l.duration_seconds && (
                                  <span className="text-[11px] tabular-nums opacity-70">
                                    {formatDuration(l.duration_seconds)}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                        {mLessons.length === 0 && (
                          <li className="pl-10 py-2 text-xs text-muted-foreground">No lessons</li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
              {modules.length === 0 && (
                <p className="p-5 text-xs text-muted-foreground">Curriculum coming soon.</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

function VideoEmbed({ url, lessonId }: { url: string; lessonId: string }) {
  const getSigned = useServerFn(getLessonVideoUrl);
  const [signed, setSigned] = useState<string | null>(null);
  const isHosted = url.startsWith("storage:");
  useEffect(() => {
    if (!isHosted) return;
    let cancelled = false;
    const load = () =>
      getSigned({ data: { lesson_id: lessonId } })
        .then((r: any) => { if (!cancelled) setSigned(r.url); })
        .catch(() => {});
    load();
    // Refresh the signed URL well before it expires (25 min).
    const t = setInterval(load, 25 * 60 * 1000);
    return () => { cancelled = true; clearInterval(t); };
  }, [isHosted, lessonId, getSigned]);

  if (isHosted) {
    if (!signed) {
      return (
        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
          Loading video…
        </div>
      );
    }
    return <ProtectedVideo src={signed} />;
  }

  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (yt)
    return (
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${yt[1]}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  if (vimeo)
    return (
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://player.vimeo.com/video/${vimeo[1]}`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  return <ProtectedVideo src={url} className="absolute inset-0 h-full w-full" />;
}

function ProtectedVideo({ src, className }: { src: string; className?: string }) {
  return (
    <video
      src={src}
      controls
      controlsList="nodownload noremoteplayback noplaybackrate"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      className={className ?? "absolute inset-0 h-full w-full select-none"}
    />
  );
}