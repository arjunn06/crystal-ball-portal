/** Server-only helpers for Red Pill waitlist payment invites. */

export async function assertAdminUser(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/** One shared invite link unlocks checkout for every waitlist member. */
export async function findValidInvite(token: string, _email: string | null) {
  const { SHARED_INVITE_TOKEN } = await import("./redpill-invite.shared");
  if (token !== SHARED_INVITE_TOKEN) return null;
  return { id: SHARED_INVITE_TOKEN };
}
