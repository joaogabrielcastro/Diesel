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
import Layout from "./components/Layout";

function PrivateRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" />;
  if (roles && user?.role && !roles.includes(user.role)) {
    // Redirect to appropriate home based on role
    if (user.role === "cozinha") return <Navigate to="/kitchen" />;
    if (user.role === "garcom") return <Navigate to="/tables" />;
    return <Navigate to="/" />;
  }
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
      <BrowserRouter>
        <WebSocketHandler />
        <Toaster position="top-right" richColors expand={false} closeButton />
        <ConfirmDialog />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute roles={["admin"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="kitchen" element={<Kitchen />} />
            <Route path="products" element={<Products />} />
            <Route path="tables" element={<Tables />} />
            <Route path="reports" element={<Reports />} />
            <Route path="stock" element={<Stock />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          {/* Garçom */}
          <Route
            path="/garcom"
            element={
              <PrivateRoute roles={["admin", "garcom"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/tables" />} />
          </Route>
          {/* Cozinha */}
          <Route
            path="/cozinha"
            element={
              <PrivateRoute roles={["admin", "cozinha"]}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/kitchen" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
