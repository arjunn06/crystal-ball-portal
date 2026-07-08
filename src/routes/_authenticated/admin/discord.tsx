import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListClaims, adminMarkClaim, adminRetryClaim } from "@/lib/discord.functions";
import { PageHeader, Card } from "@/components/app/sidebar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/discord")({
  component: ClaimsPage,
});

function ClaimsPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListClaims);
  const retry = useServerFn(adminRetryClaim);
  const mark = useServerFn(adminMarkClaim);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "claims"],
    queryFn: () => list(),
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => retry({ data: { id } }),
    onSuccess: () => {
      toast.success("Assigned");
      qc.invalidateQueries({ queryKey: ["admin", "claims"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markMut = useMutation({
    mutationFn: (v: { id: string; status: "assigned" | "revoked" }) => mark({ data: v }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "claims"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Discord claims"
        description="Every submitted claim and its assignment status."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b border-border/70">
              <tr>
                <th className="py-3 px-4 font-medium">Member</th>
                <th className="py-3 px-4 font-medium">Discord ID</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Error</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(data ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-hover/40 align-top">
                  <td className="py-3 px-4">
                    <p className="truncate">{c.profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.profile?.email}</p>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono">{c.discord_user_id}</td>
                  <td className="py-3 px-4 text-xs capitalize">{c.status}</td>
                  <td className="py-3 px-4 text-xs text-destructive max-w-[240px] truncate">
                    {c.error_message ?? ""}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {c.status !== "assigned" && (
                      <button
                        onClick={() => retryMut.mutate(c.id)}
                        className="text-xs px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-hover"
                      >
                        Retry
                      </button>
                    )}
                    {c.status !== "assigned" && (
                      <button
                        onClick={() => markMut.mutate({ id: c.id, status: "assigned" })}
                        className="text-xs px-2.5 py-1 rounded-md border border-primary/40 bg-primary/10 text-primary"
                      >
                        Mark done
                      </button>
                    )}
                    {c.status === "assigned" && (
                      <button
                        onClick={() => markMut.mutate({ id: c.id, status: "revoked" })}
                        className="text-xs px-2.5 py-1 rounded-md border border-destructive/40 text-destructive"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No claims yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}