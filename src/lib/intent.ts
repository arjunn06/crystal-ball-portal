/** Where a user belongs right after signing in, based on the offer they came from. */
export function getIntent(): "redpill" | null {
  try {
    return localStorage.getItem("bp_intent") === "redpill" ? "redpill" : null;
  } catch {
    return null;
  }
}

export function postAuthTarget(): "/enroll" | "/app" {
  return getIntent() === "redpill" ? "/enroll" : "/app";
}
