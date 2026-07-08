import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

export function AppSidebar({
  items,
  footer,
  brand,
}: {
  items: NavItem[];
  footer?: ReactNode;
  brand?: { label: string; sub?: string };
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-border/70 bg-sidebar z-30">
      <div className="px-5 pt-5 pb-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="size-8 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center">
            <div className="size-2.5 rounded-full bg-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight leading-none">
              {brand?.label ?? "Blueprint"}
            </p>
            {brand?.sub && <p className="text-[11px] text-muted-foreground mt-1">{brand.sub}</p>}
          </div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 pb-6 space-y-0.5">
        {items.map((item) => {
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
                  ? "bg-hover text-foreground"
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
      </nav>
      {footer && <div className="border-t border-border/70 p-3">{footer}</div>}
    </aside>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="md:pl-60 min-h-screen">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-8 md:py-10">{children}</div>
      </main>
    </div>
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