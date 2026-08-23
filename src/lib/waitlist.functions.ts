import { createServerFn } from "@tanstack/react-start";
import { waitlistSchema } from "./waitlist.schema";

export const joinRedPillWaitlist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => waitlistSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("redpill_waitlist").insert({
      email: data.email.toLowerCase(),
      phone: data.phone,
      name: data.name ?? null,
    });
    if (error && error.code !== "23505") {
      throw new Error("Could not join the waitlist. Please try again.");
    }
    return { ok: true as const };
  });
