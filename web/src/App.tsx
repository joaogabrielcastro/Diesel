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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
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
              <PrivateRoute>
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
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
