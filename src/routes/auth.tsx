import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };
const archivo = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };

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
    <div
      style={{ ...archivo, backgroundColor: "#F5EEE3", color: "#0B0B10" }}
      className="min-h-screen relative overflow-hidden flex flex-col"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
        style={{
          background:
            "radial-gradient(1000px 420px at 50% -80px, #FFD7B8 0%, #FBE6D0 35%, rgba(245,238,227,0) 75%)",
        }}
      />
      <header className="relative z-10">
        <div className="mx-auto max-w-6xl px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoIcon className="size-9 text-[#0B0B10]" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#4A4A52] hover:text-[#0B0B10] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </div>
      </header>
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[24px] bg-white border border-black/5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.25)] p-8 md:p-10">
          {step === "email" ? (
            <>
              <h1
                style={{ ...clash, letterSpacing: "-0.01em" }}
                className="text-[30px] leading-[1.05] font-bold text-[#0B0B10]"
              >
                Sign in to Blueprint
              </h1>
              <p className="mt-2 text-[14px] leading-[1.55] text-[#5A5A62]">
                Enter your email — we'll send you a one-time code. No password needed.
              </p>

              <button
                onClick={handleGoogle}
                type="button"
                className="mt-7 w-full h-12 rounded-full bg-white border border-black/10 hover:bg-[#FAFAFA] transition-colors text-[14px] font-semibold text-[#0B0B10] shadow-sm inline-flex items-center justify-center gap-2.5"
              >
                <GoogleGlyph />
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-3 text-[11px] text-[#6B6B72] uppercase tracking-[0.16em] font-semibold">
                <div className="h-px flex-1 bg-black/10" /> or <div className="h-px flex-1 bg-black/10" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-[12px] font-semibold text-[#4A4A52] tracking-wide uppercase">Email</Label>
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
                    className="mt-2 bg-[#F7F1E8] border border-black/10 h-12 rounded-xl text-[14px] text-[#0B0B10] placeholder:text-[#8B8B92] focus-visible:ring-2 focus-visible:ring-[#E53935]/30 focus-visible:border-[#E53935]/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full h-12 rounded-full mt-3 inline-flex items-center justify-center gap-2 text-white text-[14px] font-semibold shadow-[0_12px_30px_-10px_rgba(229,57,53,0.65)] hover:-translate-y-px transition-transform disabled:opacity-70 disabled:hover:translate-y-0"
                  style={{ background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)" }}
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send code"
                  )}
                </button>
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
                className="flex items-center gap-1.5 text-[12px] text-[#6B6B72] hover:text-[#0B0B10] transition-colors mb-4"
              >
                <ArrowLeft className="size-3.5" />
                Use a different email
              </button>
              <h1
                style={{ ...clash, letterSpacing: "-0.01em" }}
                className="text-[30px] leading-[1.05] font-bold text-[#0B0B10]"
              >
                Check your email
              </h1>
              <p className="mt-2 text-[14px] leading-[1.55] text-[#5A5A62]">
                We sent a 6-digit code to <span className="text-[#0B0B10] font-semibold">{email}</span>.
              </p>

              <form onSubmit={handleVerify} className="mt-6 space-y-3">
                <div>
                  <Label htmlFor="code" className="text-[12px] font-semibold text-[#4A4A52] tracking-wide uppercase">Verification code</Label>
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
                    className="mt-2 bg-[#F7F1E8] border border-black/10 h-14 rounded-xl text-center text-2xl font-mono tracking-[0.4em] text-[#0B0B10] focus-visible:ring-2 focus-visible:ring-[#E53935]/30 focus-visible:border-[#E53935]/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full h-12 rounded-full mt-3 inline-flex items-center justify-center gap-2 text-white text-[14px] font-semibold shadow-[0_12px_30px_-10px_rgba(229,57,53,0.65)] hover:-translate-y-px transition-transform disabled:opacity-70 disabled:hover:translate-y-0"
                  style={{ background: "linear-gradient(135deg,#E53935 0%,#FF6B35 100%)" }}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-6 w-full text-center text-[12px] text-[#6B6B72] hover:text-[#0B0B10] transition-colors disabled:opacity-50"
              >
                {resending ? "Resending…" : "Didn't get it? Resend code"}
              </button>
            </>
          )}
          </div>
          <p className="mt-6 text-center text-[12px] text-[#6B6B72]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#E53935] animate-pulse" />
              Cancel anytime · ₹499/month
            </span>
          </p>
        </div>
      </div>
      <footer className="relative z-10 border-t border-black/5">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between text-[12px] text-[#6B6B72]">
          <span>© Blueprint · by Arjun IFVG</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
