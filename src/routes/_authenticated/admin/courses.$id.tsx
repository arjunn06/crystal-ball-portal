import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminDeleteLesson,
  adminDeleteModule,
  adminGetCourse,
  adminUpsertLesson,
  adminUpsertModule,
} from "@/lib/courses.functions";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Card, formatDuration } from "@/components/app/sidebar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Film, Pencil, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/courses/$id")({
  component: CourseStructure,
});

function CourseStructure() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(adminGetCourse);
  const upsertModule = useServerFn(adminUpsertModule);
  const delModule = useServerFn(adminDeleteModule);
  const upsertLesson = useServerFn(adminUpsertLesson);
  const delLesson = useServerFn(adminDeleteLesson);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "course", id],
    queryFn: () => get({ data: { course_id: id } }),
  });

  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "course", id] });
  const onErr = (e: any) => toast.error(e.message);

  const upModMut = useMutation({
    mutationFn: (v: any) => upsertModule({ data: v }),
    onSuccess: () => {
      toast.success("Saved");
      setEditingModule(null);
      refresh();
    },
    onError: onErr,
  });
  const delModMut = useMutation({
    mutationFn: (mid: string) => delModule({ data: { id: mid } }),
    onSuccess: () => {
      toast.success("Removed");
      refresh();
    },
    onError: onErr,
  });
  const upLesMut = useMutation({
    mutationFn: (v: any) => upsertLesson({ data: v }),
    onSuccess: () => {
      toast.success("Saved");
      setEditingLesson(null);
      refresh();
    },
    onError: onErr,
  });
  const delLesMut = useMutation({
    mutationFn: (lid: string) => delLesson({ data: { id: lid } }),
    onSuccess: () => {
      toast.success("Removed");
      refresh();
    },
    onError: onErr,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.course) return <p>Not found.</p>;

  const totalLessons = data.lessons.length;
  const totalDuration = data.lessons.reduce(
    (s: number, l: any) => s + (l.duration_seconds ?? 0),
    0,
  );

  return (
    <>
      <Link
        to="/admin/courses"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="size-3.5" /> All courses
      </Link>

      <PageHeader
        title={data.course.title}
        description={`${data.modules.length} modules · ${totalLessons} lessons · ${formatDuration(totalDuration)}`}
        actions={
          <Button
            onClick={() =>
              setEditingModule({
                course_id: id,
                title: "",
                summary: "",
                sort_order: data.modules.length * 10,
              })
            }
            className="rounded-lg h-9"
          >
            <Plus className="size-4 mr-1" /> Add module
          </Button>
        }
      />

      {editingModule && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">
              {editingModule.id ? "Edit module" : "New module"}
            </p>
            <button
              onClick={() => setEditingModule(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_140px]">
            <FieldLabel label="Title">
              <Input
                value={editingModule.title}
                onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                className="bg-surface border-border h-10 rounded-lg"
              />
            </FieldLabel>
            <FieldLabel label="Sort order">
              <Input
                type="number"
                value={editingModule.sort_order}
                onChange={(e) =>
                  setEditingModule({ ...editingModule, sort_order: Number(e.target.value) })
                }
                className="bg-surface border-border h-10 rounded-lg"
              />
            </FieldLabel>
          </div>
          <FieldLabel label="Summary" className="mt-3">
            <Textarea
              value={editingModule.summary ?? ""}
              onChange={(e) => setEditingModule({ ...editingModule, summary: e.target.value })}
              rows={2}
              className="bg-surface border-border rounded-lg"
            />
          </FieldLabel>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingModule(null)}>Cancel</Button>
            <Button onClick={() => upModMut.mutate(editingModule)} className="rounded-lg h-10">
              Save
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {data.modules.map((m: any, mi: number) => {
          const mLessons = data.lessons.filter((l: any) => l.module_id === m.id);
          const mDur = mLessons.reduce(
            (s: number, l: any) => s + (l.duration_seconds ?? 0),
            0,
          );
          return (
            <Card key={m.id} className="overflow-hidden">
              <header className="p-5 border-b border-border/60 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    Module {String(mi + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 font-semibold tracking-tight">{m.title}</h2>
                  {m.summary && (
                    <p className="mt-1 text-xs text-muted-foreground">{m.summary}</p>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {mLessons.length} lessons · {formatDuration(mDur)}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
                  <IconBtn
                    onClick={() =>
                      setEditingLesson({
                        module_id: m.id,
                        title: "",
                        description: "",
                        video_url: "",
                        duration_seconds: null,
                        sort_order: mLessons.length * 10,
                      })
                    }
                  >
                    <Plus className="size-3.5" /> Lesson
                  </IconBtn>
                  <IconBtn onClick={() => setEditingModule(m)}>
                    <Pencil className="size-3.5" />
                  </IconBtn>
                  <IconBtn
                    tone="destructive"
                    onClick={() =>
                      confirm("Delete module and all lessons?") && delModMut.mutate(m.id)
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </IconBtn>
                </div>
              </header>
              <ul className="divide-y divide-border/50">
                {mLessons.map((l: any, li: number) => (
                  <li
                    key={l.id}
                    className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3 hover:bg-hover/40"
                  >
                    <span className="text-[11px] text-muted-foreground tabular-nums w-10">
                      {String(mi + 1).padStart(2, "0")}.{String(li + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm truncate flex items-center gap-2">
                        {l.video_url && (
                          <Film className="size-3.5 text-primary shrink-0" />
                        )}
                        {l.title}
                      </p>
                      {l.video_url && (
                        <p className="text-[11px] text-muted-foreground/70 font-mono truncate max-w-md">
                          {l.video_url}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDuration(l.duration_seconds)}
                    </span>
                    <div className="flex gap-1">
                      <IconBtn onClick={() => setEditingLesson(l)}>
                        <Pencil className="size-3.5" />
                      </IconBtn>
                      <IconBtn
                        tone="destructive"
                        onClick={() =>
                          confirm("Delete lesson?") && delLesMut.mutate(l.id)
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </IconBtn>
                    </div>
                  </li>
                ))}
                {mLessons.length === 0 && (
                  <li className="px-5 py-6 text-center text-xs text-muted-foreground">
                    No lessons in this module.
                  </li>
                )}
              </ul>
            </Card>
          );
        })}
        {data.modules.length === 0 && (
          <Card className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No modules yet. Add the first one above.
            </p>
          </Card>
        )}
      </div>

      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-6">
          <Card className="p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">
                {editingLesson.id ? "Edit lesson" : "New lesson"}
              </p>
              <button
                onClick={() => setEditingLesson(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <FieldLabel label="Title">
              <Input
                value={editingLesson.title}
                onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                className="bg-surface border-border h-10 rounded-lg"
              />
            </FieldLabel>
            <FieldLabel label="Description" className="mt-3">
              <Textarea
                value={editingLesson.description ?? ""}
                onChange={(e) =>
                  setEditingLesson({ ...editingLesson, description: e.target.value })
                }
                rows={3}
                className="bg-surface border-border rounded-lg"
              />
            </FieldLabel>
            <FieldLabel label="Video URL (YouTube / Vimeo / mp4)" className="mt-3">
              <Input
                value={editingLesson.video_url ?? ""}
                onChange={(e) =>
                  setEditingLesson({ ...editingLesson, video_url: e.target.value })
                }
                placeholder="https://youtube.com/watch?v=…"
                className="bg-surface border-border h-10 rounded-lg"
              />
            </FieldLabel>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <FieldLabel label="Duration (sec)">
                <Input
                  type="number"
                  value={editingLesson.duration_seconds ?? ""}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      duration_seconds: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="bg-surface border-border h-10 rounded-lg"
                />
              </FieldLabel>
              <FieldLabel label="Sort order">
                <Input
                  type="number"
                  value={editingLesson.sort_order}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      sort_order: Number(e.target.value),
                    })
                  }
                  className="bg-surface border-border h-10 rounded-lg"
                />
              </FieldLabel>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingLesson(null)}>Cancel</Button>
              <Button
                onClick={() => upLesMut.mutate(editingLesson)}
                className="rounded-lg h-10"
              >
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function IconBtn({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "destructive";
}) {
  const cls =
    tone === "destructive"
      ? "border-destructive/40 text-destructive hover:bg-destructive/10"
      : "border-border text-muted-foreground hover:text-foreground hover:bg-hover";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}

function FieldLabel({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}