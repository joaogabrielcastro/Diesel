import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '../services/api'
import { Clock } from 'lucide-react'

export default function Kitchen() {
  const queryClient = useQueryClient()

  const { data: orders } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const response = await ordersApi.getKitchen()
      return response.data
    },
    refetchInterval: 3000,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
    },
  })

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    return `${minutes}min`
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Painel da Cozinha</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders?.map((order: any) => (
          <div key={order.id} className="card border-l-4 border-primary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Mesa {order.comanda?.table?.number || 'Cassino'}
              </h3>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={16} />
                <span className="text-sm">{getTimeSince(order.createdAt)}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.product.name}
                  </span>
                  {item.observations && (
                    <span className="text-sm text-gray-400 italic">
                      ({item.observations})
                    </span>
                  )}
                </div>
              ))}
            </div>

            {order.observations && (
              <div className="bg-yellow-600/20 border border-yellow-600 rounded p-2 mb-4">
                <p className="text-sm">📝 {order.observations}</p>
              </div>
            )}

            <div className="flex gap-2">
              {order.status === 'PENDING' && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: 'PREPARING' })}
                  className="btn btn-primary flex-1"
                >
                  Iniciar Preparo
                </button>
              )}
              {order.status === 'PREPARING' && (
                <button
                  onClick={() => updateStatus.mutate({ id: order.id, status: 'READY' })}
                  className="btn bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  Marcar como Pronto
                </button>
              )}
            </div>
          </div>
        ))}

        {(!orders || orders.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-400">
            Nenhum pedido pendente
          </div>
        )}
      </div>
    </div>
  )
}
