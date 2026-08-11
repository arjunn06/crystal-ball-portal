/**
 * Single source of truth for "does this row grant access right now?".
 * Mirrors the database function public.has_active_membership so the app,
 * the Discord flows and RLS never disagree.
 */
export type SubscriptionRow = {
  status?: string | null;
  current_period_end?: string | null;
} | null;

export function isEntitled(sub: SubscriptionRow): boolean {
  // Cancelling stops renewal, not access already paid for. Razorpay reports a
  // subscription as `cancelled` immediately even when current_end is still in
  // the future, so both states grant access through the paid-through date.
  if (!sub || !["active", "cancelled"].includes(sub.status ?? "")) return false;
  if (!sub.current_period_end) return false; // no paid-through date = no access
  return new Date(sub.current_period_end).getTime() > Date.now();
}
