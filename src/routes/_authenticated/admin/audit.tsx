import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAuditLog } from "@/lib/admin.functions";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit Log — Admin" }] }),
  component: AuditLogPage,
});

type Entry = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  target_user_id: string | null;
  target_email: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  "user.delete": "Deleted user",
  "user.ban": "Banned user",
  "user.unban": "Unbanned user",
  "user.invite_trial": "Invited user with trial",
  "trial.grant": "Granted trial",
  "role.grant": "Granted role",
  "role.revoke": "Revoked role",
  "subscription.terminate": "Terminated subscription",
  "payment.reinitiate": "Reinitiated payment",
};

function AuditLogPage() {
  const fn = useServerFn(adminListAuditLog);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-log"],
    queryFn: () => fn(),
  });
  const [q, setQ] = useState("");

  const rows = useMemo<Entry[]>(() => {
    const list = (data ?? []) as Entry[];
    if (!q) return list;
    const t = q.toLowerCase();
    return list.filter(
      (e) =>
        e.action.toLowerCase().includes(t) ||
        (e.actor_email ?? "").toLowerCase().includes(t) ||
        (e.target_email ?? "").toLowerCase().includes(t),
    );
  }, [data, q]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <ScrollText className="size-4" /> Audit log
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recent sensitive admin actions. Newest first, last 200 entries.
          </p>
        </div>
        <Input
          placeholder="Search action, actor, target…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-8 w-64 text-xs bg-surface border-border rounded-lg"
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70 bg-surface-2/40">
              <tr>
                <th className="py-2.5 px-4 font-medium">When</th>
                <th className="py-2.5 px-4 font-medium">Action</th>
                <th className="py-2.5 px-4 font-medium">Actor</th>
                <th className="py-2.5 px-4 font-medium">Target</th>
                <th className="py-2.5 px-4 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-hover/40 text-[13px] align-top">
                  <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium border bg-surface-2 text-foreground border-border">
                      {ACTION_LABELS[e.action] ?? e.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[220px]">
                    {e.actor_email ?? e.actor_id ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[220px]">
                    {e.target_email ?? e.target_user_id ?? "—"}
                  </td>
                  <td className="py-2.5 px-4">
                    {e.details && Object.keys(e.details).length > 0 ? (
                      <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap break-all font-mono">
                        {JSON.stringify(e.details, null, 0)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                    No audit entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}