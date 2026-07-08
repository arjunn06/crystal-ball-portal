import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getAccountOverview } from "@/lib/account.functions";
import { AppShell, AppSidebar, type NavItem } from "@/components/app/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/app/sign-out-button";
import { LayoutDashboard, BookOpen, MessageCircle, Settings, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Blueprint" }] }),
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const fn = useServerFn(getAccountOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["account", "overview"],
    queryFn: () => fn(),
  });

  useEffect(() => {
    if (!isLoading && data && !data.isSubscribed) {
      navigate({ to: "/subscribe" });
    }
  }, [isLoading, data, navigate]);

  const items: NavItem[] = [
    { to: "/app", label: "Home", icon: <LayoutDashboard className="size-4" /> },
    { to: "/app/courses", label: "Courses", icon: <BookOpen className="size-4" /> },
    { to: "/app/discord", label: "Discord role", icon: <MessageCircle className="size-4" /> },
    { to: "/app/settings", label: "Settings", icon: <Settings className="size-4" /> },
  ];
  if (data?.isAdmin) {
    items.push({ to: "/admin", label: "Admin", icon: <Shield className="size-4" /> });
  }

  const initials =
    data?.profile?.full_name?.slice(0, 2).toUpperCase() ??
    data?.profile?.email?.slice(0, 2).toUpperCase() ??
    "··";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar
        items={items}
        brand={{ label: "Blueprint", sub: "Member area" }}
        footer={
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="size-8 rounded-full bg-surface-2 border border-border grid place-items-center text-[11px] font-medium">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">
                  {data?.profile?.full_name ?? "Member"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {data?.profile?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1"><SignOutButton /></div>
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