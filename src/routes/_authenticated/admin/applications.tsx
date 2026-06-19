import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListApplications, adminUpdateApplication } from "@/lib/admin.functions";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  component: AppsPage,
});

const STATUSES = ["pending_call", "call_scheduled", "approved", "rejected", "paid"] as const;

function AppsPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListApplications);
  const update = useServerFn(adminUpdateApplication);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "applications"], queryFn: () => list() });

  const mut = useMutation({
    mutationFn: (v: any) => update({ data: v }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin", "applications"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Red Pill applications</h1>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="space-y-4">
          {(data ?? []).map((a: any) => <AppCard key={a.id} a={a} onSave={(v) => mut.mutate(v)} />)}
          {data && data.length === 0 && <p className="text-muted-foreground">No applications yet.</p>}
        </div>
      )}
    </div>
  );
}

function AppCard({ a, onSave }: { a: any; onSave: (v: any) => void }) {
  const [status, setStatus] = useState(a.status);
  const [notes, setNotes] = useState(a.admin_notes ?? "");
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold">{a.profile?.full_name ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{a.profile?.email}</p>
        </div>
        <p className="text-xs text-muted-foreground">Submitted {new Date(a.created_at).toLocaleDateString()}</p>
      </div>
      {a.call_scheduled_at && (
        <p className="text-sm">Call: <span className="font-mono">{new Date(a.call_scheduled_at).toLocaleString()}</span></p>
      )}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`label-mono px-2 py-1 rounded border ${status === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal / shared notes" rows={3} />
      <div className="flex justify-end">
        <button
          onClick={() => onSave({ id: a.id, status, admin_notes: notes })}
          className="label-mono rounded-md bg-primary text-primary-foreground px-3 py-2"
        >
          SAVE
        </button>
      </div>
    </div>
  );
}