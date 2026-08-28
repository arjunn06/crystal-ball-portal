/**
 * Server-only Razorpay helpers shared by billing, webhooks and the sweep.
 */
export function razorpayAuthHeader(): string | null {
  const keyId = process.env['RAZORPAY_KEY_ID'];
  const secret = process.env['RAZORPAY_KEY_SECRET'];
  if (!keyId || !secret) return null;
  return "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64");
}

export type RemoteSubscription = {
  status?: string;
  current_end?: number;
  charge_at?: number;
  end_at?: number;
  ended_at?: number;
};

export async function fetchRemoteSubscription(
  subscriptionId: string,
): Promise<RemoteSubscription | null> {
  const auth = razorpayAuthHeader();
  if (!auth || !subscriptionId.startsWith("sub_")) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
      headers: { Authorization: auth },
    });
    if (!res.ok) return null;
    return (await res.json()) as RemoteSubscription;
  } catch (err) {
    console.warn("fetchRemoteSubscription failed", subscriptionId, err);
    return null;
  }
}

/**
 * The date access should run through. Razorpay reports `current_end` for the
 * period already paid for; on a cancelled/halted mandate it may only expose
 * `charge_at` / `end_at`. We take the furthest of these so cancelling autopay
 * never shortens the window the member already paid for.
 */
export function paidThroughFromRemote(remote: RemoteSubscription | null): string | null {
  if (!remote) return null;
  const candidates = [remote.current_end, remote.charge_at, remote.end_at].filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (!candidates.length) return null;
  return new Date(Math.max(...candidates) * 1000).toISOString();
}

/** Never move a paid-through date earlier than what we already stored. */
export function latestPeriodEnd(
  existing: string | null | undefined,
  next: string | null | undefined,
): string | null {
  const a = existing ? new Date(existing).getTime() : 0;
  const b = next ? new Date(next).getTime() : 0;
  if (!a && !b) return null;
  return b > a ? next! : (existing ?? null);
}
