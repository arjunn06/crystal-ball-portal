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
  if (!sub || sub.status !== "active") return false;
  if (!sub.current_period_end) return false; // no paid-through date = no access
  return new Date(sub.current_period_end).getTime() > Date.now();
}
