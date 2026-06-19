import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOverview, updateMyProfile } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/account/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();
  const fn = useServerFn(getMyOverview);
  const updateFn = useServerFn(updateMyProfile);
  const { data } = useQuery({ queryKey: ["account", "overview"], queryFn: () => fn() });

  const [form, setForm] = useState({ full_name: "", avatar_url: "", discord_username: "", phone: "" });
  useEffect(() => {
    if (data?.profile) setForm({
      full_name: data.profile.full_name ?? "",
      avatar_url: data.profile.avatar_url ?? "",
      discord_username: data.profile.discord_username ?? "",
      phone: data.profile.phone ?? "",
    });
  }, [data]);

  const mut = useMutation({
    mutationFn: (d: typeof form) => updateFn({ data: d }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["account", "overview"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-3xl font-semibold">Profile</h1>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Email (read-only)</Label>
          <Input value={data?.profile?.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Avatar URL</Label>
          <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" />
        </div>
        <div className="space-y-2">
          <Label>Discord username</Label>
          <Input value={form.discord_username} onChange={(e) => setForm({ ...form, discord_username: e.target.value })} placeholder="@handle" />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <Button onClick={() => mut.mutate(form)} disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
}