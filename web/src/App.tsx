import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kitchen from "./pages/Kitchen";
import Products from "./pages/Products";
import Tables from "./pages/Tables";
import Reports from "./pages/Reports";
import Layout from "./components/Layout";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
