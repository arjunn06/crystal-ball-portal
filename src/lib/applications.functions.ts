import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminUser } from "./redpill-invite.server";
import {
  APPLICATIONS_OPEN,
  applicationSchema,
  applicationStatusSchema,
} from "./applications.schema";

/** Public: someone applies for Arjun IFVG's 1-1 training. Every application is reviewed by hand. */
export const submitOneOnOneApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }) => {
    if (!APPLICATIONS_OPEN) throw new Error("Applications are closed.");
    // Bots fill the hidden field. Pretend it worked and store nothing.
    if (data.website) return { ok: true as const, duplicate: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("one_on_one_applications").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      location: data.location,
      discord: data.discord || null,
      social: data.social || null,
      experience: data.experience,
      stage: data.stage,
      ifvg_level: data.ifvgLevel,
      markets: data.markets || null,
      struggle: data.struggle,
      goal: data.goal,
      why_you: data.whyYou,
      hours_per_week: data.hoursPerWeek,
      investment: data.investment,
      availability: data.availability,
    });
    if (error?.code === "23505") return { ok: true as const, duplicate: true };
    if (error) throw new Error("Could not submit your application. Please try again.");
    return { ok: true as const, duplicate: false };
  });

export const adminListApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminUser(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("one_on_one_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { applications: data ?? [] };
  });

export const adminUpdateApplication = createServerFn({ method: "POST" })
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
      .from("one_on_one_applications")
      .update({
        status: data.status,
        admin_notes: data.adminNotes || null,
        reviewed_at: data.status === "new" ? null : new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
