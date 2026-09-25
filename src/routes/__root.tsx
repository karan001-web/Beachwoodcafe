import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteFooter, SiteHeader } from "../components/site-shell";
import { CartProvider } from "../lib/cart-context";
import { CartDrawer } from "../components/cart-drawer";
import { adminStore } from "../lib/admin-store";
import { MaintenanceScreen } from "../components/maintenance-screen";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
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
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
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
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Beachwood Cafe" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Maintenance mode state
  const [maintenance, setMaintenance] = useState(() => adminStore.getMaintenanceConfig());

  useEffect(() => {
    const handleMaintenanceChange = () => {
      setMaintenance(adminStore.getMaintenanceConfig());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("bwc_maintenance_change", handleMaintenanceChange);
      window.addEventListener("storage", handleMaintenanceChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("bwc_maintenance_change", handleMaintenanceChange);
        window.removeEventListener("storage", handleMaintenanceChange);
      }
    };
  }, []);

  // Track pageviews dynamically
  useEffect(() => {
    adminStore.trackPageView(location.pathname);
  }, [location.pathname]);

  // Global WhatsApp click event listener
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (
        target &&
        target.href &&
        (target.href.includes("wa.me") || target.href.includes("whatsapp"))
      ) {
        const label =
          target.innerText?.trim() ||
          target.getAttribute("aria-label") ||
          target.title ||
          "WhatsApp Link";
        adminStore.trackWhatsAppClick(label, `URL: ${target.href}`);
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => document.removeEventListener("click", handleGlobalClick, true);
  }, []);

  // If site maintenance mode is enabled and user is NOT on admin route, show maintenance screen
  if (!isAdminRoute && maintenance.enabled) {
    return <MaintenanceScreen config={maintenance} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        {!isAdminRoute && (
          <>
            <a href="#main" className="skip-link">
              Skip to content
            </a>
            <SiteHeader />
          </>
        )}

        <main id="main">
          <Outlet />
        </main>

        {!isAdminRoute && (
          <>
            <SiteFooter />
            <CartDrawer />
          </>
        )}
      </CartProvider>
    </QueryClientProvider>
  );
}

