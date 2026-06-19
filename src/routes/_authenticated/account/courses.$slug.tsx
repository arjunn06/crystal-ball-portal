import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCourseDetail, markLessonComplete } from "@/lib/courses.functions";
import { useState } from "react";
import { Check } from "lucide-react";

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

  const mut = useMutation({
    mutationFn: (vars: { lesson_id: string; completed: boolean }) => markFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["course", slug] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return null;

  const { course, modules, lessons, completed } = data;
  const activeLesson = lessons.find((l: any) => l.id === activeLessonId) ?? lessons[0];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/account/courses" className="label-mono text-muted-foreground hover:text-foreground">← ALL COURSES</Link>
        <h1 className="mt-3 font-display text-3xl font-semibold">{course.title}</h1>
        {course.summary && <p className="mt-1 text-muted-foreground">{course.summary}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {activeLesson?.video_url ? (
            <VideoEmbed url={activeLesson.video_url} />
          ) : (
            <div className="aspect-video flex items-center justify-center text-muted-foreground">No video yet</div>
          )}
          {activeLesson && (
            <div className="p-5 space-y-3">
              <h2 className="font-display text-xl">{activeLesson.title}</h2>
              {activeLesson.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeLesson.description}</p>}
              <button
                onClick={() => mut.mutate({ lesson_id: activeLesson.id, completed: !(completed as Set<string>).has(activeLesson.id) })}
                className={`label-mono rounded-md px-3 py-2 border ${(completed as Set<string>).has(activeLesson.id) ? "bg-blue-pill/20 border-blue-pill text-blue-pill" : "border-border hover:bg-muted/30"}`}
              >
                {(completed as Set<string>).has(activeLesson.id) ? "✓ COMPLETED" : "MARK COMPLETE"}
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {modules.map((m: any) => {
            const mLessons = lessons.filter((l: any) => l.module_id === m.id);
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-3 border-b border-border">
                  <p className="label-mono text-muted-foreground">MODULE</p>
                  <p className="font-semibold">{m.title}</p>
                </div>
                <ul>
                  {mLessons.map((l: any) => (
                    <li key={l.id}>
                      <button
                        onClick={() => setActiveLessonId(l.id)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between border-l-2 ${activeLesson?.id === l.id ? "border-primary bg-muted/30" : "border-transparent hover:bg-muted/20"}`}
                      >
                        <span className="truncate">{l.title}</span>
                        {(completed as Set<string>).has(l.id) && <Check className="size-4 text-blue-pill shrink-0" />}
                      </button>
                    </li>
                  ))}
                  {mLessons.length === 0 && <li className="px-3 py-2 text-xs text-muted-foreground">No lessons yet</li>}
                </ul>
              </div>
            );
          })}
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