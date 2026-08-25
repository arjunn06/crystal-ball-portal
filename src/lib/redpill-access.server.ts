/**
 * Red Pill priority access is gated by one shared password that waitlist
 * members receive by email / message. Server-only: the expected value never
 * reaches the browser and comparison is timing-safe.
 */
import { createHash, timingSafeEqual } from "crypto";

export function redPillCodeMatches(input: string): boolean {
  const expected = process.env['REDPILL_ACCESS_PASSWORD'];
  if (!expected) return false;
  const a = createHash("sha256").update(input.trim(), "utf8").digest();
  const b = createHash("sha256").update(expected.trim(), "utf8").digest();
  return timingSafeEqual(a, b);
}
