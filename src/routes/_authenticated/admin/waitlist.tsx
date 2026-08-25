import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { adminListWaitlist, adminCreateRedPillInvite } from "@/lib/redpill-invite.functions";
import { Button } from "@/components/ui/button";
import { Copy, Link2, Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/waitlist")({
  head: () => ({ meta: [{ title: "Red Pill waitlist — Admin" }] }),
  component: WaitlistPage,
});

type Entry = {
  id: string;
  email: string;
  phone: string;
  name: string | null;
  created_at: string;
  invite: { token: string; expires_at: string; used_at: string | null } | null;
};

function inviteUrl(token: string) {
  const origin = typeof window === "undefined" ? "https://blueprint.ifvg.in" : window.location.origin;
  return `${origin}/redpill/invite/${token}`;
}

function WaitlistPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListWaitlist);
  const createInvite = useServerFn(adminCreateRedPillInvite);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "waitlist"],
    queryFn: () => list(),
  });

  const mut = useMutation({
    mutationFn: (e: Entry) =>
      createInvite({
        data: { email: e.email, waitlist_id: e.id, name: e.name ?? undefined, expires_in_days: 14 },
      }),
    onSuccess: async ({ token }) => {
      await navigator.clipboard.writeText(inviteUrl(token)).catch(() => {});
      toast.success("Payment link created and copied");
      qc.invalidateQueries({ queryKey: ["admin", "waitlist"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not create the link"),
    onSettled: () => setBusy(null),
  });

  async function copy(token: string) {
    await navigator.clipboard.writeText(inviteUrl(token));
    toast.success("Link copied");
  }

  const entries = (data?.entries ?? []) as Entry[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Red Pill waitlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Issue a single-use payment link. The member signs in with their email, pays ₹2,999 and
          then claims their Discord role.
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading waitlist…
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No waitlist signups yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Member</th>
                <th className="text-left font-medium px-4 py-3">Phone</th>
                <th className="text-left font-medium px-4 py-3">Joined</th>
                <th className="text-left font-medium px-4 py-3">Invite</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.name || "—"}</div>
                    <div className="text-muted-foreground">{e.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {!e.invite ? (
                      <span className="text-muted-foreground">Not sent</span>
                    ) : e.invite.used_at ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600">
                        <Check className="size-3.5" /> Paid / used
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Active · expires {new Date(e.invite.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {e.invite && !e.invite.used_at && (
                        <Button variant="outline" size="sm" onClick={() => copy(e.invite!.token)}>
                          <Copy className="size-3.5" /> Copy link
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={busy === e.id}
                        onClick={() => {
                          setBusy(e.id);
                          mut.mutate(e);
                        }}
                      >
                        {busy === e.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Link2 className="size-3.5" />
                        )}
                        {e.invite ? "New link" : "Create link"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
