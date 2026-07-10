import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { LogoIcon } from "@/components/logo-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Blueprint" },
      { name: "description", content: "Sign in to your Blueprint membership." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

async function routeAfterLogin(navigate: ReturnType<typeof useNavigate>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", userId)
    .maybeSingle();
  if (!data?.handle) navigate({ to: "/onboarding", replace: true });
  else navigate({ to: "/app", replace: true });
}

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeAfterLogin(navigate, data.session.user.id);
    });
  }, [navigate]);

  async function sendCode(targetEmail: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSending(true);
    try {
      await sendCode(parsed.data);
      setEmail(parsed.data);
      setStep("code");
      toast.success("We sent a 6-digit code to your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;
      if (!data.session) throw new Error("No session created");
      await routeAfterLogin(navigate, data.session.user.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await sendCode(email);
      toast.success("New code sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setResending(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth/callback",
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) await routeAfterLogin(navigate, data.session.user.id);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/70">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoIcon className="size-7 text-foreground" />
            <span className="font-semibold tracking-tight">Blueprint</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          {step === "email" ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in to Blueprint
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email — we'll send you a one-time code. No password needed.
              </p>

              <Button
                onClick={handleGoogle}
                variant="outline"
                className="mt-6 w-full h-10 rounded-lg bg-surface border-border hover:bg-hover"
              >
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground uppercase tracking-wider">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 bg-surface border-border h-10 rounded-lg"
                  />
                </div>
                <Button type="submit" disabled={sending} className="w-full h-10 rounded-lg mt-2">
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send code"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setCode("");
                  setStep("email");
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="size-3.5" />
                Use a different email
              </button>
              <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>.
              </p>

              <form onSubmit={handleVerify} className="mt-6 space-y-3">
                <div>
                  <Label htmlFor="code" className="text-xs text-muted-foreground">Verification code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="mt-1.5 bg-surface border-border h-12 rounded-lg text-center text-xl font-mono tracking-[0.4em]"
                  />
                </div>
                <Button type="submit" disabled={verifying} className="w-full h-10 rounded-lg mt-2">
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {resending ? "Resending…" : "Didn't get it? Resend code"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
