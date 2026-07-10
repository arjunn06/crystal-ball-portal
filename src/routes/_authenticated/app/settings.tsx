import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  cancelMySubscription,
  getAccountOverview,
  updateMyProfile,
} from "@/lib/account.functions";
import { PageHeader, Card, formatINR } from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Upload, User as UserIcon } from "lucide-react";
import { useConfirm } from "@/components/app/confirm";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const acct = useServerFn(getAccountOverview);
  const save = useServerFn(updateMyProfile);
  const cancel = useServerFn(cancelMySubscription);
  const { data } = useQuery({ queryKey: ["account", "overview"], queryFn: () => acct() });

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      setFullName(data.profile.full_name ?? "");
      setAvatarUrl(data.profile.avatar_url ?? "");
    }
  }, [data?.profile]);

  const saveMut = useMutation({
    mutationFn: (v: { full_name?: string | null; avatar_url?: string | null }) =>
      save({ data: v }),
    onSuccess: () => {
      toast.success("Profile updated.");
      qc.invalidateQueries({ queryKey: ["account", "overview"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancel(),
    onSuccess: () => {
      toast.success("Cancellation scheduled at period end.");
      qc.invalidateQueries({ queryKey: ["account", "overview"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleAvatarUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Not signed in.");
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userData.user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !signed) throw signErr ?? new Error("Could not generate URL.");
      setAvatarUrl(signed.signedUrl);
      saveMut.mutate({ full_name: fullName, avatar_url: signed.signedUrl });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const sub = data?.subscription;
  const willCancel = !!sub?.cancelled_at;

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and subscription." />

      <div className="space-y-6 max-w-2xl">
        <Card className="p-6">
          <h2 className="font-semibold tracking-tight">Profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Displayed across your account.</p>
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <Input
                id="email"
                value={data?.profile?.email ?? ""}
                disabled
                className="mt-1.5 bg-surface border-border h-10 rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="name" className="text-xs text-muted-foreground">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 bg-surface border-border h-10 rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="avatar" className="text-xs text-muted-foreground">Avatar URL</Label>
              <Input
                id="avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1.5 bg-surface border-border h-10 rounded-lg"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => saveMut.mutate({ full_name: fullName, avatar_url: avatarUrl })}
                disabled={saveMut.isPending}
                className="rounded-lg h-10"
              >
                {saveMut.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold tracking-tight">Subscription</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Plan" value="Blue Pill" />
            <Metric
              label="Status"
              value={sub?.status === "active" ? (willCancel ? "Cancels soon" : "Active") : (sub?.status ?? "—")}
            />
            <Metric
              label={willCancel ? "Ends" : "Renews"}
              value={sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
            />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {formatINR(499 * 100)} / month · billed via Razorpay
          </div>
          {sub?.status === "active" && !willCancel && (
            <div className="mt-5 pt-4 border-t border-border/70 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Cancel anytime. You keep access until the end of the current period.
              </p>
              <Button
                variant="outline"
                onClick={() =>
                  confirm({
                    title: "Cancel membership?",
                    description: "Your access continues until the end of the current billing period.",
                    confirmLabel: "Cancel membership",
                    cancelLabel: "Keep it",
                    destructive: true,
                  }).then((ok) => ok && cancelMut.mutate())
                }
                disabled={cancelMut.isPending}
                className="rounded-lg h-9 border-border bg-surface hover:bg-hover"
              >
                Cancel membership
              </Button>
            </div>
          )}
          {willCancel && (
            <p className="mt-5 pt-4 border-t border-border/70 text-xs text-muted-foreground">
              Your membership is scheduled to cancel at period end. No further charges.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold tracking-tight">Session</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Sign out of this browser.</p>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={signOut}
              className="rounded-lg h-10 border-border bg-surface hover:bg-hover"
            >
              <LogOut className="size-4 mr-2" /> Sign out
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface-2 px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-sm">{value}</p>
    </div>
  );
}