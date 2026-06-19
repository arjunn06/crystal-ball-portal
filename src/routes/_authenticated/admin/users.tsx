import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListUsers, adminSetBan, adminToggleAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const role = useServerFn(adminToggleAdmin);
  const ban = useServerFn(adminSetBan);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: () => list() });
  const [q, setQ] = useState("");

  const roleMut = useMutation({
    mutationFn: (v: { user_id: string; grant: boolean }) => role({ data: v }),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const banMut = useMutation({
    mutationFn: (v: { user_id: string; banned: boolean }) => ban({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter((u: any) =>
    !q || (u.email ?? "").toLowerCase().includes(q.toLowerCase()) || (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end gap-4">
        <h1 className="font-display text-3xl font-semibold">Users</h1>
        <Input placeholder="Search by email or name" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4">User</th>
                <th>Pill</th>
                <th>Sub</th>
                <th>Roles</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => {
                const isAdmin = u.roles.includes("admin");
                const isBanned = !!u.banned_at;
                return (
                  <tr key={u.id} className="border-b border-border/40">
                    <td className="py-3 px-4">
                      <p>{u.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="uppercase font-mono text-xs">{u.pill ?? "—"}</td>
                    <td className="font-mono text-xs">{u.sub_status ?? "—"}</td>
                    <td className="font-mono text-xs">{u.roles.join(", ") || "user"}</td>
                    <td className={`font-mono text-xs ${isBanned ? "text-destructive" : "text-blue-pill"}`}>{isBanned ? "BANNED" : "ACTIVE"}</td>
                    <td className="text-right pr-4 py-3 space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => roleMut.mutate({ user_id: u.id, grant: !isAdmin })}
                        className="label-mono px-2 py-1 rounded border border-border hover:bg-muted/30"
                      >
                        {isAdmin ? "REVOKE ADMIN" : "MAKE ADMIN"}
                      </button>
                      <button
                        onClick={() => banMut.mutate({ user_id: u.id, banned: !isBanned })}
                        className={`label-mono px-2 py-1 rounded border ${isBanned ? "border-blue-pill text-blue-pill" : "border-destructive text-destructive"} hover:bg-muted/30`}
                      >
                        {isBanned ? "UNBAN" : "BAN"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}