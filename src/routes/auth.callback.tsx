import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function go(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (!data?.handle) navigate({ to: "/onboarding", replace: true });
      else navigate({ to: "/app", replace: true });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        go(data.session.user.id);
      } else {
        const sub = supabase.auth.onAuthStateChange((_e, session) => {
          if (session) {
            sub.data.subscription.unsubscribe();
            go(session.user.id);
          }
        });
        setTimeout(() => {
          if (!cancelled) navigate({ to: "/auth", replace: true });
        }, 5000);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Signing you in…
      </div>
    </div>
  );
}
