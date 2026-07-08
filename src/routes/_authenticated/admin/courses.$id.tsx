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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDuration } from "@/components/app/sidebar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Film,
  Link2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

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
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

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
    onSuccess: (row: any) => {
      toast.success("Saved");
      if (row?.id) setSelectedLessonId(row.id);
      refresh();
    },
    onError: onErr,
  });
  const delLesMut = useMutation({
    mutationFn: (lid: string) => delLesson({ data: { id: lid } }),
    onSuccess: () => {
      toast.success("Removed");
      setSelectedLessonId(null);
      refresh();
    },
    onError: onErr,
  });

  const selectedLesson = useMemo(
    () => data?.lessons.find((l: any) => l.id === selectedLessonId) ?? null,
    [data, selectedLessonId],
  );

  // Auto-select first lesson when data loads
  useEffect(() => {
    if (!data) return;
    // open all modules by default
    setOpenModules((cur) => {
      const next = { ...cur };
      for (const m of data.modules) if (next[m.id] === undefined) next[m.id] = true;
      return next;
    });
    if (!selectedLessonId && data.lessons.length > 0) {
      setSelectedLessonId(data.lessons[0].id);
    }
  }, [data, selectedLessonId]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.course) return <p>Not found.</p>;

  const addLesson = (moduleId: string, sortOrder: number) => {
    upLesMut.mutate({
      module_id: moduleId,
      title: "New lesson",
      description: "",
      video_url: "",
      duration_seconds: null,
      sort_order: sortOrder,
    });
  };

  return (
    <div className="-mx-6 md:-mx-10 -my-8 md:-my-10 min-h-[calc(100vh-0px)]">
      {/* Top back bar */}
      <div className="h-12 border-b border-border/70 flex items-center px-4 md:px-6">
        <Link
          to="/admin/courses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back
        </Link>
        <div className="ml-4 text-sm font-medium truncate">{data.course.title}</div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-surface-2 border border-border">
            Saved
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] min-h-[calc(100vh-3rem)]">
        {/* Left: chapters */}
        <aside className="border-r border-border/70 bg-surface/40 p-4 space-y-3 overflow-y-auto">
          {data.modules.map((m: any, mi: number) => {
            const mLessons = data.lessons.filter((l: any) => l.module_id === m.id);
            const open = openModules[m.id] ?? true;
            return (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-surface overflow-hidden"
              >
                <div className="flex items-center gap-1 px-2 py-2">
                  <button
                    onClick={() =>
                      setOpenModules((o) => ({ ...o, [m.id]: !open }))
                    }
                    className="size-6 grid place-items-center text-muted-foreground hover:text-foreground"
                    aria-label="Toggle"
                  >
                    {open ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingModule(m)}
                    className="flex-1 text-left text-sm font-medium truncate hover:text-primary"
                  >
                    {m.title || `Chapter ${mi + 1}`}
                  </button>
                  <button
                    onClick={() =>
                      addLesson(m.id, mLessons.length * 10)
                    }
                    className="size-7 grid place-items-center rounded-md hover:bg-hover text-muted-foreground hover:text-foreground"
                    aria-label="Add lesson"
                  >
                    <Plus className="size-4" />
                  </button>
                  <button
                    onClick={() =>
                      confirm("Delete chapter and all lessons?") && delModMut.mutate(m.id)
                    }
                    className="size-7 grid place-items-center rounded-md hover:bg-hover text-muted-foreground hover:text-destructive"
                    aria-label="Delete chapter"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {open && (
                  <div className="px-2 pb-2 space-y-1">
                    {mLessons.map((l: any) => {
                      const active = l.id === selectedLessonId;
                      return (
                        <button
                          key={l.id}
                          onClick={() => setSelectedLessonId(l.id)}
                          className={
                            "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors " +
                            (active
                              ? "bg-hover ring-1 ring-primary/40"
                              : "hover:bg-hover/60")
                          }
                        >
                          <div className="size-10 rounded-md bg-surface-2 border border-border grid place-items-center shrink-0">
                            <Video className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate">{l.title || "Untitled"}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {l.video_url ? "Multimedia" : "Empty"}
                              {l.duration_seconds
                                ? ` · ${formatDuration(l.duration_seconds)}`
                                : ""}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirm("Delete lesson?") && delLesMut.mutate(l.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 size-6 grid place-items-center text-muted-foreground hover:text-destructive"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </button>
                      );
                    })}
                    {mLessons.length === 0 && (
                      <button
                        onClick={() => addLesson(m.id, 0)}
                        className="w-full py-3 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-lg"
                      >
                        + Add first lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() =>
              setEditingModule({
                course_id: id,
                title: `Chapter ${data.modules.length + 1}`,
                summary: "",
                sort_order: data.modules.length * 10,
              })
            }
            className="w-full rounded-xl border border-dashed border-border hover:border-primary/60 hover:bg-hover/40 transition-colors py-4 text-sm text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2"
          >
            <div className="size-6 rounded-full border border-border grid place-items-center">
              <Plus className="size-3.5" />
            </div>
            Add new chapter
          </button>
        </aside>

        {/* Right: lesson editor */}
        <section className="p-6 md:p-10 overflow-y-auto">
          {selectedLesson ? (
            <LessonEditor
              key={selectedLesson.id}
              lesson={selectedLesson}
              module={data.modules.find((m: any) => m.id === selectedLesson.module_id)}
              onSave={(v) => upLesMut.mutate(v)}
              onDelete={() =>
                confirm("Delete lesson?") && delLesMut.mutate(selectedLesson.id)
              }
              saving={upLesMut.isPending}
            />
          ) : (
            <div className="h-full min-h-[60vh] grid place-items-center text-center">
              <div className="max-w-sm">
                <div className="mx-auto size-14 rounded-full border border-border grid place-items-center text-muted-foreground mb-4">
                  <Film className="size-6" />
                </div>
                <p className="font-medium">Select a lesson</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a lesson on the left, or add a new chapter to get started.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Chapter dialog */}
      <Dialog
        open={!!editingModule}
        onOpenChange={(o) => !o && setEditingModule(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingModule?.id ? "Edit chapter" : "Create chapter"}
            </DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4">
              <FieldLabel label="Name">
                <Input
                  value={editingModule.title}
                  onChange={(e) =>
                    setEditingModule({ ...editingModule, title: e.target.value })
                  }
                  className="h-11 rounded-lg"
                  placeholder="Enter a name"
                />
              </FieldLabel>
              <FieldLabel label="Description">
                <Textarea
                  value={editingModule.summary ?? ""}
                  onChange={(e) =>
                    setEditingModule({ ...editingModule, summary: e.target.value })
                  }
                  rows={3}
                  className="rounded-lg"
                  placeholder="Enter a description"
                />
              </FieldLabel>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingModule(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => upModMut.mutate(editingModule)}
              disabled={!editingModule?.title}
              className="rounded-lg"
            >
              {editingModule?.id ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LessonEditor({
  lesson,
  module,
  onSave,
  onDelete,
  saving,
}: {
  lesson: any;
  module: any;
  onSave: (v: any) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState<any>(lesson);
  useEffect(() => setF(lesson), [lesson.id]);

  const dirty =
    f.title !== lesson.title ||
    (f.description ?? "") !== (lesson.description ?? "") ||
    (f.video_url ?? "") !== (lesson.video_url ?? "") ||
    (f.duration_seconds ?? null) !== (lesson.duration_seconds ?? null);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{module?.title ?? "Chapter"}</p>
          <input
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            className="mt-1 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none focus:ring-0 border-0"
            placeholder="Lesson title"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4 mr-1" /> Delete
          </Button>
          <Button
            onClick={() => onSave(f)}
            disabled={!dirty || saving}
            className="rounded-lg"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Video area */}
      <div className="mt-6 rounded-2xl border border-border bg-surface/60 bg-gradient-subtle min-h-[360px] p-6 md:p-10">
        {f.video_url ? (
          <div className="space-y-4">
            <div className="aspect-video rounded-xl border border-border bg-black overflow-hidden">
              {/youtube\.com|youtu\.be|vimeo\.com/.test(f.video_url) ? (
                <iframe
                  src={toEmbed(f.video_url)}
                  className="size-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <video src={f.video_url} controls className="size-full" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono truncate">
              <Film className="size-3.5 text-primary" /> {f.video_url}
              <button
                onClick={() => setF({ ...f, video_url: "" })}
                className="ml-auto text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <p className="text-lg font-semibold">Add a video to this lesson</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a YouTube, Vimeo, or direct .mp4 / .mov / .webm link.
            </p>
            <div className="mt-6 w-full max-w-md space-y-2">
              <UploadRow
                icon={<Upload className="size-4" />}
                title="Upload video"
                subtitle="Bring your own .mov, .mp4, etc."
                onClick={() => {
                  const url = prompt("Paste a direct video URL (.mp4 / .mov / .webm)");
                  if (url) setF({ ...f, video_url: url });
                }}
              />
              <UploadRow
                icon={<Link2 className="size-4" />}
                title="Embed video"
                subtitle="Paste a YouTube or Vimeo link"
                onClick={() => {
                  const url = prompt("Paste a YouTube or Vimeo URL");
                  if (url) setF({ ...f, video_url: url });
                }}
              />
              <UploadRow
                icon={<Clipboard className="size-4" />}
                title="Paste video"
                subtitle="Copy a video from another lesson"
                onClick={async () => {
                  try {
                    const t = await navigator.clipboard.readText();
                    if (t) setF({ ...f, video_url: t });
                  } catch {
                    /* ignore */
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Description + meta */}
      <div className="mt-8 space-y-6">
        <FieldLabel label="Description">
          <Textarea
            value={f.description ?? ""}
            onChange={(e) => setF({ ...f, description: e.target.value })}
            rows={4}
            placeholder="What does this lesson cover?"
            className="rounded-lg"
          />
        </FieldLabel>
        <div className="grid grid-cols-2 gap-4">
          <FieldLabel label="Duration (seconds)">
            <Input
              type="number"
              value={f.duration_seconds ?? ""}
              onChange={(e) =>
                setF({
                  ...f,
                  duration_seconds: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="h-10 rounded-lg"
              placeholder="e.g. 540"
            />
          </FieldLabel>
          <FieldLabel label="Sort order">
            <Input
              type="number"
              value={f.sort_order ?? 0}
              onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })}
              className="h-10 rounded-lg"
            />
          </FieldLabel>
        </div>
      </div>
    </div>
  );
}

function UploadRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-border bg-surface hover:bg-hover transition-colors px-4 py-3 flex items-start gap-3"
    >
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </button>
  );
}

function toEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return url;
  }
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
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}