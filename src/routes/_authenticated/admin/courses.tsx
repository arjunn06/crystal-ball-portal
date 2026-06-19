import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminDeleteCourse, adminListCourses, adminUpsertCourse } from "@/lib/courses.functions";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/courses")({
  component: CoursesAdmin,
});

function CoursesAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCourses);
  const upsert = useServerFn(adminUpsertCourse);
  const del = useServerFn(adminDeleteCourse);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "courses"], queryFn: () => list() });

  const [editing, setEditing] = useState<any | null>(null);

  const upsertMut = useMutation({
    mutationFn: (v: any) => upsert({ data: v }),
    onSuccess: () => { toast.success("Saved"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin", "courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-semibold">Courses</h1>
        <Button onClick={() => setEditing({ slug: "", title: "", summary: "", cover_url: "", required_pill: "blue", sort_order: 0, published: false })}>
          New course
        </Button>
      </div>

      {editing && <CourseForm initial={editing} onCancel={() => setEditing(null)} onSave={(v) => upsertMut.mutate(v)} />}

      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="grid gap-3">
          {(data ?? []).map((c: any) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 flex justify-between items-center gap-4">
              <div>
                <p className="font-semibold">{c.title} <span className={`label-mono ml-2 ${c.published ? "text-blue-pill" : "text-muted-foreground"}`}>{c.published ? "LIVE" : "DRAFT"}</span></p>
                <p className="text-xs text-muted-foreground font-mono">/{c.slug} · {c.required_pill} · order {c.sort_order}</p>
              </div>
              <div className="flex gap-2 whitespace-nowrap">
                <Link to="/admin/courses/$id" params={{ id: c.id }} className="label-mono px-2 py-1 rounded border border-border hover:bg-muted/30">MODULES</Link>
                <button onClick={() => setEditing(c)} className="label-mono px-2 py-1 rounded border border-border hover:bg-muted/30">EDIT</button>
                <button onClick={() => confirm(`Delete "${c.title}"?`) && delMut.mutate(c.id)} className="label-mono px-2 py-1 rounded border border-destructive text-destructive">DELETE</button>
              </div>
            </div>
          ))}
          {data && data.length === 0 && <p className="text-muted-foreground">No courses yet.</p>}
        </div>
      )}
    </div>
  );
}

function CourseForm({ initial, onSave, onCancel }: { initial: any; onSave: (v: any) => void; onCancel: () => void }) {
  const [f, setF] = useState({ ...initial });
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Slug"><Input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} placeholder="ict-foundations" /></Field>
      </div>
      <Field label="Summary"><Textarea value={f.summary ?? ""} onChange={(e) => setF({ ...f, summary: e.target.value })} rows={2} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Cover URL"><Input value={f.cover_url ?? ""} onChange={(e) => setF({ ...f, cover_url: e.target.value })} /></Field>
        <Field label="Required pill">
          <select value={f.required_pill} onChange={(e) => setF({ ...f, required_pill: e.target.value })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm">
            <option value="blue">blue</option><option value="red">red</option>
          </select>
        </Field>
        <Field label="Sort order"><Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} />
        Published (visible to members)
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(f)}>Save</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}