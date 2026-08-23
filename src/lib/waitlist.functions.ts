import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  phone: z
    .string()
    .trim()
    .min(7, { message: "Enter a valid phone number" })
    .max(20, { message: "Enter a valid phone number" })
    .regex(/^[+0-9][0-9\s\-()]*$/, { message: "Enter a valid phone number" }),
  name: z.string().trim().max(100).optional(),
});

export const joinRedPillWaitlist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("redpill_waitlist").upsert(
      {
        email: data.email.toLowerCase(),
        phone: data.phone,
        name: data.name ?? null,
      },
      { onConflict: "email" },
    );
    if (error && error.code !== "23505") {
      throw new Error("Could not join the waitlist. Please try again.");
    }
    return { ok: true as const };
  });
