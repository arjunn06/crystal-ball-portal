import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  adminListPromoCodes,
  adminCreatePromoCode,
  adminUpdatePromoCode,
  adminDeletePromoCode,
} from "@/lib/promos.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/app/confirm";
import { Plus, MoreHorizontal, Ticket, Copy, Loader2, Trash2, Link2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/promos")({
  head: () => ({ meta: [{ title: "Promo codes — Admin" }] }),
  component: PromosPage,
});

type Promo = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent_off_first" | "amount_off_first" | "trial_days";
  discount_value: number;
  max_redemptions: number | null;
  per_user_limit: number;
  redemptions_count: number;
  expires_at: string | null;
  active: boolean;
  notes: string | null;
  razorpay_offer_id: string | null;
  created_at: string;
};

function formatDiscount(p: Promo) {
  if (p.discount_type === "percent_off_first") return `${p.discount_value}% off first month`;
  if (p.discount_type === "amount_off_first") return `₹${p.discount_value} off first month`;
  return `${p.discount_value} free trial days`;
}

function PromosPage() {
  const listFn = useServerFn(adminListPromoCodes);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "promos"],
    queryFn: () => listFn(),
  });
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo<Promo[]>(() => {
    const list = (data ?? []) as Promo[];
    if (!q) return list;
    const t = q.toLowerCase();
    return list.filter(
      (p) =>
        p.code.toLowerCase().includes(t) ||
        (p.description ?? "").toLowerCase().includes(t),
    );
  }, [data, q]);

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="size-4" /> Promo codes
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create discount codes and extended trials. Redeemable at checkout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search codes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-8 w-56 text-xs bg-surface border-border rounded-lg"
          />
          <Button
            size="sm"
            className="h-8 rounded-lg"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5 mr-1" /> New code
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground/80 border-b border-border/70 bg-surface-2/40">
              <tr>
                <th className="py-2.5 px-4 font-medium">Code</th>
                <th className="py-2.5 px-4 font-medium">Discount</th>
                <th className="py-2.5 px-4 font-medium">Usage</th>
                <th className="py-2.5 px-4 font-medium">Per user</th>
                <th className="py-2.5 px-4 font-medium">Expires</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <PromoRow key={p.id} promo={p} onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "promos"] })} />
              ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                    No promo codes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => qc.invalidateQueries({ queryKey: ["admin", "promos"] })} />
    </>
  );
}

function PromoRow({ promo, onChanged }: { promo: Promo; onChanged: () => void }) {
  const updateFn = useServerFn(adminUpdatePromoCode);
  const deleteFn = useServerFn(adminDeletePromoCode);
  const { confirm, prompt } = useConfirm();

  const toggle = useMutation({
    mutationFn: (active: boolean) => updateFn({ data: { id: promo.id, active } }),
    onSuccess: () => {
      toast.success(promo.active ? "Deactivated" : "Activated");
      onChanged();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { id: promo.id } }),
    onSuccess: () => {
      toast.success("Deleted");
      onChanged();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setOffer = useMutation({
    mutationFn: (id: string | null) =>
      updateFn({ data: { id: promo.id, razorpay_offer_id: id } }),
    onSuccess: () => {
      toast.success("Razorpay offer linked");
      onChanged();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const expired = promo.expires_at ? new Date(promo.expires_at).getTime() < Date.now() : false;
  const fullyRedeemed = promo.max_redemptions !== null && promo.redemptions_count >= promo.max_redemptions;

  return (
    <tr className="hover:bg-hover/40 text-[13px] align-middle">
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-2">
          <code className="font-mono text-[12.5px] font-semibold text-foreground">{promo.code}</code>
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(promo.code);
              toast.success("Code copied");
            }}
            aria-label="Copy code"
          >
            <Copy className="size-3" />
          </button>
        </div>
        {promo.description && (
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[280px]">
            {promo.description}
          </div>
        )}
      </td>
      <td className="py-2.5 px-4 text-foreground">{formatDiscount(promo)}</td>
      <td className="py-2.5 px-4">
        {promo.discount_type === "trial_days" ? (
          <span className="text-[11px] text-muted-foreground">n/a</span>
        ) : promo.razorpay_offer_id ? (
          <code className="text-[11px] text-muted-foreground font-mono truncate max-w-[140px] inline-block align-middle">
            {promo.razorpay_offer_id}
          </code>
        ) : (
          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium border bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            Not linked
          </span>
        )}
      </td>
      <td className="py-2.5 px-4 text-muted-foreground">
        {promo.redemptions_count}
        {promo.max_redemptions !== null ? ` / ${promo.max_redemptions}` : ""}
      </td>
      <td className="py-2.5 px-4 text-muted-foreground">{promo.per_user_limit}</td>
      <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
        {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : "Never"}
      </td>
      <td className="py-2.5 px-4">
        <span
          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium border ${
            !promo.active
              ? "bg-muted text-muted-foreground border-border"
              : expired || fullyRedeemed
                ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                : "bg-green-500/10 text-green-600 border-green-500/20"
          }`}
        >
          {!promo.active ? "Inactive" : expired ? "Expired" : fullyRedeemed ? "Exhausted" : "Active"}
        </span>
      </td>
      <td className="py-2.5 px-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-md hover:bg-hover text-muted-foreground">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => toggle.mutate(!promo.active)}>
              {promo.active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            {promo.discount_type !== "trial_days" && (
              <DropdownMenuItem
                onSelect={async (e) => {
                  e.preventDefault();
                  const v = await prompt({
                    title: "Razorpay offer ID",
                    description:
                      "Paste the offer_id from your Razorpay Dashboard (Offers). Leave blank to unlink.",
                    placeholder: "offer_XXXXXXXXXXXX",
                    defaultValue: promo.razorpay_offer_id ?? "",
                  });
                  if (v === null) return;
                  setOffer.mutate(v.trim() || null);
                }}
              >
                <Link2 className="size-3.5 mr-2" /> Razorpay offer ID
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={async (e) => {
                e.preventDefault();
                const ok = await confirm({
                  title: `Delete ${promo.code}?`,
                  description: "This cannot be undone. Redemption history will be removed.",
                  confirmLabel: "Delete",
                  destructive: true,
                });
                if (ok) del.mutate();
              }}
            >
              <Trash2 className="size-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function CreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const createFn = useServerFn(adminCreatePromoCode);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] =
    useState<"percent_off_first" | "amount_off_first" | "trial_days">("percent_off_first");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");

  const reset = () => {
    setCode("");
    setDescription("");
    setDiscountType("percent_off_first");
    setDiscountValue(10);
    setMaxRedemptions("");
    setPerUserLimit(1);
    setExpiresAt("");
    setActive(true);
    setNotes("");
  };

  const mut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          code: code.trim(),
          description: description.trim() || null,
          discount_type: discountType,
          discount_value: Math.floor(discountValue),
          max_redemptions: maxRedemptions ? Math.max(1, Math.floor(Number(maxRedemptions))) : null,
          per_user_limit: Math.max(1, Math.floor(perUserLimit)),
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          active,
          notes: notes.trim() || null,
        },
      }),
    onSuccess: (r) => {
      toast.success(
        r.razorpay_linked
          ? "Code created and linked to Razorpay"
          : discountType === "trial_days"
            ? "Trial code created"
            : "Code saved (Razorpay offer not linked — you may need to configure the plan)",
      );
      reset();
      onOpenChange(false);
      onCreated();
    },
    onError: (e: any) => toast.error(e.message ?? "Could not create code"),
  });

  const validPercent = discountType !== "percent_off_first" || (discountValue >= 1 && discountValue <= 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New promo code</DialogTitle>
          <DialogDescription>
            Users enter this code at checkout to unlock the discount.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3.5 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              placeholder="WELCOME50"
              maxLength={40}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Discount type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent_off_first">% off first month</SelectItem>
                  <SelectItem value="amount_off_first">₹ off first month</SelectItem>
                  <SelectItem value="trial_days">Extra free trial days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>
                {discountType === "percent_off_first"
                  ? "Percent (1–100)"
                  : discountType === "amount_off_first"
                    ? "Amount (₹)"
                    : "Trial days"}
              </Label>
              <Input
                type="number"
                min={1}
                max={discountType === "percent_off_first" ? 100 : 10000}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Max total redemptions</Label>
              <Input
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Per user limit</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Expires at</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Description (shown internally)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Launch promo — 50% off first month"
              maxLength={280}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Internal notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              maxLength={500}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-2/40 px-3 py-2">
            <div>
              <div className="text-[13px] font-medium">Active</div>
              <div className="text-[11px] text-muted-foreground">
                Turn off to disable without deleting.
              </div>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={
              mut.isPending ||
              !code.trim() ||
              !discountValue ||
              discountValue < 1 ||
              !validPercent
            }
          >
            {mut.isPending && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
            Create code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}