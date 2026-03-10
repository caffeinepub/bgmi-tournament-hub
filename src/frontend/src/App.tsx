import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import { AccountSetupModal } from "./components/AccountSetupModal";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { AccountSetupProvider } from "./contexts/AccountSetupContext";
import { AdminPage } from "./pages/AdminPage";
import { HomePage } from "./pages/HomePage";
import { MyRegistrationsPage } from "./pages/MyRegistrationsPage";
import { TournamentDetailPage } from "./pages/TournamentDetailPage";

const rootRoute = createRootRoute({
  component: () => (
    <AccountSetupProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <AccountSetupModal />
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "oklch(0.12 0.015 240)",
              border: "1px solid oklch(0.88 0.18 195 / 0.3)",
              color: "oklch(0.96 0.01 200)",
            },
          }}
        />
      </div>
    </AccountSetupProvider>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const tournamentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tournament/$id",
  component: TournamentDetailPage,
});

const myRegistrationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-registrations",
  component: MyRegistrationsPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  tournamentDetailRoute,
  myRegistrationsRoute,
  adminRoute,
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
