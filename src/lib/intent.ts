/**
 * Red Pill registrations are closed to the public. Waitlist members receive a
 * single-use invite link; the token is stashed in localStorage so it survives
 * the passwordless sign-in round trip and unlocks checkout afterwards.
 */
const INVITE_KEY = "bp_redpill_invite";

export function setRedPillInvite(token: string) {
  try {
    localStorage.setItem(INVITE_KEY, token);
  } catch {
    /* ignore */
  }
}

export function getRedPillInviteToken(): string | null {
  try {
    return localStorage.getItem(INVITE_KEY);
  } catch {
    return null;
  }
}

export function clearRedPillInvite() {
  try {
    localStorage.removeItem(INVITE_KEY);
  } catch {
    /* ignore */
  }
}

export function getIntent(): null {
  try {
    localStorage.removeItem("bp_intent");
  } catch {
    /* ignore */
  }
  return null;
}

export function postAuthTarget(): "/app" | "/enroll" {
  getIntent();
  return getRedPillInviteToken() ? "/enroll" : "/app";
}
