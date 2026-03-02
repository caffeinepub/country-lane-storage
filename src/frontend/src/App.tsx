import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/store/appStore";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useEffect } from "react";

// Layouts
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CustomerLayout } from "@/components/layout/CustomerLayout";

// Pages
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";

// Customer Pages
import { CustomerDashboard } from "@/pages/portal/CustomerDashboard";
import { CustomerInvoices } from "@/pages/portal/CustomerInvoices";
import { CustomerPayments } from "@/pages/portal/CustomerPayments";
import { PaymentSuccess } from "@/pages/portal/PaymentSuccess";

// Admin Pages
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminFacilities } from "@/pages/admin/AdminFacilities";
import { AdminInvoices } from "@/pages/admin/AdminInvoices";
import { AdminLeases } from "@/pages/admin/AdminLeases";
import { AdminSettings } from "@/pages/admin/AdminSettings";
import { AdminTenantDetail } from "@/pages/admin/AdminTenantDetail";
import { AdminTenants } from "@/pages/admin/AdminTenants";
import { AdminUnitMap } from "@/pages/admin/AdminUnitMap";
import { AdminUnits } from "@/pages/admin/AdminUnits";

// Backend hooks for seeding
import { useActor } from "@/hooks/useActor";
import * as svc from "@/lib/backendService";

// ─── App Shell ────────────────────────────────────────────────────────────────

function AppShell() {
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (!actor || isFetching) return;
    // Seed demo data on startup (idempotent — safe to call multiple times)
    svc
      .seedDemoData(actor)
      .then(() => {
        // After seeding, ensure facility name is correct
        return svc.updateFacilityOnBackend(
          actor,
          1,
          "Country Lane Storage",
          "456 Country Lane, Springfield, IL 62701",
          "America/Chicago",
        );
      })
      .catch(() => {
        // Silently fail — demo data and local state are the fallback
      });
  }, [actor, isFetching]);

  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  );
}

// ─── Root Route ───────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: AppShell,
});

// ─── Public Routes ────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  beforeLoad: () => {
    const user = useAppStore.getState().currentUser;
    if (user) {
      throw redirect({ to: user.role === "ADMIN" ? "/admin" : "/portal" });
    }
  },
});

// ─── Customer Portal Routes ───────────────────────────────────────────────────

const portalLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "portal-layout",
  component: () => (
    <CustomerLayout>
      <Outlet />
    </CustomerLayout>
  ),
  beforeLoad: () => {
    const user = useAppStore.getState().currentUser;
    if (!user) throw redirect({ to: "/login" });
    if (user.role === "ADMIN") throw redirect({ to: "/admin" });
  },
});

const portalRoute = createRoute({
  getParentRoute: () => portalLayoutRoute,
  path: "/portal",
  component: CustomerDashboard,
});

const portalInvoicesRoute = createRoute({
  getParentRoute: () => portalLayoutRoute,
  path: "/portal/invoices",
  component: CustomerInvoices,
});

const portalPaymentsRoute = createRoute({
  getParentRoute: () => portalLayoutRoute,
  path: "/portal/payments",
  component: CustomerPayments,
});

const portalPaymentSuccessRoute = createRoute({
  getParentRoute: () => portalLayoutRoute,
  path: "/portal/payment-success",
  component: PaymentSuccess,
  validateSearch: (search: Record<string, unknown>) => ({
    invoice_id: Number(search.invoice_id ?? 0),
    session_id: String(search.session_id ?? ""),
  }),
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin-layout",
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
  beforeLoad: () => {
    const user = useAppStore.getState().currentUser;
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "ADMIN") throw redirect({ to: "/portal" });
  },
});

const adminRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin",
  component: AdminDashboard,
});

const adminTenantsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/tenants",
  component: AdminTenants,
});

const adminTenantDetailRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/tenants/$id",
  component: () => {
    const { id } = adminTenantDetailRoute.useParams();
    return <AdminTenantDetail tenantId={Number(id)} />;
  },
});

const adminLeasesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/leases",
  component: AdminLeases,
});

const adminInvoicesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/invoices",
  component: AdminInvoices,
});

const adminUnitsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/units",
  component: AdminUnits,
});

const adminMapRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/map",
  component: AdminUnitMap,
});

const adminFacilitiesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/facilities",
  component: AdminFacilities,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/admin/settings",
  component: AdminSettings,
});

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  portalLayoutRoute.addChildren([
    portalRoute,
    portalInvoicesRoute,
    portalPaymentsRoute,
    portalPaymentSuccessRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminRoute,
    adminTenantsRoute,
    adminTenantDetailRoute,
    adminLeasesRoute,
    adminInvoicesRoute,
    adminUnitsRoute,
    adminMapRoute,
    adminFacilitiesRoute,
    adminSettingsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
