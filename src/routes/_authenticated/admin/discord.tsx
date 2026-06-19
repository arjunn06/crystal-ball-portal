import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListClaims, adminMarkClaim, adminRetryClaim } from "@/lib/discord.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/discord")({
  component: DiscordAdmin,
});

function DiscordAdmin() {
  const qc = useQueryClient();
  const list = useServerFn(adminListClaims);
  const retry = useServerFn(adminRetryClaim);
  const mark = useServerFn(adminMarkClaim);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "claims"], queryFn: () => list() });

  const retryMut = useMutation({
    mutationFn: (id: string) => retry({ data: { id } }),
    onSuccess: () => { toast.success("Assigned"); qc.invalidateQueries({ queryKey: ["admin", "claims"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const markMut = useMutation({
    mutationFn: (v: { id: string; status: "assigned" | "revoked" }) => mark({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "claims"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Discord claims</h1>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr><th className="py-2 px-4">When</th><th>User</th><th>Discord ID</th><th>Role</th><th>Status</th><th>Error</th><th className="text-right pr-4">Actions</th></tr>
            </thead>
            <tbody>
              {(data ?? []).map((c: any) => (
                <tr key={c.id} className="border-b border-border/40 align-top">
                  <td className="py-2 px-4">{new Date(c.created_at).toLocaleString()}</td>
                  <td>{c.profile?.email ?? "—"}</td>
                  <td className="font-mono text-xs">{c.discord_user_id}</td>
                  <td className="font-mono text-xs">{c.role_kind}</td>
                  <td className={`font-mono text-xs ${c.status === "assigned" ? "text-blue-pill" : c.status === "failed" ? "text-destructive" : ""}`}>{c.status}</td>
                  <td className="text-xs text-destructive max-w-[260px]">{c.error_message ?? ""}</td>
                  <td className="text-right pr-4 space-x-2 whitespace-nowrap">
                    {c.status !== "assigned" && (
                      <button onClick={() => retryMut.mutate(c.id)} className="label-mono px-2 py-1 rounded border border-border hover:bg-muted/30">RETRY</button>
                    )}
                    {c.status !== "assigned" && (
                      <button onClick={() => markMut.mutate({ id: c.id, status: "assigned" })} className="label-mono px-2 py-1 rounded border border-blue-pill text-blue-pill">MARK DONE</button>
                    )}
                    {c.status === "assigned" && (
                      <button onClick={() => markMut.mutate({ id: c.id, status: "revoked" })} className="label-mono px-2 py-1 rounded border border-destructive text-destructive">REVOKE</button>
                    )}
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No claims yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}