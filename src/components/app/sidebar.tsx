import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo-icon";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};

export type SidebarUser = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export function AppSidebar({
  items,
  sections,
  footer,
  brand,
  topOffset = false,
  user,
}: {
  items?: NavItem[];
  sections?: NavSection[];
  footer?: ReactNode;
  brand?: { label: string; sub?: string };
  topOffset?: boolean;
  user?: SidebarUser;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const groups: NavSection[] = sections ?? [{ items: items ?? [] }];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const nav = (
    <nav
      className={cn("flex-1 overflow-y-auto no-scrollbar px-3 pb-6", topOffset ? "pt-5" : "pt-2")}
    >
      {groups.map((group, gi) => (
        <div key={gi} className={cn(gi > 0 && "mt-7")}>
          {group.label && (
            <p className="mb-2 px-3 text-xs font-medium text-muted-foreground/70">{group.label}</p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.to === pathname ||
                (item.to !== "/app" &&
                  item.to !== "/admin" &&
                  pathname.startsWith(item.to + "/")) ||
                (item.to === "/app" && pathname === "/app") ||
                (item.to === "/admin" && pathname === "/admin");
              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                    active
                      ? "bg-surface-2 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-hover/50 hover:text-foreground",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-foreground"
                    />
                  )}
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const brandHeader = (
    <div className="px-5 pb-4 pt-5">
      <Link to="/" className="group flex items-center gap-2.5">
        <LogoIcon className="size-8 text-foreground" />
        <div className="min-w-0">
          <p className="font-display text-[17px] font-extrabold leading-none tracking-tight">
            {brand?.label ?? "Blueprint"}
          </p>
          {brand?.sub && <p className="mt-1.5 text-xs text-muted-foreground">{brand.sub}</p>}
        </div>
      </Link>
    </div>
  );

  const userHeader = user && (
    <div className="flex items-center gap-3 px-5 pb-4 pt-5">
      <UserAvatar user={user} size={40} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name ?? "Member"}</p>
        {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className={cn(
              "fixed left-3 z-50 grid size-10 place-items-center rounded-lg border border-border bg-background/90 text-foreground shadow-sm backdrop-blur md:hidden",
              topOffset ? "top-2" : "top-3",
            )}
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-72 flex-col border-r border-border bg-sidebar p-0"
        >
          {user ? userHeader : brandHeader}
          {nav}
          {footer && <div className="border-t border-border p-3">{footer}</div>}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar md:flex",
          topOffset ? "bottom-0 top-14" : "inset-y-0",
        )}
      >
        {!topOffset && brandHeader}
        {nav}
        {footer && <div className="border-t border-border p-3">{footer}</div>}
      </aside>
    </>
  );
}

export function UserAvatar({
  user,
  size = 32,
  className,
}: {
  user: SidebarUser;
  size?: number;
  className?: string;
}) {
  const initials =
    user.name?.trim().slice(0, 2).toUpperCase() ??
    user.email?.trim().slice(0, 2).toUpperCase() ??
    "··";
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-2 border border-border grid place-items-center overflow-hidden shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name ?? user.email ?? "Avatar"}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : user.name || user.email ? (
        <span className="text-[11px] font-medium leading-none">{initials}</span>
      ) : (
        <User className="size-1/2 text-muted-foreground" />
      )}
    </div>
  );
}

export function AppShell({
  children,
  topOffset = false,
  full = false,
}: {
  children: ReactNode;
  topOffset?: boolean;
  full?: boolean;
}) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <main className={cn(full ? "" : "md:pl-60", "min-h-[100dvh]", topOffset && "pt-14")}>
        <div
          className={cn(
            "mx-auto max-w-[1180px] px-5 sm:px-8 md:px-10 md:py-12",
            topOffset ? "py-8" : "pb-10 pt-16",
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

export function TopBar({
  brand,
  right,
}: {
  brand?: { label: string; sub?: string };
  right?: ReactNode;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:px-6">
      <Link to="/" className="flex items-center gap-2.5 pl-12 md:pl-0">
        <LogoIcon className="size-8 text-foreground" />
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[15px] font-extrabold tracking-tight">
            {brand?.label ?? "Blueprint"}
          </p>
          {brand?.sub && <p className="text-xs text-muted-foreground">{brand.sub}</p>}
        </div>
      </Link>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em] md:text-[2.4rem] md:leading-[1.05]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface", className)}>{children}</div>
  );
}

export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds < 1) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
