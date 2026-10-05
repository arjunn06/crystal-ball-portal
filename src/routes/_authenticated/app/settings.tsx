import { BLUE_PILL_TOTAL_PAISE } from "@/lib/pricing";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cancelMySubscription, getAccountOverview, updateMyProfile } from "@/lib/account.functions";
import { Card, formatINR } from "@/components/app/sidebar";
import { MemberHeader } from "@/components/app/ui-kit";
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
    mutationFn: (v: { full_name?: string | null; avatar_url?: string | null }) => save({ data: v }),
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
    <div>
      <MemberHeader title="Settings" description="Manage your account and subscription." />

      <div className="max-w-2xl space-y-6">
        <Card className="p-7">
          <h2 className="font-display text-xl font-bold tracking-tight">Profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Displayed across your account.</p>
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input id="email" value={data?.profile?.email ?? ""} disabled className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Full name
              </Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Avatar</Label>
              <div className="mt-1.5 flex items-center gap-4">
                <div className="size-16 rounded-2xl overflow-hidden bg-surface-2 border border-border flex items-center justify-center shrink-0">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("avatar-file")?.click()}
                    disabled={uploading}
                    className="h-9"
                  >
                    <Upload className="size-4 mr-2" />
                    {uploading ? "Uploading…" : avatarUrl ? "Change" : "Upload image"}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setAvatarUrl("");
                        saveMut.mutate({ full_name: fullName, avatar_url: null });
                      }}
                      disabled={uploading}
                      className="rounded-lg h-9"
                    >
                      Remove
                    </Button>
                  )}
                  <input
                    id="avatar-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAvatarUpload(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">PNG, JPG or GIF. Max 5 MB.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => saveMut.mutate({ full_name: fullName, avatar_url: avatarUrl })}
                disabled={saveMut.isPending}
                className="h-10"
              >
                {saveMut.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-7">
          <h2 className="font-display text-xl font-bold tracking-tight">Subscription</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Plan" value="Blue Pill" />
            <Metric
              label="Status"
              value={
                sub?.status === "active"
                  ? willCancel
                    ? "Cancels soon"
                    : "Active"
                  : (sub?.status ?? "—")
              }
            />
            <Metric
              label={willCancel ? "Ends" : "Renews"}
              value={
                sub?.current_period_end
                  ? new Date(sub.current_period_end).toLocaleDateString()
                  : "—"
              }
            />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            {formatINR(BLUE_PILL_TOTAL_PAISE)} / month incl. 18% GST · billed via Razorpay
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
                    description:
                      "Your access continues until the end of the current billing period.",
                    confirmLabel: "Cancel membership",
                    cancelLabel: "Keep it",
                    destructive: true,
                  }).then((ok) => ok && cancelMut.mutate())
                }
                disabled={cancelMut.isPending}
                className="h-9"
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

        <Card className="p-7">
          <h2 className="font-display text-xl font-bold tracking-tight">Session</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Sign out of this browser.</p>
          <div className="mt-4">
            <Button variant="outline" onClick={signOut} className="">
              <LogOut className="size-4 mr-2" /> Sign out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}
