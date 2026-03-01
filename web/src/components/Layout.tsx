import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Home, ChefHat, Package, Table, BarChart, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/auth'

export default function Layout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/kitchen', icon: ChefHat, label: 'Cozinha' },
    { to: '/products', icon: Package, label: 'Produtos' },
    { to: '/tables', icon: Table, label: 'Mesas' },
    { to: '/reports', icon: BarChart, label: 'Relatórios' },
  ]

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
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <item.icon size={20} />
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
  )
}
