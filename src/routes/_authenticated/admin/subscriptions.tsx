import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListSubscriptions } from "@/lib/admin.functions";
import { PageHeader, Card } from "@/components/app/sidebar";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  component: SubsPage,
});

function SubsPage() {
  const fn = useServerFn(adminListSubscriptions);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subs"],
    queryFn: () => fn(),
  });

  return (
    <>
      <PageHeader title="Subscriptions" description="Every Blue Pill subscription." />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b border-border/70">
              <tr>
                <th className="py-3 px-4 font-medium">Member</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Renews</th>
                <th className="py-3 px-4 font-medium">Razorpay ID</th>
                <th className="py-3 px-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {(data ?? []).map((s: any) => (
                <tr key={s.id} className="hover:bg-hover/40">
                  <td className="py-3 px-4">
                    <p className="truncate">{s.profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.profile?.email}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <span
                      className={
                        s.status === "active"
                          ? "inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 font-medium"
                          : "inline-flex items-center gap-1.5 rounded-full bg-surface-2 text-muted-foreground border border-border px-2 py-0.5 font-medium"
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {s.current_period_end
                      ? new Date(s.current_period_end).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                    {s.razorpay_subscription_id ?? "—"}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No subscriptions yet.
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