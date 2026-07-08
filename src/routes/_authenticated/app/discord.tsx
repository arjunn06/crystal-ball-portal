import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { claimDiscordRole, getMyClaim } from "@/lib/discord.functions";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, Card } from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/discord")({
  component: DiscordClaim,
});

function DiscordClaim() {
  const qc = useQueryClient();
  const claimFn = useServerFn(claimDiscordRole);
  const getFn = useServerFn(getMyClaim);
  const { data: existing } = useQuery({
    queryKey: ["discord", "claim"],
    queryFn: () => getFn(),
  });
  const [id, setId] = useState("");

  const mut = useMutation({
    mutationFn: (v: { discord_user_id: string }) => claimFn({ data: v }),
    onSuccess: (r) => {
      if (r.ok) toast.success("Role assigned in Discord.");
      else toast.error("Submitted — Arjun will assign manually.");
      qc.invalidateQueries({ queryKey: ["discord", "claim"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Discord role"
        description="Get the members-only role and unlock the private server."
      />

      {existing && (
        <Card className="p-5 mb-6 flex items-start gap-3">
          <StatusIcon status={existing.status} />
          <div className="min-w-0">
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
        <h2 className="font-semibold tracking-tight">Submit your Discord user ID</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          In Discord: enable Developer Mode, right-click your name → Copy User ID. It's a long number.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\d{15,25}$/.test(id)) {
              toast.error("Enter your numeric Discord ID.");
              return;
            }
            mut.mutate({ discord_user_id: id });
          }}
          className="mt-5 space-y-3"
        >
          <div>
            <Label htmlFor="did" className="text-xs text-muted-foreground">
              Discord User ID
            </Label>
            <Input
              id="did"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. 123456789012345678"
              className="mt-1.5 bg-surface border-border h-10 rounded-lg font-mono"
            />
          </div>
          <Button type="submit" disabled={mut.isPending} className="rounded-lg h-10">
            {mut.isPending ? "Assigning…" : existing ? "Re-submit" : "Claim role"}
          </Button>
        </form>
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