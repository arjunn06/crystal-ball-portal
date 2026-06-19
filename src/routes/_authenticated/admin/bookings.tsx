import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminDeleteBooking, adminListBookings } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListBookings);
  const del = useServerFn(adminDeleteBooking);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "bookings"], queryFn: () => list() });

  const mut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["admin", "bookings"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Bookings</h1>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr><th className="py-2 px-4">When</th><th>User</th><th>Kind</th><th>Notes</th><th>Calendar ID</th><th></th></tr>
            </thead>
            <tbody>
              {(data ?? []).map((b: any) => (
                <tr key={b.id} className="border-b border-border/40">
                  <td className="py-2 px-4">{new Date(b.scheduled_at).toLocaleString()}</td>
                  <td>{b.profile?.email ?? "—"}</td>
                  <td className="font-mono text-xs">{b.kind}</td>
                  <td className="text-xs">{b.notes ?? "—"}</td>
                  <td className="font-mono text-xs text-muted-foreground truncate max-w-[180px]">{b.google_event_id ?? "—"}</td>
                  <td className="text-right pr-4">
                    <button onClick={() => mut.mutate(b.id)} className="label-mono text-destructive hover:underline">DELETE</button>
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No bookings.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}