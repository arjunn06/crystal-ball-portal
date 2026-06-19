import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";
import { SectionShell } from "@/components/section-shell";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Blueprint" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  const check = useServerFn(checkIsAdmin);
  const { data } = useQuery({ queryKey: ["isAdmin"], queryFn: () => check() });
  return (
    <SectionShell
      eyebrow="MEMBER AREA"
      title="MY ACCOUNT"
      isAdmin={data?.isAdmin}
      nav={[
        { to: "/account", label: "Overview" },
        { to: "/account/profile", label: "Profile" },
        { to: "/account/billing", label: "Billing" },
        { to: "/account/application", label: "Red Pill application" },
        { to: "/account/courses", label: "Courses" },
        { to: "/account/discord", label: "Discord role" },
      ]}
    >
      <Outlet />
    </SectionShell>
  );
}