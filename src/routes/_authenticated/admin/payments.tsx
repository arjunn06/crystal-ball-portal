import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListPayments } from "@/lib/admin.functions";
import { formatINR } from "@/components/section-shell";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const fn = useServerFn(adminListPayments);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "payments"], queryFn: () => fn() });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold">Payments & subscriptions</h1>

      <section>
        <p className="label-mono text-muted-foreground mb-3">PAYMENTS</p>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr><th className="py-2 px-4">Date</th><th>User</th><th>Pill</th><th>Amount</th><th>Status</th><th>Payment ID</th></tr>
            </thead>
            <tbody>
              {data.payments.map((p: any) => (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="py-2 px-4">{new Date(p.created_at).toLocaleString()}</td>
                  <td>{p.profile?.email ?? "—"}</td>
                  <td className="uppercase font-mono text-xs">{p.pill}</td>
                  <td className="font-mono">{formatINR(p.amount_paise)}</td>
                  <td className="font-mono text-xs">{p.status}</td>
                  <td className="font-mono text-xs text-muted-foreground">{p.razorpay_payment_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <p className="label-mono text-muted-foreground mb-3">SUBSCRIPTIONS</p>
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr><th className="py-2 px-4">Created</th><th>User</th><th>Status</th><th>Renews</th><th>Subscription ID</th></tr>
            </thead>
            <tbody>
              {data.subscriptions.map((s: any) => (
                <tr key={s.id} className="border-b border-border/40">
                  <td className="py-2 px-4">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>{s.profile?.email ?? "—"}</td>
                  <td className="font-mono text-xs">{s.status}</td>
                  <td className="text-xs">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : "—"}</td>
                  <td className="font-mono text-xs text-muted-foreground">{s.razorpay_subscription_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}