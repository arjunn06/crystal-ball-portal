import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListWaitlist } from "@/lib/waitlist-admin.functions";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";

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
};

const ACCESS_URL = "https://blueprint.ifvg.in/redpill/priority-access";

function WaitlistPage() {
  const list = useServerFn(adminListWaitlist);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "waitlist"],
    queryFn: () => list(),
  });

  const entries = (data?.entries ?? []) as Entry[];

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Red Pill waitlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Send waitlist members the priority-access page plus the shared password. They sign in with
          their email, pay ₹2,999 and then claim their Discord role.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Priority access page
          </div>
          <div className="font-medium">{ACCESS_URL}</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => copy(ACCESS_URL, "Link")}>
          <Copy className="size-3.5" /> Copy link
        </Button>
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
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => copy(e.email, "Email")}>
                        <Copy className="size-3.5" /> Email
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copy(e.phone, "Phone")}>
                        <Copy className="size-3.5" /> Phone
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
