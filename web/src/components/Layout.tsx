import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  ChefHat,
  Package,
  Table,
  BarChart,
  LogOut,
  Warehouse,
  CreditCard,
  Settings,
} from "lucide-react";
import { useAuthStore } from "../store/auth";
import { useOrderNotifications } from "../services/websocket";
import { useState, useEffect } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize WebSocket notifications
  useOrderNotifications();

  // Reset unread count when visiting kitchen page
  useEffect(() => {
    if (location.pathname === "/kitchen") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // Listen for new orders to update badge
  useEffect(() => {
    const handleNewOrder = () => {
      if (location.pathname !== "/kitchen") {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const socket = (window as any).__socket;
    if (socket) {
      socket.on("new-order", handleNewOrder);
      return () => {
        socket.off("new-order", handleNewOrder);
      };
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/kitchen", icon: ChefHat, label: "Cozinha" },
    { to: "/products", icon: Package, label: "Produtos" },
    { to: "/tables", icon: Table, label: "Mesas" },
    { to: "/payments", icon: CreditCard, label: "Pagamentos" },
    { to: "/reports", icon: BarChart, label: "Relatórios" },
    { to: "/stock", icon: Warehouse, label: "Estoque" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-light border-r border-gray-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">🍺 Diesel Bar</h1>
          <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors relative"
            >
              <div className="relative">
                <item.icon size={20} />
                {item.to === "/kitchen" && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
