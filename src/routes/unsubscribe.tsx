import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Unsubscribe — Blueprint by Arjun IFVG" },
      {
        name: "description",
        content: "Manage your email preferences for Blueprint by Arjun IFVG.",
      },
      { property: "og:title", content: "Unsubscribe — Blueprint" },
      {
        property: "og:description",
        content: "Stop receiving emails from Blueprint by Arjun IFVG.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Unsubscribe,
});

type State = "loading" | "valid" | "done" | "already" | "invalid";

function Unsubscribe() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    if (!t) {
      setState("invalid");
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        if (!r.ok) return setState("invalid");
        const b = await r.json();
        if (b.valid) setState("valid");
        else if (b.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("invalid"));
  }, []);

  async function confirm() {
    if (!token) return;
    setBusy(true);
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const b = await r.json();
      if (b.success) setState("done");
      else if (b.reason === "already_unsubscribed") setState("already");
      else setState("invalid");
    } catch {
      setState("invalid");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {state === "done"
            ? "You're unsubscribed"
            : state === "already"
              ? "Already unsubscribed"
              : state === "invalid"
                ? "Link not valid"
                : "Unsubscribe"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {state === "loading" && "Checking your link…"}
          {state === "valid" &&
            "Confirm below to stop receiving emails from Blueprint by Arjun IFVG."}
          {state === "done" && "You won't receive further emails from us."}
          {state === "already" && "This email address is already unsubscribed."}
          {state === "invalid" &&
            "This unsubscribe link is invalid or has expired."}
        </p>
        {state === "valid" && (
          <Button onClick={confirm} disabled={busy} className="mt-6 rounded-full">
            {busy ? "Unsubscribing…" : "Confirm unsubscribe"}
          </Button>
        )}
      </div>
    </main>
  );
}