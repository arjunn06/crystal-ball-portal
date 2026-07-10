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
    <nav className={cn("flex-1 overflow-y-auto no-scrollbar px-3 pb-6", topOffset ? "pt-5" : "")}>
        {groups.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-6")}>
            {group.label && (
              <p className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
          const active =
            item.to === pathname ||
            (item.to !== "/app" && item.to !== "/admin" && pathname.startsWith(item.to + "/")) ||
            (item.to === "/app" && pathname === "/app") ||
            (item.to === "/admin" && pathname === "/admin");
          return (
            <Link
              key={item.to}
              to={item.to as any}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-hover/60 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center size-4 shrink-0",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              >
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
    <div className="px-5 pt-5 pb-4">
      <Link to="/" className="flex items-center gap-2.5 group">
        <LogoIcon className="size-8 text-foreground" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight leading-none">
            {brand?.label ?? "Blueprint"}
          </p>
          {brand?.sub && <p className="text-[11px] text-muted-foreground mt-1">{brand.sub}</p>}
        </div>
      </Link>
    </div>
  );

  const userHeader = user && (
    <div className="px-5 pt-5 pb-4 flex items-center gap-3">
      <UserAvatar user={user} size={40} />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{user.name ?? "Member"}</p>
        {user.email && (
          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
        )}
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
              "md:hidden fixed left-3 z-50 grid place-items-center size-10 rounded-lg border border-border/70 bg-background/90 backdrop-blur text-foreground shadow-sm",
              topOffset ? "top-2" : "top-3",
            )}
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-sidebar flex flex-col border-r border-border/70">
          {user ? userHeader : brandHeader}
          {nav}
          {footer && <div className="border-t border-border/70 p-3">{footer}</div>}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 w-60 flex-col border-r border-border/70 bg-sidebar z-30",
          topOffset ? "top-14 bottom-0" : "inset-y-0",
        )}
      >
        {!topOffset && brandHeader}
        {nav}
        {footer && <div className="border-t border-border/70 p-3">{footer}</div>}
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
        "rounded-full bg-surface-2 border border-border grid place-items-center overflow-hidden shrink-0",
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

export function AppShell({ children, topOffset = false }: { children: ReactNode; topOffset?: boolean }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className={cn("md:pl-60 min-h-screen", topOffset && "pt-14")}>
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 md:py-10">{children}</div>
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
    <header className="fixed top-0 inset-x-0 h-14 z-40 border-b border-border/70 bg-background/95 backdrop-blur flex items-center justify-between px-5 md:px-6">
      <Link to="/" className="flex items-center gap-2.5">
        <LogoIcon className="size-8 text-foreground" />
        <div className="min-w-0 leading-tight">
          <p className="text-[14px] font-semibold tracking-tight">
            {brand?.label ?? "Blueprint"}
          </p>
          {brand?.sub && <p className="text-[11px] text-muted-foreground">{brand.sub}</p>}
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
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds < 1) return "—";
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