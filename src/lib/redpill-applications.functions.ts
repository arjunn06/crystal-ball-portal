import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "./redpill-invite.server";
import { applicationStatusSchema } from "./applications.schema";
import { REDPILL_APPLICATIONS_OPEN, redpillApplicationSchema } from "./redpill-applications.schema";

/** Public: someone applies for a Red Pill call. Arjun picks who gets a slot. */
export const submitRedPillApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => redpillApplicationSchema.parse(data))
  .handler(async ({ data }) => {
    if (!REDPILL_APPLICATIONS_OPEN) throw new Error("Applications are closed.");
    // Bots fill the hidden field. Pretend it worked and store nothing.
    if (data.website) return { ok: true as const, duplicate: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("redpill_applications").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      age: data.age,
      stage: data.stage,
      ready_to_pay: data.readyToPay,
    });
    if (error?.code === "23505") return { ok: true as const, duplicate: true };
    if (error) throw new Error("Could not submit your application. Please try again.");
    return { ok: true as const, duplicate: false };
  });

export const adminListRedPillApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminUser(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("redpill_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { applications: data ?? [] };
  });

export const adminUpdateRedPillApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: applicationStatusSchema,
        adminNotes: z.string().trim().max(4000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdminUser(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("redpill_applications")
      .update({
        status: data.status,
        admin_notes: data.adminNotes || null,
        reviewed_at: data.status === "new" ? null : new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
