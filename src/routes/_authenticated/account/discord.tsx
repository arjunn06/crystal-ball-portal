import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { myDiscordClaims, submitDiscordClaim } from "@/lib/discord.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/discord")({
  component: DiscordPage,
});

function DiscordPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(myDiscordClaims);
  const submitFn = useServerFn(submitDiscordClaim);
  const { data: claims } = useQuery({ queryKey: ["discord", "mine"], queryFn: () => listFn() });
  const [discordId, setDiscordId] = useState("");

  const mut = useMutation({
    mutationFn: () => submitFn({ data: { discord_user_id: discordId } }),
    onSuccess: (r: any) => {
      if (r.status === "assigned") toast.success("Role assigned in Discord!");
      else toast.warning(`Submitted — awaiting manual review: ${r.error ?? ""}`);
      qc.invalidateQueries({ queryKey: ["discord", "mine"] });
      setDiscordId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-3xl font-semibold">Claim your Discord role</h1>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter your numeric Discord user ID. In Discord: Settings → Advanced → Developer Mode, then right-click your name → Copy User ID.
          You must already be in the Blueprint Discord server.
        </p>
        <div className="space-y-2">
          <Label>Discord User ID</Label>
          <Input value={discordId} onChange={(e) => setDiscordId(e.target.value)} placeholder="e.g. 123456789012345678" />
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || !discordId}>
          {mut.isPending ? "Submitting…" : "Claim role"}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="label-mono text-muted-foreground mb-3">CLAIM HISTORY</p>
        {!claims?.length ? (
          <p className="text-muted-foreground text-sm">No claims yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {claims.map((c: any) => (
              <li key={c.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-mono">{c.discord_user_id}</p>
                  <p className="text-xs text-muted-foreground">{c.role_kind} · {new Date(c.created_at).toLocaleString()}</p>
                  {c.error_message && <p className="text-xs text-destructive mt-1">{c.error_message}</p>}
                </div>
                <span className={`label-mono ${c.status === "assigned" ? "text-blue-pill" : c.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{c.status.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}