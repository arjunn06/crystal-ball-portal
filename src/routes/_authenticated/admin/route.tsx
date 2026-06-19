import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";
import { SectionShell } from "@/components/section-shell";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Blueprint" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const fn = useServerFn(checkIsAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["isAdmin"], queryFn: () => fn() });

  useEffect(() => {
    if (!isLoading && data && !data.isAdmin) navigate({ to: "/account" });
  }, [isLoading, data, navigate]);

  if (isLoading || !data?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        {isLoading ? "Loading…" : "Forbidden — redirecting"}
      </div>
    );
  }

  return (
    <SectionShell
      eyebrow="CONTROL ROOM"
      title="ADMIN"
      isAdmin
      nav={[
        { to: "/admin", label: "Dashboard" },
        { to: "/admin/users", label: "Users" },
        { to: "/admin/applications", label: "Applications" },
        { to: "/admin/payments", label: "Payments & subs" },
        { to: "/admin/bookings", label: "Bookings" },
        { to: "/admin/courses", label: "Courses" },
        { to: "/admin/discord", label: "Discord claims" },
      ]}
    >
      <Outlet />
    </SectionShell>
  );
}