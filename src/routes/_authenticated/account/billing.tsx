import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview } from "@/lib/account.functions";
import { formatINR } from "@/components/section-shell";

export const Route = createFileRoute("/_authenticated/account/billing")({
  component: BillingPage,
});

function BillingPage() {
  const fn = useServerFn(getMyOverview);
  const { data, isLoading } = useQuery({ queryKey: ["account", "overview"], queryFn: () => fn() });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-semibold">Billing</h1>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="label-mono text-muted-foreground">SUBSCRIPTION</p>
        {data.subscription ? (
          <div className="mt-2">
            <p className="text-lg">Blue Pill — <span className="font-mono">{data.subscription.status}</span></p>
            {data.subscription.current_period_end && (
              <p className="text-sm text-muted-foreground">Renews {new Date(data.subscription.current_period_end).toLocaleDateString()}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">To cancel, message support — Razorpay mandate-cancel coming soon.</p>
          </div>
        ) : (
          <p className="mt-2 text-muted-foreground">No subscription. <Link to="/blue-pill" className="text-primary underline">Start Blue Pill</Link></p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="label-mono text-muted-foreground mb-3">PAYMENT HISTORY</p>
        {data.payments.length === 0 ? (
          <p className="text-muted-foreground">No payments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2">Date</th>
                <th>Pill</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="py-2">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="uppercase">{p.pill}</td>
                  <td className="font-mono">{formatINR(p.amount_paise)}</td>
                  <td className="font-mono">{p.status}</td>
                  <td className="font-mono text-xs text-muted-foreground">{p.razorpay_payment_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}