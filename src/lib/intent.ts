/**
 * Red Pill registrations are closed to the public. Waitlist members get a
 * shared priority-access password; once it is accepted we stash a flag in
 * localStorage so it survives the passwordless sign-in round trip and unlocks
 * checkout afterwards.
 */
const CODE_KEY = "bp_redpill_code";

export function setRedPillCode(code: string) {
  try {
    localStorage.setItem(CODE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function getRedPillCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

export function clearRedPillCode() {
  try {
    localStorage.removeItem(CODE_KEY);
    localStorage.removeItem("bp_redpill_invite");
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
  return getRedPillCode() ? "/enroll" : "/app";
}
