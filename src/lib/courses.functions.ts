import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

/* ---------- Public (members) ---------- */
export const listCoursesForMember = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: courses } = await supabase
      .from("courses")
      .select("id, slug, title, summary, cover_url, required_pill, sort_order, published")
      .eq("published", true)
      .order("sort_order");
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId);
    return { courses: courses ?? [], completedLessonIds: (progress ?? []).map((p: any) => p.lesson_id) };
  });

export const getCourseDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: course } = await supabase
      .from("courses")
      .select("id, slug, title, summary, cover_url, required_pill, published")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!course) throw new Error("Not found");
    const { data: modules } = await supabase
      .from("course_modules")
      .select("id, title, summary, sort_order")
      .eq("course_id", course.id)
      .order("sort_order");
    const moduleIds = (modules ?? []).map((m: any) => m.id);
    const { data: lessons } = moduleIds.length
      ? await supabase
          .from("lessons")
          .select("id, module_id, title, description, video_url, duration_seconds, sort_order")
          .in("module_id", moduleIds)
          .order("sort_order")
      : { data: [] as any[] };
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", context.userId);
    return {
      course,
      modules: modules ?? [],
      lessons: lessons ?? [],
      completed: new Set((progress ?? []).map((p: any) => p.lesson_id)),
    };
  });

export const markLessonComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ lesson_id: z.string().uuid(), completed: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.completed) {
      await supabase.from("lesson_progress").upsert({ user_id: userId, lesson_id: data.lesson_id });
    } else {
      await supabase.from("lesson_progress").delete().eq("user_id", userId).eq("lesson_id", data.lesson_id);
    }
    return { ok: true };
  });

/* ---------- Admin ---------- */
export const adminListCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("courses").select("*").order("sort_order");
    return data ?? [];
  });

export const adminUpsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().min(1),
      title: z.string().min(1),
      summary: z.string().optional().nullable(),
      cover_url: z.string().optional().nullable(),
      required_pill: z.enum(["blue", "red"]).default("blue"),
      sort_order: z.number().int().default(0),
      published: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      await supabaseAdmin.from("courses").update(data).eq("id", data.id);
    } else {
      const { id, ...rest } = data;
      void id;
      await supabaseAdmin.from("courses").insert(rest);
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

export const adminGetCourseStructure = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ course_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: course } = await supabaseAdmin.from("courses").select("*").eq("id", data.course_id).maybeSingle();
    const { data: modules } = await supabaseAdmin.from("course_modules").select("*").eq("course_id", data.course_id).order("sort_order");
    const ids = (modules ?? []).map((m: any) => m.id);
    const { data: lessons } = ids.length
      ? await supabaseAdmin.from("lessons").select("*").in("module_id", ids).order("sort_order")
      : { data: [] as any[] };
    return { course, modules: modules ?? [], lessons: lessons ?? [] };
  });

export const adminUpsertModule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      course_id: z.string().uuid(),
      title: z.string().min(1),
      summary: z.string().optional().nullable(),
      sort_order: z.number().int().default(0),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) await supabaseAdmin.from("course_modules").update(data).eq("id", data.id);
    else { const { id, ...rest } = data; void id; await supabaseAdmin.from("course_modules").insert(rest); }
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

export const adminUpsertLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      module_id: z.string().uuid(),
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      video_url: z.string().optional().nullable(),
      duration_seconds: z.number().int().optional().nullable(),
      sort_order: z.number().int().default(0),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) await supabaseAdmin.from("lessons").update(data).eq("id", data.id);
    else { const { id, ...rest } = data; void id; await supabaseAdmin.from("lessons").insert(rest); }
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