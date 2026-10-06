import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/shell";
import { LogoIcon } from "@/components/logo-icon";
import { btnPrimary } from "@/components/site/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, CircleNotch } from "@phosphor-icons/react";
import { postAuthTarget } from "@/lib/intent";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Blueprint" },
      { name: "description", content: "Sign in to your Blueprint membership." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

async function routeAfterLogin(navigate: ReturnType<typeof useNavigate>, userId: string) {
  const { data } = await supabase.from("profiles").select("handle").eq("id", userId).maybeSingle();
  if (!data?.handle) navigate({ to: "/onboarding", replace: true });
  else navigate({ to: postAuthTarget(), replace: true });
}

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(parsed.error.errors[0].message);
      return;
    }
    setError(null);
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
      setError("Enter the 6-digit code.");
      return;
    }
    setError(null);
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

  const field =
    "mt-2 h-12 rounded-lg border border-border bg-input text-[15px] text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

  return (
    <SiteShell>
      <main id="main" className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
        {/* Brand side */}
        <aside className="relative hidden overflow-hidden border-r border-border lg:block">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(800px_500px_at_20%_0%,hsl(0_0%_100%/0.036),transparent_65%),radial-gradient(700px_500px_at_100%_100%,hsl(214_80%_55%/0.14),transparent_65%)]"
          />
          <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Blueprint home">
              <LogoIcon className="size-8 text-primary" />
              <span className="font-display text-[19px] font-extrabold tracking-tight">
                Blueprint
              </span>
            </Link>
            <div>
              <h2 className="max-w-[16ch] font-display text-[clamp(2.4rem,4vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
                Your seat is one code away.
              </h2>
              <div className="mt-10 w-[88%] -rotate-1 overflow-hidden rounded-2xl border border-border shadow-[0_40px_90px_-30px_hsl(220_30%_2%/0.95)]">
                <img
                  src="/img/discord-preview.png"
                  width={935}
                  height={614}
                  alt="Premium-alerts channel inside the members-only Discord"
                  className="block h-auto w-full"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Form side */}
        <section className="flex flex-col">
          <header className="flex h-16 items-center justify-between px-6 sm:px-10">
            <Link
              to="/"
              className="flex items-center gap-2.5 lg:invisible"
              aria-label="Blueprint home"
            >
              <LogoIcon className="size-8 text-primary" />
              <span className="font-display text-[19px] font-extrabold tracking-tight">
                Blueprint
              </span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" weight="bold" />
              Back to home
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
            <div className="w-full max-w-[400px]">
              {step === "email" ? (
                <>
                  <h1 className="font-display text-[2.2rem] font-extrabold leading-[1.1] tracking-[-0.035em]">
                    Sign in to Blueprint
                  </h1>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    Enter your email and we will send a one-time code. No password needed. New here?
                    Signing in creates your account.
                  </p>

                  <form onSubmit={handleEmailSubmit} className="mt-8 space-y-4" noValidate>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="you@example.com"
                        aria-invalid={!!error}
                        aria-describedby={error ? "auth-error" : undefined}
                        className={field}
                      />
                      {error && (
                        <p id="auth-error" role="alert" className="mt-2 text-sm text-destructive">
                          {error}
                        </p>
                      )}
                    </div>
                    <button type="submit" disabled={sending} className={`${btnPrimary} w-full`}>
                      {sending ? (
                        <>
                          <CircleNotch className="size-4 animate-spin" weight="bold" />
                          Sending code
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
                      setError(null);
                      setStep("email");
                    }}
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="size-4" weight="bold" />
                    Use a different email
                  </button>
                  <h1 className="font-display text-[2.2rem] font-extrabold leading-[1.1] tracking-[-0.035em]">
                    Check your email
                  </h1>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-foreground">{email}</span>.
                  </p>

                  <form onSubmit={handleVerify} className="mt-8 space-y-4" noValidate>
                    <div>
                      <Label htmlFor="code" className="text-sm font-medium text-foreground">
                        Verification code
                      </Label>
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
                        onChange={(e) => {
                          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                          if (error) setError(null);
                        }}
                        placeholder="123456"
                        aria-invalid={!!error}
                        aria-describedby={error ? "auth-error" : undefined}
                        className={`${field} h-14 text-center font-mono text-2xl tracking-[0.4em]`}
                      />
                      {error && (
                        <p id="auth-error" role="alert" className="mt-2 text-sm text-destructive">
                          {error}
                        </p>
                      )}
                    </div>
                    <button type="submit" disabled={verifying} className={`${btnPrimary} w-full`}>
                      {verifying ? (
                        <>
                          <CircleNotch className="size-4 animate-spin" weight="bold" />
                          Verifying
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
                    className="mt-6 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  >
                    {resending ? "Resending" : "Did not get it? Resend code"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
