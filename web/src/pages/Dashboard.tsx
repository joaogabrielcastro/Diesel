import { useQuery } from '@tanstack/react-query'
import { ordersApi, tablesApi } from '../services/api'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await ordersApi.getAll()
      return response.data
    },
  })

  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await tablesApi.getAll()
      return response.data
    },
  })

  const stats = [
    {
      label: 'Pedidos Hoje',
      value: orders?.length || 0,
      icon: ShoppingCart,
      color: 'text-blue-500',
    },
    {
      label: 'Mesas Ocupadas',
      value: tables?.filter((t: any) => t.status === 'OCCUPIED').length || 0,
      icon: Users,
      color: 'text-green-500',
    },
    {
      label: 'Faturamento',
      value: 'R$ 2.450',
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      label: 'Crescimento',
      value: '+12%',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <stat.icon className={`${stat.color} w-12 h-12`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Pedidos Recentes</h2>
          <div className="space-y-4">
            {orders?.slice(0, 5).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-dark rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    Mesa {order.comanda?.table?.number || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {order.items?.length} itens
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  order.status === 'DELIVERED' ? 'bg-green-600' :
                  order.status === 'PREPARING' ? 'bg-blue-600' :
                  'bg-yellow-600'
                }`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Status das Mesas</h2>
          <div className="grid grid-cols-5 gap-4">
            {tables?.map((table: any) => (
              <div
                key={table.id}
                className={`aspect-square flex items-center justify-center rounded-lg font-bold ${
                  table.status === 'OCCUPIED' ? 'bg-red-600' :
                  table.status === 'RESERVED' ? 'bg-yellow-600' :
                  'bg-green-600'
                }`}
              >
                {table.number}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
