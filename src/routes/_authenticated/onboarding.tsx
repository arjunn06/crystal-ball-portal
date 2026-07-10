import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  checkHandleAvailability,
  completeOnboarding,
  signAvatarUrl,
} from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Check, X, Camera, User } from "lucide-react";
import { LogoIcon } from "@/components/logo-icon";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const handleRegex = /^[a-zA-Z0-9_]{3,20}$/;

function Onboarding() {
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "reserved" | "invalid"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkFn = useServerFn(checkHandleAvailability);
  const completeFn = useServerFn(completeOnboarding);
  const signFn = useServerFn(signAvatarUrl);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      setUid(data.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, handle, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.handle) {
        navigate({ to: "/app", replace: true });
        return;
      }
      const metaName =
        (data.user.user_metadata?.full_name as string | undefined) ??
        (data.user.user_metadata?.name as string | undefined) ??
        profile?.full_name ??
        "";
      setFullName(metaName);
      const metaAvatar = data.user.user_metadata?.avatar_url as string | undefined;
      setAvatarUrl(profile?.avatar_url ?? metaAvatar ?? null);
    });
  }, [navigate]);

  // debounced handle check
  useEffect(() => {
    if (!handle) {
      setHandleStatus("idle");
      return;
    }
    if (!handleRegex.test(handle)) {
      setHandleStatus("invalid");
      return;
    }
    setHandleStatus("checking");
    const t = setTimeout(async () => {
      try {
        const r = await checkFn({ data: { handle } });
        if (r.available) setHandleStatus("available");
        else setHandleStatus(r.reason === "reserved" ? "reserved" : "taken");
      } catch {
        setHandleStatus("idle");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [handle, checkFn]);

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !uid) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { url } = await signFn({ data: { path } });
      setAvatarPath(path);
      setAvatarUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z
      .object({
        full_name: z.string().trim().min(1, "Enter your name").max(80),
        handle: z
          .string()
          .trim()
          .min(3, "Handle must be at least 3 characters")
          .max(20)
          .regex(handleRegex, "Only letters, numbers, and underscores"),
      })
      .safeParse({ full_name: fullName, handle });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (handleStatus === "taken" || handleStatus === "reserved") {
      toast.error("Please pick a different handle");
      return;
    }
    setSaving(true);
    try {
      await completeFn({
        data: {
          full_name: parsed.data.full_name,
          handle: parsed.data.handle,
          avatar_url: avatarUrl,
        },
      });
      toast.success("You're in.");
      navigate({ to: "/app", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center gap-2.5">
          <LogoIcon className="size-7 text-foreground" />
          <span className="font-semibold tracking-tight">Blueprint</span>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Set up your profile</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Just a few details so members can recognise you.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="group relative size-24 rounded-full bg-surface border border-border overflow-hidden hover:border-foreground/40 transition-colors"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="size-5 text-white animate-spin" />
                  ) : (
                    <Camera className="size-5 text-white" />
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarPick}
              />
              <p className="text-xs text-muted-foreground">
                {avatarUrl ? "Tap to change photo" : "Add a profile photo (optional)"}
              </p>
            </div>

            <div>
              <Label htmlFor="name" className="text-xs text-muted-foreground">Name</Label>
              <Input
                id="name"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5 bg-surface border-border h-10 rounded-lg"
              />
            </div>

            <div>
              <Label htmlFor="handle" className="text-xs text-muted-foreground">Handle</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  @
                </span>
                <Input
                  id="handle"
                  required
                  autoComplete="off"
                  value={handle}
                  onChange={(e) =>
                    setHandle(
                      e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20),
                    )
                  }
                  placeholder="yourhandle"
                  className="bg-surface border-border h-10 rounded-lg pl-7 pr-9"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <HandleStatusIcon status={handleStatus} />
                </div>
              </div>
              <HandleStatusText status={handleStatus} />
            </div>

            <Button
              type="submit"
              disabled={saving || handleStatus === "checking"}
              className="w-full h-10 rounded-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function HandleStatusIcon({ status }: { status: string }) {
  if (status === "checking")
    return <Loader2 className="size-4 text-muted-foreground animate-spin" />;
  if (status === "available") return <Check className="size-4 text-primary" />;
  if (status === "taken" || status === "reserved" || status === "invalid")
    return <X className="size-4 text-destructive" />;
  return null;
}

function HandleStatusText({ status }: { status: string }) {
  if (status === "idle" || status === "checking") return null;
  const msg =
    status === "available"
      ? "Handle is available"
      : status === "taken"
        ? "That handle is taken"
        : status === "reserved"
          ? "That handle is reserved"
          : "3–20 letters, numbers, or underscores";
  const cls = cn(
    "mt-1 text-[11px]",
    status === "available" ? "text-primary" : "text-destructive",
  );
  return <p className={cls}>{msg}</p>;
}
