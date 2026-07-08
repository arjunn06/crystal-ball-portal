import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers } from "@/lib/admin.functions";
import { PageHeader, Card } from "@/components/app/sidebar";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const fn = useServerFn(adminListUsers);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: () => fn() });
  const [q, setQ] = useState("");

  const filtered = (data ?? []).filter(
    (u: any) =>
      !q ||
      (u.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who has an account."
        actions={
          <Input
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-56 bg-surface border-border rounded-lg"
          />
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b border-border/70">
              <tr>
                <th className="py-3 px-4 font-medium">User</th>
                <th className="py-3 px-4 font-medium">Membership</th>
                <th className="py-3 px-4 font-medium">Roles</th>
                <th className="py-3 px-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((u: any) => (
                <tr key={u.id} className="hover:bg-hover/40">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-surface-2 border border-border grid place-items-center text-[11px] font-medium">
                        {(u.full_name ?? u.email ?? "··").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate">{u.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusPill status={u.subscription?.status ?? null} />
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {(u.roles ?? []).length ? u.roles.join(", ") : "member"}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    No matches.
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

function StatusPill({ status }: { status: string | null }) {
  const isActive = status === "active";
  return (
    <span
      className={
        isActive
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[11px] font-medium"
          : "inline-flex items-center gap-1.5 rounded-full bg-surface-2 text-muted-foreground border border-border px-2 py-0.5 text-[11px] font-medium"
      }
    >
      <span className={`size-1.5 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground"}`} />
      {status ?? "none"}
    </span>
  );
}