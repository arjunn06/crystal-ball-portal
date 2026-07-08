import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminDeleteLesson, adminDeleteModule, adminGetCourseStructure, adminUpsertLesson, adminUpsertModule } from "@/lib/courses.functions";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatDuration } from "@/components/section-shell";
import { Film, Pencil, Plus, Trash2, GripVertical, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/courses/$id")({
  component: CourseStructurePage,
});

function CourseStructurePage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(adminGetCourseStructure);
  const upsertModule = useServerFn(adminUpsertModule);
  const delModule = useServerFn(adminDeleteModule);
  const upsertLesson = useServerFn(adminUpsertLesson);
  const delLesson = useServerFn(adminDeleteLesson);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "course", id], queryFn: () => get({ data: { course_id: id } }) });

  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "course", id] });
  const onErr = (e: any) => toast.error(e.message);

  const upModMut = useMutation({ mutationFn: (v: any) => upsertModule({ data: v }), onSuccess: () => { toast.success("Saved"); setEditingModule(null); refresh(); }, onError: onErr });
  const delModMut = useMutation({ mutationFn: (mid: string) => delModule({ data: { id: mid } }), onSuccess: () => { toast.success("Removed"); refresh(); }, onError: onErr });
  const upLessonMut = useMutation({ mutationFn: (v: any) => upsertLesson({ data: v }), onSuccess: () => { toast.success("Saved"); setEditingLesson(null); refresh(); }, onError: onErr });
  const delLessonMut = useMutation({ mutationFn: (lid: string) => delLesson({ data: { id: lid } }), onSuccess: () => { toast.success("Removed"); refresh(); }, onError: onErr });

  if (isLoading) return <p className="label-mono text-muted-foreground">Loading curriculum…</p>;
  if (!data?.course) return <p>Not found.</p>;
  const totalLessons = data.lessons.length;
  const totalDuration = data.lessons.reduce((s: number, l: any) => s + (l.duration_seconds ?? 0), 0);
  const isRed = data.course.required_pill === "red";

  return (
    <div className="space-y-10">
      {/* HERO */}
      <section className={`relative overflow-hidden rounded-3xl border border-border/70 ${isRed ? "bg-aurora-crimson" : "bg-aurora-steel"}`}>
        {data.course.cover_url && (
          <img src={data.course.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
        <div className="relative p-8 md:p-10">
          <Link to="/admin/courses" className="label-mono text-muted-foreground hover:text-foreground transition-colors">← ALL COURSES</Link>
          <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className={`label-mono ${isRed ? "text-red-pill" : "text-blue-pill"} flex items-center gap-3`}>
                <span className={`inline-block h-px w-6 ${isRed ? "bg-red-pill/60" : "bg-blue-pill/60"}`} />
                CURRICULUM · {data.course.required_pill.toUpperCase()} PILL
              </p>
              <h1 className="mt-4 font-display text-4xl md:text-5xl font-semibold tracking-tight">{data.course.title}</h1>
              <p className="mt-3 label-mono text-muted-foreground">
                {data.modules.length} MODULES · {totalLessons} LESSONS · {formatDuration(totalDuration)}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setEditingModule({ course_id: id, title: "", summary: "", sort_order: (data.modules.length) * 10 })}
              className="rounded-full px-6"
            >
              <Plus className="size-4 mr-1" /> Add module
            </Button>
          </div>
        </div>
      </section>

      {editingModule && (
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="label-mono text-platinum">{editingModule.id ? "EDIT MODULE" : "NEW MODULE"}</p>
            <button onClick={() => setEditingModule(null)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
          </div>
          <div className="hairline" />
          <div className="grid gap-4 md:grid-cols-[1fr_140px]">
            <div className="space-y-2">
              <Label className="label-mono text-muted-foreground">Title</Label>
              <Input value={editingModule.title} onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })} placeholder="Foundations of ICT" />
            </div>
            <div className="space-y-2">
              <Label className="label-mono text-muted-foreground">Sort order</Label>
              <Input type="number" value={editingModule.sort_order} onChange={(e) => setEditingModule({ ...editingModule, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="label-mono text-muted-foreground">Summary</Label>
            <Textarea value={editingModule.summary ?? ""} onChange={(e) => setEditingModule({ ...editingModule, summary: e.target.value })} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingModule(null)}>Cancel</Button>
            <Button onClick={() => upModMut.mutate(editingModule)}>Save module</Button>
          </div>
        </div>
      )}

      {/* MODULES */}
      <div className="space-y-6">
        {data.modules.map((m: any, mi: number) => {
          const mLessons = data.lessons.filter((l: any) => l.module_id === m.id);
          const mDuration = mLessons.reduce((s: number, l: any) => s + (l.duration_seconds ?? 0), 0);
          return (
            <section key={m.id} className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm overflow-hidden">
              {/* Module header */}
              <header className="relative p-6 border-b border-border/60">
                <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="size-4 text-muted-foreground/40" />
                    <span className="label-mono text-platinum opacity-70">{String(mi + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="label-mono text-muted-foreground">MODULE</p>
                    <h2 className="mt-1 font-display text-xl md:text-2xl font-semibold tracking-tight">{m.title}</h2>
                    {m.summary && <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>}
                    <p className="mt-2 label-mono text-muted-foreground">{mLessons.length} LESSONS · {formatDuration(mDuration)}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 shrink-0">
                    <IconAction onClick={() => setEditingLesson({ module_id: m.id, title: "", description: "", video_url: "", duration_seconds: null, sort_order: mLessons.length * 10 })}>
                      <Plus className="size-3.5" /> LESSON
                    </IconAction>
                    <IconAction onClick={() => setEditingModule(m)}>
                      <Pencil className="size-3.5" /> EDIT
                    </IconAction>
                    <IconAction tone="destructive" onClick={() => confirm("Delete module and all lessons?") && delModMut.mutate(m.id)}>
                      <Trash2 className="size-3.5" /> DELETE
                    </IconAction>
                  </div>
                </div>
              </header>

              {/* Lessons */}
              <ul className="divide-y divide-border/40">
                {mLessons.map((l: any, li: number) => (
                  <li key={l.id} className="grid grid-cols-[auto_auto_1fr_auto_auto] items-center gap-4 px-6 py-3.5 hover:bg-muted/20 transition-colors">
                    <GripVertical className="size-4 text-muted-foreground/30" />
                    <span className="label-mono text-muted-foreground w-8">{String(mi + 1).padStart(2, "0")}.{String(li + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate flex items-center gap-2">
                        {l.video_url && <Film className="size-3.5 text-blue-pill shrink-0" />}
                        {l.title}
                      </p>
                      {l.video_url && <p className="text-[11px] text-muted-foreground/70 font-mono truncate max-w-md">{l.video_url}</p>}
                    </div>
                    <span className="label-mono text-muted-foreground whitespace-nowrap">{formatDuration(l.duration_seconds)}</span>
                    <div className="flex gap-1.5">
                      <IconAction onClick={() => setEditingLesson(l)}><Pencil className="size-3.5" /></IconAction>
                      <IconAction tone="destructive" onClick={() => confirm("Delete lesson?") && delLessonMut.mutate(l.id)}><Trash2 className="size-3.5" /></IconAction>
                    </div>
                  </li>
                ))}
                {mLessons.length === 0 && (
                  <li className="px-6 py-8 text-center">
                    <p className="label-mono text-muted-foreground">NO LESSONS IN THIS MODULE</p>
                    <button
                      onClick={() => setEditingLesson({ module_id: m.id, title: "", description: "", video_url: "", duration_seconds: null, sort_order: 0 })}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      + Add the first lesson
                    </button>
                  </li>
                )}
              </ul>
            </section>
          );
        })}
        {data.modules.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-12 text-center">
            <p className="label-mono text-muted-foreground">EMPTY COURSE</p>
            <p className="mt-3 font-display text-xl">No modules yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Start by adding the first module above.</p>
          </div>
        )}
      </div>

      {/* Lesson modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl border border-border bg-card p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="label-mono text-platinum">{editingLesson.id ? "EDIT LESSON" : "NEW LESSON"}</p>
              <button onClick={() => setEditingLesson(null)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
            </div>
            <div className="hairline" />
            <div className="space-y-2">
              <Label className="label-mono text-muted-foreground">Title</Label>
              <Input value={editingLesson.title} onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="label-mono text-muted-foreground">Description</Label>
              <Textarea value={editingLesson.description ?? ""} onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="label-mono text-muted-foreground">Video URL (YouTube / Vimeo / mp4)</Label>
              <Input value={editingLesson.video_url ?? ""} onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="label-mono text-muted-foreground">Duration (sec)</Label>
                <Input type="number" value={editingLesson.duration_seconds ?? ""} onChange={(e) => setEditingLesson({ ...editingLesson, duration_seconds: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="space-y-2">
                <Label className="label-mono text-muted-foreground">Sort order</Label>
                <Input type="number" value={editingLesson.sort_order} onChange={(e) => setEditingLesson({ ...editingLesson, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingLesson(null)}>Cancel</Button>
              <Button onClick={() => upLessonMut.mutate(editingLesson)}>Save lesson</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconAction({ children, onClick, tone }: { children: React.ReactNode; onClick: () => void; tone?: "destructive" }) {
  const cls = tone === "destructive"
    ? "border-destructive/60 text-destructive hover:bg-destructive/10"
    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground";
  return (
    <button onClick={onClick} className={`label-mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors ${cls}`}>
      {children}
    </button>
  );
}