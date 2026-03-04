import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/auth";
import { useWebSocket, useOrderNotifications } from "./services/websocket";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConfirmDialog } from "./components/ConfirmDialog";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kitchen from "./pages/Kitchen";
import Products from "./pages/Products";
import Tables from "./pages/Tables";
import Reports from "./pages/Reports";
import Stock from "./pages/Stock";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Categories from "./pages/Categories";
import Layout from "./components/Layout";

function PrivateRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { token, user } = useAuthStore();

  const userRole = user?.role?.toLowerCase();

  console.log("🔒 PrivateRoute Check:", {
    path: window.location.pathname,
    hasToken: !!token,
    userRole: userRole,
    originalRole: user?.role,
    requiredRoles: roles,
  });

  if (!token) {
    console.warn("🚫 Acesso negado: Sem token. Redirecionando para login.");
    return <Navigate to="/login" />;
  }

  if (roles && userRole && !roles.includes(userRole)) {
    console.warn(
      `🚫 Acesso negado: Role '${userRole}' não tem permissão. Esperado: ${roles.join(", ")}`,
    );

    // Redirect to appropriate home based on role
    if (userRole === "cozinha" || userRole === "kitchen")
      return <Navigate to="/kitchen" />;
    if (userRole === "garcom" || userRole === "waiter")
      return <Navigate to="/tables" />;
    return <Navigate to="/" />;
  }

  console.log("✅ Acesso permitido");
  return <>{children}</>;
}

function WebSocketHandler() {
  const { user } = useAuthStore();
  useWebSocket(user?.establishmentId);

  // Hook de notificações
  useOrderNotifications();

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <WebSocketHandler />
        <Toaster position="top-right" richColors expand={false} closeButton />
        <ConfirmDialog />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="reports" element={<Reports />} />
            <Route path="stock" element={<Stock />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<Users />} />
            <Route path="categories" element={<Categories />} />
          </Route>

          {/* Shared Routes - Acessible by multiply roles */}
          <Route
            element={
              <PrivateRoute roles={["admin", "garcom", "waiter"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/tables" element={<Tables />} />
            <Route path="/payments" element={<Payments />} />
          </Route>

          <Route
            element={
              <PrivateRoute roles={["admin", "cozinha", "kitchen"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/kitchen" element={<Kitchen />} />
          </Route>

          {/* Redirects for legacy routes/shortcuts */}
          <Route path="/garcom" element={<Navigate to="/tables" replace />} />
          <Route path="/cozinha" element={<Navigate to="/kitchen" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
