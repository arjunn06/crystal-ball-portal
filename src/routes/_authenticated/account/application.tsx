import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/account/application")({
  component: ApplicationPage,
});

function ApplicationPage() {
  const fn = useServerFn(getMyOverview);
  const { data, isLoading } = useQuery({ queryKey: ["account", "overview"], queryFn: () => fn() });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const app = data?.application;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-semibold">Red Pill application</h1>
      {!app ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-muted-foreground">No application on file.</p>
          <Link to="/red-pill" className="mt-4 inline-block text-primary underline">Apply now</Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="label-mono text-muted-foreground">STATUS</p>
            <p className="font-mono text-xl mt-1">{app.status}</p>
          </div>
          {app.call_scheduled_at && (
            <div>
              <p className="label-mono text-muted-foreground">DISCOVERY CALL</p>
              <p className="mt-1">{new Date(app.call_scheduled_at).toLocaleString()}</p>
            </div>
          )}
          {app.admin_notes && (
            <div>
              <p className="label-mono text-muted-foreground">NOTES FROM ARJUN</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{app.admin_notes}</p>
            </div>
          )}
          {app.status === "approved" && (
            <Link to="/red-pill" className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground">Pay ₹4,999 to confirm</Link>
          )}
          <p className="text-xs text-muted-foreground">Submitted {new Date(app.created_at).toLocaleDateString()} · last updated {new Date(app.updated_at).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}