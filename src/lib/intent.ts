/**
 * Red Pill registrations are closed, so there is no longer an offer-specific
 * post-auth destination. Any legacy "bp_intent" value left in a returning
 * visitor's browser is cleared so it can't hijack the Blue Pill flow.
 */
export function getIntent(): null {
  try {
    localStorage.removeItem("bp_intent");
  } catch {
    /* ignore */
  }
  return null;
}

export function postAuthTarget(): "/app" {
  getIntent();
  return "/app";
}
