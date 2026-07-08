import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminDeleteCourse,
  adminListCourses,
  adminUpsertCourse,
} from "@/lib/courses.functions";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ImageIcon, MoreHorizontal, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  component: CoursesAdmin,
});

function CoursesAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCourses);
  const upsert = useServerFn(adminUpsertCourse);
  const del = useServerFn(adminDeleteCourse);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: () => list(),
  });
  const [editing, setEditing] = useState<any | null>(null);

  const upsertMut = useMutation({
    mutationFn: (v: any) => upsert({ data: v }),
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Courses"
        description="Publish and organize the entire library."
        actions={
          <Button
            onClick={() =>
              setEditing({
                slug: "",
                title: "",
                summary: "",
                cover_url: "",
                sort_order: (data?.length ?? 0) * 10,
                published: false,
              })
            }
            className="rounded-lg h-9"
          >
            <Plus className="size-4 mr-1" /> New course
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground mt-4">Loading…</p>
      ) : (
        <div className="mt-2 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((c: any) => (
            <CourseCard
              key={c.id}
              course={c}
              onEdit={() => setEditing(c)}
              onDelete={() =>
                confirm(`Delete "${c.title}" and all its lessons?`) && delMut.mutate(c.id)
              }
            />
          ))}
          {/* Empty add tile */}
          <button
            onClick={() =>
              setEditing({
                slug: "",
                title: "",
                summary: "",
                cover_url: "",
                sort_order: (data?.length ?? 0) * 10,
                published: false,
              })
            }
            className="group aspect-[16/10] rounded-2xl border border-dashed border-border hover:border-primary/60 hover:bg-hover/40 transition-colors grid place-items-center text-muted-foreground hover:text-foreground"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="size-10 rounded-full border border-border grid place-items-center group-hover:border-primary/60">
                <Plus className="size-4" />
              </div>
              <span className="text-sm">New course</span>
            </div>
          </button>
        </div>
      )}

      <CourseDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={(v) => upsertMut.mutate(v)}
        saving={upsertMut.isPending}
      />
    </>
  );
}

function CourseCard({
  course,
  onEdit,
  onDelete,
}: {
  course: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div className="group relative rounded-2xl border border-border bg-surface overflow-hidden card-hover">
      <Link
        to="/admin/courses/$id"
        params={{ id: course.id }}
        className="block"
      >
        <div className="aspect-[16/10] bg-gradient-surface relative overflow-hidden">
          {course.cover_url ? (
            <img src={course.cover_url} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full grid place-items-center bg-gradient-subtle">
              <ImageIcon className="size-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span
              className={
                course.published
                  ? "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/70 backdrop-blur border border-primary/40 text-primary"
                  : "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/70 backdrop-blur border border-border text-muted-foreground"
              }
            >
              {course.published ? "Live" : "Draft"}
            </span>
          </div>
        </div>
        <div className="p-4">
          <p className="font-semibold tracking-tight truncate">{course.title || "Untitled"}</p>
          {course.summary ? (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
              {course.summary}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground/70 font-mono">/{course.slug}</p>
          )}
        </div>
      </Link>
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            setMenu((m) => !m);
          }}
          className="size-8 rounded-full bg-background/70 backdrop-blur border border-border grid place-items-center text-muted-foreground hover:text-foreground"
          aria-label="Course actions"
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 mt-1 w-36 rounded-lg border border-border bg-popover shadow-lg z-20 py-1 text-sm">
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-hover flex items-center gap-2"
                onClick={() => {
                  setMenu(false);
                  onEdit();
                }}
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                className="w-full text-left px-3 py-1.5 hover:bg-hover flex items-center gap-2 text-destructive"
                onClick={() => {
                  setMenu(false);
                  onDelete();
                }}
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CourseDialog({
  editing,
  onClose,
  onSave,
  saving,
}: {
  editing: any | null;
  onClose: () => void;
  onSave: (v: any) => void;
  saving: boolean;
}) {
  const [f, setF] = useState<any>(editing ?? {});
  useEffect(() => {
    if (editing) setF({ ...editing });
  }, [editing]);

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{f?.id ? "Edit course" : "Create course"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={f.title ?? ""}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="Enter a name"
              className="h-11 rounded-lg"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={f.summary ?? ""}
              onChange={(e) => setF({ ...f, summary: e.target.value })}
              placeholder="Enter a description"
              rows={3}
              className="rounded-lg"
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
            <span className="text-sm">Set course to hidden</span>
            <Switch
              checked={!f.published}
              onCheckedChange={(v) => setF({ ...f, published: !v })}
            />
          </div>

          <CoverUploader
            value={f.cover_url ?? ""}
            onChange={(url) => setF({ ...f, cover_url: url })}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() =>
              onSave({ ...f, sort_order: f.sort_order ?? 0 })
            }
            disabled={saving || !f.title}
            className="rounded-lg"
          >
            {saving ? "Saving…" : f?.id ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoverUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputId = "course-cover-upload";

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `covers/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("course-covers")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      // Signed URL (private bucket) valid for ~10 years
      const { data: signed, error: sErr } = await supabase.storage
        .from("course-covers")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (sErr || !signed) throw sErr ?? new Error("Signing failed");
      onChange(signed.signedUrl);
      toast.success("Cover uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4 flex items-center gap-4">
      <label
        htmlFor={inputId}
        className="w-32 aspect-[16/9] rounded-md border border-dashed border-border bg-background grid place-items-center overflow-hidden cursor-pointer hover:border-primary/60 hover:bg-hover/40 transition-colors"
      >
        {uploading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-5 text-muted-foreground/60" />
        )}
      </label>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Cover</p>
        <p className="text-xs text-muted-foreground">1500 × 840 px · JPG, PNG, WebP</p>
        <div className="mt-2 flex items-center gap-2">
          <label
            htmlFor={inputId}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border border-border bg-surface hover:bg-hover cursor-pointer"
          >
            <Upload className="size-3.5" /> {value ? "Change" : "Upload"}
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          )}
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function Field({
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