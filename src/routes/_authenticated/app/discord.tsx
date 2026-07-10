import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyClaim, startMemberDiscordConnect } from "@/lib/discord.functions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Card } from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  discord: z.enum(["connected", "error"]).optional(),
  reason: z.string().optional(),
  username: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/app/discord")({
  validateSearch: (s) => searchSchema.parse(s),
  component: DiscordClaim,
});

function DiscordClaim() {
  const qc = useQueryClient();
  const search = useSearch({ from: "/_authenticated/app/discord" });
  const getFn = useServerFn(getMyClaim);
  const startFn = useServerFn(startMemberDiscordConnect);
  const [connecting, setConnecting] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ["discord", "claim"],
    queryFn: () => getFn(),
  });

  useEffect(() => {
    if (search.discord === "connected") {
      toast.success(
        search.username ? `Connected as @${search.username}. Role granted.` : "Discord connected. Role granted.",
      );
      qc.invalidateQueries({ queryKey: ["discord", "claim"] });
      window.history.replaceState({}, "", "/app/discord");
    } else if (search.discord === "error") {
      toast.error(search.reason ?? "Could not connect Discord.");
      window.history.replaceState({}, "", "/app/discord");
    }
  }, [search.discord, search.reason, search.username, qc]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { url } = await startFn({ data: { origin: window.location.origin } });
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start Discord connection.");
      setConnecting(false);
    }
  }

  const isConnected = existing?.status === "assigned";

  return (
    <>
      <PageHeader
        title="Discord role"
        description="Connect your Discord account to join the private server and get your members role automatically."
      />

      {existing && (
        <Card className="p-5 mb-6 flex items-start gap-3">
          <StatusIcon status={existing.status} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium capitalize">{existing.status}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Discord ID <span className="font-mono">{existing.discord_user_id}</span>
            </p>
            {existing.error_message && (
              <p className="text-xs text-destructive mt-1">{existing.error_message}</p>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6 max-w-lg">
        <h2 className="font-semibold tracking-tight">
          {isConnected ? "You're in" : "Connect your Discord"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isConnected
            ? "Your Discord account is linked. Re-connect anytime if you leave the server."
            : "We'll add you to the private server and grant your members role in one click."}
        </p>
        <Button
          onClick={handleConnect}
          disabled={connecting}
          className="mt-5 rounded-lg h-10 bg-[#5865F2] hover:bg-[#4752C4] text-white"
        >
          {connecting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Redirecting…
            </>
          ) : isConnected ? (
            "Re-connect Discord"
          ) : (
            "Connect Discord"
          )}
        </Button>
      </Card>
    </>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "assigned")
    return <CheckCircle2 className="size-5 text-primary shrink-0" />;
  if (status === "failed") return <XCircle className="size-5 text-destructive shrink-0" />;
  return <Clock className="size-5 text-muted-foreground shrink-0" />;
}
