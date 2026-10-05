import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/logo-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar, type NavItem, type SidebarUser } from "@/components/app/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Settings, Shield } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Member shell: top navigation on desktop, bottom tab bar on phones.   */
/* ------------------------------------------------------------------ */

function isActive(pathname: string, to: string) {
  return to === "/app" ? pathname === "/app" : pathname === to || pathname.startsWith(to + "/");
}

export function MemberShell({
  items,
  user,
  isAdmin,
  children,
}: {
  items: NavItem[];
  user: SidebarUser;
  isAdmin?: boolean;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const tabs = items.filter((i) => i.to !== "/admin");

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8 md:px-10">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Blueprint home">
              <LogoIcon className="size-8" />
              <span className="font-display text-[17px] font-extrabold tracking-tight">
                Blueprint
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Member">
              {tabs.map((item) => {
                const active = isActive(pathname, item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors",
                      active
                        ? "bg-surface-2 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-hover/50 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <UserAvatar user={user} size={36} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{user.name ?? "Member"}</p>
                  {user.email && (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/settings" className="cursor-pointer">
                    <Settings className="mr-2 size-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Shield className="mr-2 size-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 pb-28 pt-10 sm:px-8 md:px-10 md:pb-16 md:pt-14">
        {children}
      </main>

      {tabs.length > 1 && (
        <nav
          aria-label="Member"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        >
          <ul
            className="grid"
            style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
          >
            {tabs.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to as any}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="grid size-5 place-items-center">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small building blocks shared by member and admin pages.              */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  className,
  tone = "blue",
}: {
  value: number;
  className?: string;
  tone?: "blue" | "red" | "neutral";
}) {
  const fill = tone === "blue" ? "bg-pill-blue" : tone === "red" ? "bg-pill-red" : "bg-foreground";
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", fill)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

const PILL_TONES = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  neutral: "border-border bg-surface-2 text-muted-foreground",
  blue: "border-pill-blue/30 bg-pill-blue/10 text-pill-blue",
  red: "border-pill-red/30 bg-pill-red/10 text-pill-red",
} as const;

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof PILL_TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-medium",
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Flat figures separated by hairlines, one container instead of a row of cards. */
export function StatStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        "grid divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface sm:divide-x sm:divide-y-0",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-6", className)}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] tabular-nums">
        {value}
      </dd>
      {sub && <p className="mt-1.5 truncate text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mb-5 grid size-12 place-items-center rounded-xl bg-surface-2 text-muted-foreground">
          {icon}
        </span>
      )}
      <p className="font-display text-xl font-bold tracking-tight">{title}</p>
      {body && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-2", className)} />;
}

export function MemberHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-12">
      <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[3.4rem]">
        {title}
      </h1>
      {description && (
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}
