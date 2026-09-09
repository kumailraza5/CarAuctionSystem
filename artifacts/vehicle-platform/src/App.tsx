import { useLocation } from "wouter";
import { Layout } from "./components/layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import VehiclesList from "./pages/vehicles/index";
import VehicleDetail from "./pages/vehicles/detail";
import AuctionsList from "./pages/auctions/index";
import AuctionDetail from "./pages/auctions/detail";
import Profile from "./pages/profile";
import SellerVehicles from "./pages/seller/vehicles";
import SellerAuctions from "./pages/seller/auctions";
import AdminDashboard from "./pages/admin";
import Notifications from "./pages/notifications";
import MyPurchases from "./pages/purchases";
import NotFound from "./pages/not-found";
import PreviewPage from "./pages/preview";

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ component: Component, roles = [], ...rest }: any) => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-mono">INITIALIZING...</div>;

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    setLocation("/");
    return null;
  }

  return <Component {...rest} />;
};

function Router() {
  return (
    <Switch>
      {/* ── Component Preview Routes (no auth / no layout) ───────────── */}
      <Route path="/preview" component={PreviewPage} />
      <Route path="/preview/:component" component={PreviewPage} />

      {/* ── Application Routes ───────────────────────────────────────── */}
      <Route>
        {() => (
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/vehicles" component={VehiclesList} />
              <Route path="/vehicles/:id" component={VehicleDetail} />
              <Route path="/auctions" component={AuctionsList} />
              <Route path="/auctions/:id" component={AuctionDetail} />

              {/* Protected Routes */}
              <Route path="/profile">
                {() => <ProtectedRoute component={Profile} />}
              </Route>

              <Route path="/notifications">
                {() => <ProtectedRoute component={Notifications} />}
              </Route>

              <Route path="/purchases">
                {() => <ProtectedRoute component={MyPurchases} />}
              </Route>

              {/* Seller Routes */}
              <Route path="/seller/vehicles">
                {() => <ProtectedRoute component={SellerVehicles} roles={["seller", "admin"]} />}
              </Route>
              <Route path="/seller/auctions">
                {() => <ProtectedRoute component={SellerAuctions} roles={["seller", "admin"]} />}
              </Route>

              {/* Admin Routes */}
              <Route path="/admin">
                {() => <ProtectedRoute component={AdminDashboard} roles={["admin"]} />}
              </Route>

              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
