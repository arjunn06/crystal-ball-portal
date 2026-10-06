import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getAccountOverview } from "@/lib/account.functions";
import { type NavItem } from "@/components/app/sidebar";
import { MemberShell } from "@/components/app/ui-kit";
import { LayoutDashboard, BookOpen, Settings, Shield } from "lucide-react";
import { DiscordIcon } from "@/components/discord-icon";
import { getIntent } from "@/lib/intent";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Blueprint" }] }),
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const fn = useServerFn(getAccountOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["account", "overview"],
    queryFn: () => fn(),
  });

  useEffect(() => {
    if (!isLoading && data && !data.isSubscribed) {
      getIntent();
      navigate({ to: "/subscribe" });
    }
  }, [isLoading, data, navigate]);

  // Red Pill members only get the Discord role screen.
  useEffect(() => {
    if (
      !isLoading &&
      data?.isSubscribed &&
      data.pill === "red" &&
      !data.isAdmin &&
      location.pathname !== "/app/discord"
    ) {
      navigate({ to: "/app/discord" });
    }
  }, [isLoading, data, location.pathname, navigate]);

  const isRedPill = data?.pill === "red";

  const items: NavItem[] = isRedPill
    ? [{ to: "/app/discord", label: "Discord role", icon: <DiscordIcon className="size-4" /> }]
    : [
        { to: "/app", label: "Home", icon: <LayoutDashboard className="size-4" /> },
        { to: "/app/courses", label: "Courses", icon: <BookOpen className="size-4" /> },
        { to: "/app/discord", label: "Discord role", icon: <DiscordIcon className="size-4" /> },
        { to: "/app/settings", label: "Settings", icon: <Settings className="size-4" /> },
      ];
  if (data?.isAdmin) {
    items.push({ to: "/admin", label: "Admin", icon: <Shield className="size-4" /> });
  }

  const user = {
    name: data?.profile?.full_name ?? null,
    email: data?.profile?.email ?? null,
    avatarUrl: data?.profile?.avatar_url ?? null,
  };

  return (
    <MemberShell items={items} user={user} isAdmin={data?.isAdmin}>
      <Outlet />
    </MemberShell>
  );
}
