import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { ConfirmProvider } from "@/components/app/confirm";
import { SmoothScroll } from "@/components/smooth-scroll";

function NotFoundComponent() {
  return (
    <div className="dark grain relative flex min-h-[100dvh] items-center bg-background px-6 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl items-end gap-8 md:grid-cols-[1.2fr_1fr]">
        <h1 className="font-mono text-[clamp(7rem,22vw,15rem)] font-medium leading-[0.8] tracking-tighter text-foreground/10">
          404
        </h1>
        <div className="pb-2">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            This chart doesn't exist.
          </h2>
          <p className="mt-3 max-w-sm text-muted-foreground">
            The page was moved or the link is wrong. Head back and pick a pill.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex h-12 items-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] hover:opacity-90"
          >
            Back to Blueprint
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: import("@tanstack/react-router").ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="dark flex min-h-[100dvh] items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Blueprint | Members" },
      {
        name: "description",
        content:
          "The private community for IFVG traders. Subscribe, watch every session, and claim your role.",
      },
      { name: "author", content: "Blueprint" },
      { property: "og:title", content: "Blueprint | Members" },
      { property: "og:description", content: "The private community for IFVG traders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Blueprint | Members" },
      { name: "twitter:description", content: "The private community for IFVG traders." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const noFlash = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':true;document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ConfirmProvider>
          <SmoothScroll>
            <Outlet />
          </SmoothScroll>
          <ThemedToaster />
        </ConfirmProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="top-center" />;
}
