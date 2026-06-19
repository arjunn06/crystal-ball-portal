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

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data?.course) return <p>Not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/courses" className="label-mono text-muted-foreground hover:text-foreground">← ALL COURSES</Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">{data.course.title}</h1>
      </div>

      <Button onClick={() => setEditingModule({ course_id: id, title: "", summary: "", sort_order: (data.modules.length) * 10 })}>
        Add module
      </Button>

      {editingModule && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <Label>Title</Label><Input value={editingModule.title} onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })} />
          <Label>Summary</Label><Textarea value={editingModule.summary ?? ""} onChange={(e) => setEditingModule({ ...editingModule, summary: e.target.value })} rows={2} />
          <Label>Sort order</Label><Input type="number" value={editingModule.sort_order} onChange={(e) => setEditingModule({ ...editingModule, sort_order: Number(e.target.value) })} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingModule(null)}>Cancel</Button>
            <Button onClick={() => upModMut.mutate(editingModule)}>Save module</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {data.modules.map((m: any) => {
          const mLessons = data.lessons.filter((l: any) => l.module_id === m.id);
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold">{m.title}</p>
                  {m.summary && <p className="text-xs text-muted-foreground">{m.summary}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditingLesson({ module_id: m.id, title: "", description: "", video_url: "", duration_seconds: null, sort_order: mLessons.length * 10 })} className="label-mono px-2 py-1 rounded border border-border hover:bg-muted/30">+ LESSON</button>
                  <button onClick={() => setEditingModule(m)} className="label-mono px-2 py-1 rounded border border-border hover:bg-muted/30">EDIT</button>
                  <button onClick={() => confirm("Delete module and all lessons?") && delModMut.mutate(m.id)} className="label-mono px-2 py-1 rounded border border-destructive text-destructive">DELETE</button>
                </div>
              </div>
              <ul className="mt-3 space-y-1">
                {mLessons.map((l: any) => (
                  <li key={l.id} className="flex justify-between items-center text-sm border-t border-border/40 py-2">
                    <div>
                      <p>{l.title}</p>
                      {l.video_url && <p className="text-xs text-muted-foreground font-mono truncate max-w-[400px]">{l.video_url}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingLesson(l)} className="label-mono text-xs hover:underline">EDIT</button>
                      <button onClick={() => confirm("Delete lesson?") && delLessonMut.mutate(l.id)} className="label-mono text-xs text-destructive hover:underline">DELETE</button>
                    </div>
                  </li>
                ))}
                {mLessons.length === 0 && <li className="text-xs text-muted-foreground py-2">No lessons yet.</li>}
              </ul>
            </div>
          );
        })}
        {data.modules.length === 0 && <p className="text-muted-foreground">No modules yet.</p>}
      </div>

      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-xl border border-border bg-card p-6 max-w-lg w-full space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl">{editingLesson.id ? "Edit lesson" : "New lesson"}</h3>
            <Label>Title</Label><Input value={editingLesson.title} onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })} />
            <Label>Description</Label><Textarea value={editingLesson.description ?? ""} onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })} rows={3} />
            <Label>Video URL (YouTube / Vimeo / mp4)</Label><Input value={editingLesson.video_url ?? ""} onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration (sec)</Label><Input type="number" value={editingLesson.duration_seconds ?? ""} onChange={(e) => setEditingLesson({ ...editingLesson, duration_seconds: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Sort order</Label><Input type="number" value={editingLesson.sort_order} onChange={(e) => setEditingLesson({ ...editingLesson, sort_order: Number(e.target.value) })} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingLesson(null)}>Cancel</Button>
              <Button onClick={() => upLessonMut.mutate(editingLesson)}>Save lesson</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}