import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

async function assertMember(ctx: { supabase: any; userId: string }) {
  // Admins always have access.
  const { data: isAdmin } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (isAdmin) return true;
  const { data: sub } = await ctx.supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  return sub?.status === "active";
}

/* ---------------- MEMBER ---------------- */

export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ok = await assertMember(context);
    if (!ok) return [];
    const { supabase, userId } = context;
    const [{ data: courses }, { data: modules }, { data: lessons }, { data: progress }] =
      await Promise.all([
        supabase
          .from("courses")
          .select("id, slug, title, summary, cover_url, sort_order")
          .eq("published", true)
          .order("sort_order"),
        supabase.from("course_modules").select("id, course_id"),
        supabase.from("lessons").select("id, module_id, duration_seconds"),
        supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId),
      ]);

    const doneSet = new Set((progress ?? []).map((p) => p.lesson_id));
    const modulesByCourse = new Map<string, string[]>();
    (modules ?? []).forEach((m) => {
      const arr = modulesByCourse.get(m.course_id) ?? [];
      arr.push(m.id);
      modulesByCourse.set(m.course_id, arr);
    });

    const enriched = (courses ?? []).map((c) => {
      const modIds = modulesByCourse.get(c.id) ?? [];
      const cLessons = (lessons ?? []).filter((l) => modIds.includes(l.module_id));
      const done = cLessons.filter((l) => doneSet.has(l.id)).length;
      const totalDuration = cLessons.reduce((s, l) => s + (l.duration_seconds ?? 0), 0);
      return {
        ...c,
        moduleCount: modIds.length,
        lessonCount: cLessons.length,
        completedCount: done,
        totalDurationSeconds: totalDuration,
      };
    });
    return enriched;
  });

export const getCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const ok = await assertMember(context);
    if (!ok) throw new Error("Membership required");
    const { supabase, userId } = context;
    const { data: course } = await supabase
      .from("courses")
      .select("id, slug, title, summary, cover_url")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!course) throw new Error("Course not found");

    const { data: modules } = await supabase
      .from("course_modules")
      .select("id, title, summary, sort_order")
      .eq("course_id", course.id)
      .order("sort_order");
    const moduleIds = (modules ?? []).map((m) => m.id);
    const { data: lessons } = moduleIds.length
      ? await supabase
          .from("lessons")
          .select("id, module_id, title, description, video_url, duration_seconds, sort_order")
          .in("module_id", moduleIds)
          .order("sort_order")
      : { data: [] };
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId);

    return {
      course,
      modules: modules ?? [],
      lessons: lessons ?? [],
      completedLessonIds: (progress ?? []).map((p) => p.lesson_id),
    };
  });

export const setLessonComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ lesson_id: z.string().uuid(), completed: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.completed) {
      await supabase.from("lesson_progress").insert({ user_id: userId, lesson_id: data.lesson_id });
    } else {
      await supabase
        .from("lesson_progress")
        .delete()
        .eq("user_id", userId)
        .eq("lesson_id", data.lesson_id);
    }
    return { ok: true };
  });

/* ---------------- ADMIN ---------------- */

export const adminListCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("courses").select("*").order("sort_order");
    return data ?? [];
  });

export const adminGetCourse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ course_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("*")
      .eq("id", data.course_id)
      .maybeSingle();
    const { data: modules } = await supabaseAdmin
      .from("course_modules")
      .select("*")
      .eq("course_id", data.course_id)
      .order("sort_order");
    const ids = (modules ?? []).map((m) => m.id);
    const { data: lessons } = ids.length
      ? await supabaseAdmin.from("lessons").select("*").in("module_id", ids).order("sort_order")
      : { data: [] };
    return { course, modules: modules ?? [], lessons: lessons ?? [] };
  });

const courseSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().max(80).optional().nullable(),
  title: z.string().min(1).max(160),
  summary: z.string().max(1000).optional().nullable(),
  cover_url: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().default(0),
  published: z.boolean().default(false),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "course";
}

export const adminUpsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => courseSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Derive slug from title when missing / empty.
    let slug = (data.slug ?? "").trim();
    if (!slug) {
      const base = slugify(data.title);
      slug = base;
      let n = 2;
      // ensure uniqueness (ignore self on edit)
      while (true) {
        const { data: existing } = await supabaseAdmin
          .from("courses")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!existing || existing.id === data.id) break;
        slug = `${base}-${n++}`;
      }
    }
    if (data.id) {
      const { id, ...rest } = data;
      await supabaseAdmin.from("courses").update({ ...rest, slug }).eq("id", id);
    } else {
      const { id: _, ...rest } = data;
      void _;
      await supabaseAdmin.from("courses").insert({ ...rest, slug });
    }
    return { ok: true };
  });

export const adminDeleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("courses").delete().eq("id", data.id);
    return { ok: true };
  });

const moduleSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().min(1).max(160),
  summary: z.string().max(1000).optional().nullable(),
  sort_order: z.number().int().default(0),
});
export const adminUpsertModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => moduleSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { id, ...rest } = data;
      await supabaseAdmin.from("course_modules").update(rest).eq("id", id);
    } else {
      const { id: _, ...rest } = data;
      void _;
      await supabaseAdmin.from("course_modules").insert(rest);
    }
    return { ok: true };
  });

export const adminDeleteModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("course_modules").delete().eq("id", data.id);
    return { ok: true };
  });

const lessonSchema = z.object({
  id: z.string().uuid().optional(),
  module_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().nullable(),
  video_url: z.string().max(600).optional().nullable(),
  duration_seconds: z.number().int().optional().nullable(),
  sort_order: z.number().int().default(0),
});
export const adminUpsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => lessonSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { id, ...rest } = data;
      await supabaseAdmin.from("lessons").update(rest).eq("id", id);
    } else {
      const { id: _, ...rest } = data;
      void _;
      await supabaseAdmin.from("lessons").insert(rest);
    }
    return { ok: true };
  });

export const adminDeleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("lessons").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------------- VIDEO STORAGE ---------------- */

const VIDEO_BUCKET = "lesson-videos";

// Admin: mint a short-lived signed URL the browser uses to PUT a video
// directly to the private `lesson-videos` bucket. Returns the storage
// path we persist in lessons.video_url as `storage:<path>`.
export const adminSignVideoUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        filename: z.string().min(1).max(200),
        content_type: z.string().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-100);
    const path = `${context.userId}/${Date.now()}-${crypto.randomUUID()}-${safe}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Upload sign failed");
    return {
      storage_key: `storage:${path}`,
      signed_url: signed.signedUrl,
      token: signed.token,
      path,
    };
  });

// Member or admin: mint a short-lived signed download URL for a lesson's
// video when it's stored in the private bucket. Enforces membership so we
// don't hand out download tokens to non-subscribers.
export const getLessonVideoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lesson_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const ok = await assertMember(context);
    if (!ok) throw new Error("Membership required");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lesson } = await supabaseAdmin
      .from("lessons")
      .select("video_url")
      .eq("id", data.lesson_id)
      .maybeSingle();
    const url = lesson?.video_url ?? "";
    if (!url.startsWith("storage:")) throw new Error("Not a hosted video");
    const path = url.slice("storage:".length);
    const { data: signed, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .createSignedUrl(path, 60 * 30); // 30 minutes
    if (error || !signed) throw new Error(error?.message ?? "Sign failed");
    return { url: signed.signedUrl, expires_in: 60 * 30 };
  });