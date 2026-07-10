import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const handleRegex = /^[a-zA-Z0-9_]{3,20}$/;

export const checkHandleAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        handle: z.string().trim().min(3).max(20).regex(handleRegex),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const handle = data.handle.trim();
    const lower = handle.toLowerCase();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: reserved } = await supabaseAdmin
      .from("reserved_handles")
      .select("handle")
      .eq("handle", lower)
      .maybeSingle();
    if (reserved) return { available: false, reason: "reserved" as const };

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("handle", handle)
      .neq("id", context.userId)
      .maybeSingle();
    if (existing) return { available: false, reason: "taken" as const };

    return { available: true as const };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        full_name: z.string().trim().min(1).max(80),
        handle: z.string().trim().min(3).max(20).regex(handleRegex),
        avatar_url: z.string().url().max(2048).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const lower = data.handle.toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: reserved } = await supabaseAdmin
      .from("reserved_handles")
      .select("handle")
      .eq("handle", lower)
      .maybeSingle();
    if (reserved) throw new Error("That handle is reserved. Try another.");

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("handle", data.handle)
      .neq("id", context.userId)
      .maybeSingle();
    if (existing) throw new Error("That handle is already taken.");

    const patch: {
      full_name: string;
      handle: string;
      avatar_url?: string | null;
    } = {
      full_name: data.full_name,
      handle: data.handle,
    };
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signAvatarUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ path: z.string().min(1).max(512) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (!data.path.startsWith(`${context.userId}/`)) {
      throw new Error("Not allowed");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("avatars")
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);
    if (error || !signed) throw new Error(error?.message ?? "Could not sign avatar URL");
    return { url: signed.signedUrl };
  });
