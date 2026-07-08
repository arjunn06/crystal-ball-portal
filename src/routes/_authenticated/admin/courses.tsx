import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminDeleteCourse,
  adminListCourses,
  adminUpsertCourse,
} from "@/lib/courses.functions";
import { toast } from "sonner";
import { useState } from "react";
import { PageHeader, Card } from "@/components/app/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";

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

      {editing && (
        <CourseForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(v) => upsertMut.mutate(v)}
          saving={upsertMut.isPending}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground mt-4">Loading…</p>
      ) : (
        <div className="space-y-3 mt-4">
          {(data ?? []).map((c: any) => (
            <Card
              key={c.id}
              className="p-4 flex items-center justify-between gap-4 card-hover"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-12 rounded-lg bg-surface-2 border border-border overflow-hidden shrink-0 grid place-items-center">
                  {c.cover_url ? (
                    <img src={c.cover_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-2 rounded-full bg-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{c.title}</p>
                    <span
                      className={
                        c.published
                          ? "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30"
                          : "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground border border-border"
                      }
                    >
                      {c.published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">/{c.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  to="/admin/courses/$id"
                  params={{ id: c.id }}
                  className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface hover:bg-hover inline-flex items-center gap-1"
                >
                  Curriculum <ArrowRight className="size-3" />
                </Link>
                <button
                  onClick={() => setEditing(c)}
                  className="text-xs px-2 py-1.5 rounded-md border border-border bg-surface hover:bg-hover"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() =>
                    confirm(`Delete "${c.title}" and all its lessons?`) && delMut.mutate(c.id)
                  }
                  className="text-xs px-2 py-1.5 rounded-md border border-destructive/40 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </Card>
          ))}
          {(data ?? []).length === 0 && (
            <Card className="p-10 text-center">
              <p className="text-sm text-muted-foreground">No courses yet. Add one above.</p>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function CourseForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: any;
  onSave: (v: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState({ ...initial });
  return (
    <Card className="p-6 mb-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{f.id ? "Edit course" : "New course"}</p>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Field label="Title">
          <Input
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            className="bg-surface border-border h-10 rounded-lg"
          />
        </Field>
        <Field label="Slug">
          <Input
            value={f.slug}
            onChange={(e) => setF({ ...f, slug: e.target.value })}
            placeholder="ict-foundations"
            className="bg-surface border-border h-10 rounded-lg font-mono"
          />
        </Field>
      </div>
      <Field label="Summary" className="mt-3">
        <Textarea
          value={f.summary ?? ""}
          onChange={(e) => setF({ ...f, summary: e.target.value })}
          rows={2}
          className="bg-surface border-border rounded-lg"
        />
      </Field>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Cover URL">
          <Input
            value={f.cover_url ?? ""}
            onChange={(e) => setF({ ...f, cover_url: e.target.value })}
            className="bg-surface border-border h-10 rounded-lg"
          />
        </Field>
        <Field label="Sort order">
          <Input
            type="number"
            value={f.sort_order}
            onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })}
            className="bg-surface border-border h-10 rounded-lg"
          />
        </Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={f.published}
          onChange={(e) => setF({ ...f, published: e.target.checked })}
        />
        Published (visible to members)
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSave(f)}
          disabled={saving}
          className="rounded-lg h-10"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
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
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}