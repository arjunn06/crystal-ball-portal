import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Inbox, Loader2, Mail, MessageCircle } from "lucide-react";
import { adminListApplications, adminUpdateApplication } from "@/lib/applications.functions";
import {
  EXPERIENCE_OPTIONS,
  HOURS_OPTIONS,
  IFVG_OPTIONS,
  INVESTMENT_OPTIONS,
  STAGE_OPTIONS,
  STATUS_OPTIONS,
  labelFor,
  type ApplicationStatus,
} from "@/lib/applications.schema";
import type { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  head: () => ({ meta: [{ title: "1-1 applications — Admin" }] }),
  component: ApplicationsPage,
});

type Application = Tables<"one_on_one_applications">;
type Filter = "all" | ApplicationStatus;

const STATUS_STYLE: Record<ApplicationStatus, string> = {
  new: "bg-warning/15 text-warning",
  shortlisted: "bg-success/15 text-success",
  invited: "bg-primary/15 text-foreground",
  declined: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLE[status as ApplicationStatus] ?? "bg-muted text-muted-foreground",
      )}
    >
      {labelFor(STATUS_OPTIONS, status)}
    </span>
  );
}

function ApplicationsPage() {
  const listFn = useServerFn(adminListApplications);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => listFn(),
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const all = useMemo(() => (data?.applications ?? []) as Application[], [data]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    for (const a of all) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [all]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter(
      (a) =>
        (filter === "all" || a.status === filter) &&
        (!t ||
          a.name.toLowerCase().includes(t) ||
          a.email.toLowerCase().includes(t) ||
          a.phone.includes(t)),
    );
  }, [all, filter, q]);

  const open = all.find((a) => a.id === openId) ?? null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Inbox className="size-4" /> 1-1 applications
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Applications for Arjun IFVG&apos;s 1-1 training. Shortlist the best fits and invite them
            for a call. The form lives at /apply.
          </p>
        </div>
        <Input
          placeholder="Search name, email, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-8 w-64 rounded-lg border-border bg-surface text-xs"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {([{ value: "all", label: "All" }, ...STATUS_OPTIONS] as const).map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setFilter(o.value)}
            className={cn(
              "h-8 rounded-lg border px-3 text-xs font-medium transition-colors",
              filter === o.value
                ? "border-primary bg-hover text-foreground"
                : "border-border text-muted-foreground hover:bg-hover/50 hover:text-foreground",
            )}
          >
            {o.label} <span className="ml-1 tabular-nums opacity-70">{counts[o.value] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border/70 bg-surface-2/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground/80">
              <tr>
                <th className="px-4 py-2.5 font-medium">Applicant</th>
                <th className="px-4 py-2.5 font-medium">Experience</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium">Applied</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                    <Loader2 className="mr-2 inline size-3.5 animate-spin" />
                    Loading applications…
                  </td>
                </tr>
              )}
              {rows.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setOpenId(a.id)}
                  className="cursor-pointer text-[13px] hover:bg-hover/40"
                >
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenId(a.id);
                      }}
                      className="text-left font-medium hover:underline"
                    >
                      {a.name}
                    </button>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {labelFor(EXPERIENCE_OPTIONS, a.experience)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {labelFor(STAGE_OPTIONS, a.stage)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                    {all.length === 0 ? "No applications yet." : "No applications match."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          {open && <ApplicationDetail key={open.id} app={open} onClose={() => setOpenId(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Answer({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{children || "—"}</dd>
    </div>
  );
}

function ApplicationDetail({ app, onClose }: { app: Application; onClose: () => void }) {
  const updateFn = useServerFn(adminUpdateApplication);
  const qc = useQueryClient();
  const [status, setStatus] = useState<ApplicationStatus>(app.status as ApplicationStatus);
  const [notes, setNotes] = useState(app.admin_notes ?? "");

  const save = useMutation({
    mutationFn: () => updateFn({ data: { id: app.id, status, adminNotes: notes } }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const waNumber = app.phone.replace(/\D/g, "");
  const dirty = status !== app.status || notes.trim() !== (app.admin_notes ?? "");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          {app.name} <StatusBadge status={app.status} />
        </DialogTitle>
        <DialogDescription>
          Applied {new Date(app.created_at).toLocaleString()} · {app.location}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={`mailto:${app.email}`}>
            <Mail className="size-3.5" /> {app.email}
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
            <MessageCircle className="size-3.5" /> {app.phone}
          </a>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            await navigator.clipboard.writeText(app.email);
            toast.success("Email copied");
          }}
        >
          <Copy className="size-3.5" /> Copy email
        </Button>
        {app.social && /^https?:\/\//i.test(app.social) && (
          <Button asChild size="sm" variant="ghost">
            <a href={app.social} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="size-3.5" /> Profile
            </a>
          </Button>
        )}
      </div>

      <dl className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Answer label="Trading for">{labelFor(EXPERIENCE_OPTIONS, app.experience)}</Answer>
          <Answer label="Stage">{labelFor(STAGE_OPTIONS, app.stage)}</Answer>
          <Answer label="IFVG level">{labelFor(IFVG_OPTIONS, app.ifvg_level)}</Answer>
          <Answer label="Markets">{app.markets}</Answer>
          <Answer label="Hours per week">{labelFor(HOURS_OPTIONS, app.hours_per_week)}</Answer>
          <Answer label="Ready to invest">{labelFor(INVESTMENT_OPTIONS, app.investment)}</Answer>
          <Answer label="Discord">{app.discord}</Answer>
          <Answer label="Social">{app.social}</Answer>
        </div>
        <Answer label="Availability for a call">{app.availability}</Answer>
        <Answer label="Biggest thing holding them back">{app.struggle}</Answer>
        <Answer label="12-month goal">{app.goal}</Answer>
        <Answer label="Why they should be picked">{app.why_you}</Answer>
      </dl>

      <div className="space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setStatus(o.value)}
              className={cn(
                "h-8 rounded-lg border px-3 text-xs font-medium transition-colors",
                status === o.value
                  ? "border-primary bg-hover text-foreground"
                  : "border-border text-muted-foreground hover:bg-hover/50 hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Private notes, only you see these"
          maxLength={4000}
          className="min-h-[88px] text-sm"
        />
        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
            {save.isPending && <Loader2 className="size-3.5 animate-spin" />} Save
          </Button>
        </div>
      </div>
    </>
  );
}
