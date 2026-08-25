import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LogoIcon } from "@/components/logo-icon";
import { unlockRedPillAccess } from "@/lib/redpill-access.functions";
import { setRedPillCode } from "@/lib/intent";

export const Route = createFileRoute("/redpill_/priority-access")({
  head: () => ({
    meta: [
      { title: "Red Pill Priority Access — Enter your access password" },
      {
        name: "description",
        content:
          "Waitlist members: enter the priority-access password from your email to complete your Red Pill enrolment.",
      },
      { property: "og:title", content: "Red Pill Priority Access" },
      {
        property: "og:description",
        content: "Enter the access password from your email to complete your Red Pill enrolment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Red Pill Priority Access" },
      {
        name: "twitter:description",
        content: "Enter the access password from your email to complete your Red Pill enrolment.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PriorityAccess,
});

const clash = { fontFamily: "'Clash Display', 'Archivo', ui-sans-serif, system-ui, sans-serif" };
const archivo = { fontFamily: "'Archivo', ui-sans-serif, system-ui, sans-serif" };

function PriorityAccess() {
  const router = useRouter();
  const unlock = useServerFn(unlockRedPillAccess);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      const { ok } = await unlock({ data: { password } });
      if (!ok) {
        setStatus("idle");
        setError("That password isn't right. Check the email or message we sent you.");
        return;
      }
      setRedPillCode(password.trim());
      const { data } = await supabase.auth.getSession();
      await router.navigate({ to: data.session ? "/enroll" : "/auth" });
    } catch {
      setStatus("idle");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div
      style={{ ...archivo, backgroundColor: "#F5EEE3", color: "#0B0B10" }}
      className="min-h-screen relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
        style={{
          background:
            "radial-gradient(1000px 420px at 50% -120px, #FFC6BC 0%, #FADEDA 35%, rgba(245,238,227,0) 75%)",
        }}
      />

      <header className="relative z-10 mx-auto max-w-7xl px-6 h-20 flex items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoIcon className="text-black size-10" />
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-lg px-6 pb-24 pt-6">
        <div className="rounded-[28px] border border-black/5 bg-white p-9 md:p-11 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.28)]">
          <span
            className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-white text-[11px] font-bold tracking-[0.16em] uppercase"
            style={{ background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)" }}
          >
            <Lock className="size-3" strokeWidth={3} />
            PRIORITY ACCESS
          </span>

          <h1 style={clash} className="mt-6 text-[32px] md:text-[40px] font-bold leading-[1.05]">
            Enter your access password.
          </h1>
          <p className="mt-4 text-[15.5px] leading-[1.55] text-[#5A5A62]">
            Registrations are closed to the public. As a waitlist member you were sent a password by
            email and message — enter it below to unlock your Red Pill enrolment at ₹2,999.
          </p>

          <form onSubmit={onSubmit} className="mt-8">
            <label className="block">
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#6B6B72]">
                Access password
              </span>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={64}
                className="mt-1.5 w-full py-3.5 px-5 rounded-2xl bg-[#F7F1E8] border border-black/5 text-[16px] tracking-[0.1em] text-[#0B0B10] placeholder:text-[#9A9AA2] placeholder:tracking-normal outline-none focus:border-[#E53935]/50 focus:bg-white transition-colors"
              />
            </label>

            {error && <p className="mt-3 text-[13px] font-medium text-[#E53935]">{error}</p>}

            <button
              type="submit"
              disabled={status === "loading" || password.trim().length === 0}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 h-14 rounded-full text-white text-[15px] font-semibold shadow-[0_16px_40px_-14px_rgba(229,57,53,0.8)] hover:brightness-105 transition disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#E53935 0%,#FF2A1F 100%)" }}
            >
              {status === "loading" && <Loader2 className="size-4 animate-spin" />}
              {status === "loading" ? "Checking…" : "Unlock payment page"}
            </button>
            <p className="mt-3 text-center text-[11.5px] text-[#6B6B72]">
              You'll sign in with your email, then complete the ₹2,999 payment and claim your
              Discord role.
            </p>
          </form>
        </div>

        <div className="mt-6 text-center text-[13px] text-[#6B6B72]">
          Don't have a password?{" "}
          <Link to="/redpill" className="font-semibold underline">
            Join the waitlist
          </Link>
        </div>
      </main>
    </div>
  );
}
