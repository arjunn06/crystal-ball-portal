import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { checkIsAdmin } from "@/lib/admin.functions";
import { AppShell, AppSidebar, TopBar, type NavSection } from "@/components/app/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/app/sign-out-button";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Blueprint" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const fn = useServerFn(checkIsAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["isAdmin"], queryFn: () => fn() });

  useEffect(() => {
    if (!isLoading && data && !data.isAdmin) navigate({ to: "/app" });
  }, [isLoading, data, navigate]);

  if (isLoading || !data?.isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">
        {isLoading ? "Loading…" : "Forbidden — redirecting"}
      </div>
    );
  }

  const sections: NavSection[] = [
    {
      label: "Overview",
      items: [
        { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
        { to: "/admin/subscriptions", label: "Payments", icon: <CreditCard className="size-4" /> },
        { to: "/admin/users", label: "Users", icon: <Users className="size-4" /> },
        { to: "/admin/discord", label: "Discord", icon: <MessageCircle className="size-4" /> },
      ],
    },
    {
      label: "Your Apps",
      items: [
        { to: "/admin/courses", label: "Courses", icon: <BookOpen className="size-4" /> },
        { to: "/app", label: "Back to app", icon: <ArrowLeft className="size-4" /> },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar
        brand={{ label: "The Blueprint", sub: "by Arjun IFVG" }}
        right={
          <>
            <ThemeToggle />
            <SignOutButton />
          </>
        }
      />
      <AppSidebar
        sections={sections}
        topOffset
      />
      <AppShell topOffset>
        <Outlet />
      </AppShell>
    </div>
  );
}