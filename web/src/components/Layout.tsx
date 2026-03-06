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
  Users as UsersIcon,
  Tag,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { useAuthStore } from "../store/auth";
import { useLanguageStore } from "../store/language";
import { useOrderNotifications } from "../services/websocket";
import { useState, useEffect } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useLanguageStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize WebSocket notifications
  useOrderNotifications();

  // Reset unread count when visiting kitchen page
  useEffect(() => {
    if (location.pathname === "/kitchen") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
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

  const allNavItems = [
    { to: "/", icon: Home, label: t("nav.dashboard"), roles: ["admin"] },
    {
      to: "/kitchen",
      icon: ChefHat,
      label: t("nav.kitchen"),
      roles: ["admin", "cozinha", "kitchen"],
    },
    {
      to: "/products",
      icon: Package,
      label: t("nav.products"),
      roles: ["admin", "garcom", "waiter"],
    },
    {
      to: "/categories",
      icon: Tag,
      label: t("nav.categories"),
      roles: ["admin"],
    },
    {
      to: "/tables",
      icon: Table,
      label: t("nav.tables"),
      roles: ["admin", "garcom", "waiter"],
    },
    {
      to: "/payments",
      icon: CreditCard,
      label: t("nav.payments"),
      roles: ["admin", "garcom", "waiter"],
    },
    {
      to: "/reports",
      icon: BarChart,
      label: t("nav.reports"),
      roles: ["admin"],
    },
    {
      to: "/stock",
      icon: Warehouse,
      label: t("nav.stock"),
      roles: ["admin", "cozinha", "kitchen"],
    },
    {
      to: "/users",
      icon: UsersIcon,
      label: t("nav.users"),
      roles: ["admin"],
    },
  ];

  const navItems = allNavItems.filter((item) => {
    const userRole = user?.role?.toLowerCase();
    // Se não tem role, permite
    if (!userRole) return true;
    // Normaliza as roles aceitas para lowercase
    const normalizedRoles = item.roles.map((r) => r.toLowerCase());
    return normalizedRoles.includes(userRole);
  });

  return (
    <div className="flex h-screen bg-dark text-white overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-dark-light border-b border-gray-800 p-4 flex items-center justify-between h-16">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 hover:bg-gray-800 rounded-lg text-white"
        >
          <Menu size={24} />
        </button>
        <span className="font-bold text-primary text-xl">🍺 Diesel Bar</span>
        <div className="w-8" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-light border-r border-gray-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">🍺 Diesel Bar</h1>
            <p className="text-sm text-gray-400 mt-1">
              {user?.role === "admin" && "Administrador"}
              {(user?.role === "garcom" || user?.role === "waiter") && "Garçom"}
              {(user?.role === "cozinha" || user?.role === "kitchen") &&
                "Cozinha"}
            </p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 space-y-2 overflow-y-auto h-[calc(100vh-180px)]">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                location.pathname === item.to
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <div className="relative">
                <item.icon size={20} />
                {item.to === "/kitchen" && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-dark-light">
          <div className="flex items-center justify-between mb-3">
            <div className="truncate">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
              title={
                language === "pt" ? "Switch to English" : "Mudar para Português"
              }
            >
              <Globe size={16} />
              <span className="font-medium">
                {language === "pt" ? "EN" : "PT"}
              </span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-colors text-sm"
              title={t("nav.logout")}
            >
              <LogOut size={16} />
              <span className="font-medium">{t("nav.logout")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto w-full pt-16 md:pt-0 bg-dark">
        <Outlet />
      </main>
    </div>
  );
}
