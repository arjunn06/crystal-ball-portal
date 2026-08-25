/** Server-only helpers for Red Pill waitlist payment invites. */

export async function assertAdminUser(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export function newInviteToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "").slice(0, 40);
}

/** Does this email hold an unused, unexpired invite? */
export async function findValidInvite(token: string, email: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: inv } = await supabaseAdmin
    .from("redpill_invites")
    .select("id, email, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();
  if (!inv) return null;
  if (inv.used_at) return null;
  if (new Date(inv.expires_at).getTime() < Date.now()) return null;
  if (email && inv.email.toLowerCase() !== email.toLowerCase()) return null;
  return inv;
}

export async function markInviteUsed(inviteId: string, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("redpill_invites")
    .update({ used_at: new Date().toISOString(), used_by: userId })
    .eq("id", inviteId)
    .is("used_at", null);
}

export async function markInviteUsedByOrder(orderId: string, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: inv } = await supabaseAdmin
    .from("redpill_invites")
    .select("id")
    .eq("used_by", userId)
    .is("used_at", null)
    .maybeSingle();
  if (inv) await markInviteUsed(inv.id, userId);
  void orderId;
}
