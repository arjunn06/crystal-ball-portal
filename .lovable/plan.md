1. Redesign `src/lib/email-templates/magic-link.tsx`
   - Keep `<Body>` background `#ffffff` for email-client compatibility.
   - Wrap content in a dark inner `<Container>` using brand colors: background `#101014`, text `#FAFAFA`, muted text `#8B8B96`.
   - Use brand red `#E53935` for the OTP code display.
   - Use Clash Display (with web-safe fallbacks) for the heading and Archivo for body text.
   - Add generous padding and rounded corners (`12px` radius) to match the 8px spacing grid.
   - Include a small "Blueprint by Arjun IFVG" sign-off/footer.
   - Update `<Preview>` text to match the new subject.

2. Update the email subject in `src/routes/lovable/email/auth/webhook.ts`
   - Change `EMAIL_SUBJECTS['magiclink']` from `'Your login link'` to `'Arjun IFVG - Login OTP'`.

3. Verify the build passes after edits.