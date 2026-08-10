# Unify email design with the Blueprint brand

## What's wrong today

The emails were built in three waves and never reconciled:

- **The five auth emails** — confirm email, reset password, invite, email change, reauthentication — still use the stock template look: white background, default system fonts, generic blue button, no brand at all.
- **Login code (OTP)** and **Red Pill enrolment** look on-brand, but each hardcodes its own copy of the colours, fonts and spacing, so they've already drifted from each other.
- Only the three Blue Pill lifecycle emails use the shared shell.
- No email carries the Blueprint logo, and none distinguishes Red Pill vs Blue Pill by colour the way the site does.

## The fix

Make the shared shell the single source of truth and route every template through it.

**1. Upgrade the shared shell**
- Add the Blueprint logo mark at the top of the card (hosted PNG, since mail clients don't render SVG).
- Add an `accent` option: brand blue `#1E6BFF` for account/auth and Blue Pill mail, brand red `#E53935` for Red Pill mail — drives the eyebrow, button and a thin hairline at the top of the card.
- Standardise the footer: wordmark line, "Blueprint by Arjun IFVG", and the unsubscribe slot the system appends for app emails.
- Keep the outer page white (mail-client requirement) with the dark `#101014` card inside, as today.
- Consolidate the type scale, info box, label/value rows and pill button into shell exports so no template re-declares them.

**2. Re-skin the five auth emails** onto the shell with the blue accent, brand headline voice, and the same card and typography as the login code mail.

**3. Move login code and Red Pill enrolment onto the shell**, deleting their local style blocks. Red Pill enrolment switches to the red accent; the OTP code block keeps its oversized monospace treatment but takes its colours from the shell.

**4. Consistent copy pass** across all eleven: short sentence-case headline, one short paragraph, one action, quiet closing line. No exclamation-heavy stock phrasing.

Result: all eleven emails share one card, one logo, one type scale, one button and one footer — blue for account and Blue Pill mail, red for Red Pill mail.

## Technical notes

- `src/lib/email-templates/_shell.tsx` becomes the only place colours, fonts and spacing are defined; an `accent` prop replaces the current `eyebrowColor`.
- The logo must be an absolute https PNG URL (uploaded to storage) — inline SVG and CSS backgrounds are stripped by Outlook.
- Templates touched: `signup`, `recovery`, `invite`, `email-change`, `reauthentication`, `magic-link`, `redpill-enrolled`, plus the three `bluepill-*` files for the accent API change.
- Fonts fall back `Archivo` → `Inter` → system and `Clash Display` → `Inter` → system, since custom webfonts don't load in most clients; weights and letter-spacing are tuned so the fallback still reads as Blueprint.
- No changes to sending, queueing, registry names or triggers — visual only.
- Check each template afterwards in the Emails preview.