import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "./redpill-invite.server";

/**
 * Red Pill registrations are closed to the public, but one shared invite link
 * (`/redpill/invite`) unlocks checkout for waitlist members.
 */
export const adminListWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminUser(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: entries } = await supabaseAdmin
      .from("redpill_waitlist")
      .select("id, email, phone, name, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    return { entries: entries ?? [] };
  });
