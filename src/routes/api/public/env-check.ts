import { createFileRoute } from "@tanstack/react-router";

/**
 * Temporary diagnostic: reports whether each server variable is visible to the running site.
 * It returns true or false only, never a value. Delete this file once payments work.
 */
const NAMES = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_PLAN_ID",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_BOT_TOKEN",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "SEND_EMAIL_HOOK_SECRET",
];

export const Route = createFileRoute("/api/public/env-check")({
  server: {
    handlers: {
      GET: async () => {
        const present: Record<string, boolean> = {};
        for (const n of NAMES) present[n] = !!process.env[n];
        return new Response(
          JSON.stringify(
            { present, variablesVisibleToSite: Object.keys(process.env).length },
            null,
            2,
          ),
          { headers: { "content-type": "application/json", "cache-control": "no-store" } },
        );
      },
    },
  },
});
