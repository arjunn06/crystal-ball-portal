import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { checkIsAdmin } from "@/lib/admin.functions";
import { AppShell, AppSidebar, type NavSection } from "@/components/app/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/app/sign-out-button";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  ArrowLeft,
  ScrollText,
  Ticket,
  ClipboardList,
} from "lucide-react";
import { DiscordIcon } from "@/components/discord-icon";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin | Blueprint" }] }),
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
        {isLoading ? "Loading" : "Not allowed. Redirecting"}
      </div>
    );
  }

  const sections: NavSection[] = [
    {
      label: "Manage",
      items: [
        { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
        { to: "/admin/subscriptions", label: "Payments", icon: <CreditCard className="size-4" /> },
        { to: "/admin/users", label: "Users", icon: <Users className="size-4" /> },
        {
          to: "/admin/waitlist",
          label: "Red Pill waitlist",
          icon: <ClipboardList className="size-4" />,
        },
        { to: "/admin/promos", label: "Promo codes", icon: <Ticket className="size-4" /> },
        { to: "/admin/discord", label: "Discord", icon: <DiscordIcon className="size-4" /> },
        { to: "/admin/audit", label: "Audit log", icon: <ScrollText className="size-4" /> },
      ],
    },
    {
      label: "Content",
      items: [{ to: "/admin/courses", label: "Courses", icon: <BookOpen className="size-4" /> }],
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <AppSidebar
        sections={sections}
        brand={{ label: "Blueprint", sub: "Admin" }}
        footer={
          <div className="space-y-1">
            <Link
              to="/app"
              className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-hover/50 hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to app
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SignOutButton />
              </div>
              <ThemeToggle />
            </div>
          </div>
        }
      />
      <AppShell>
        <Outlet />
      </AppShell>
    </div>
  );
}
