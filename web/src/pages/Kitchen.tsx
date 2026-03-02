import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ordersApi } from "../services/api";
import { useConfirm } from "../hooks/useConfirm";
import { ListSkeleton } from "../components/LoadingSkeleton";

export default function Kitchen() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const response = await ordersApi.getKitchen();
      return response.data;
    },
    refetchInterval: 3000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      const statusText =
        variables.status === "PREPARING" ? "Preparando" : "Pronto";
      toast.success(`Pedido marcado como ${statusText}`);
    },
    onError: () => {
      toast.error("Erro ao atualizar status do pedido");
    },
  });

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes}min`;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await confirm({
      title: "Confirmar atualização",
      message: `Deseja marcar este pedido como ${newStatus === "PREPARING" ? "em preparo" : "pronto"}?`,
      confirmText: "Sim, confirmar",
      cancelText: "Cancelar",
      variant: "info",
      onConfirm: () => updateStatus.mutate({ id: orderId, status: newStatus }),
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Painel da Cozinha</h1>

      {isLoading ? (
        <ListSkeleton items={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders?.map((order: any) => (
            <div key={order.id} className="card border-l-4 border-primary">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  Mesa {order.comanda?.table?.number || "Cassino"}
                </h3>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock size={16} />
                  <span className="text-sm">
                    {getTimeSince(order.createdAt)}
                  </span>
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
                {order.status === "PENDING" && (
                  <button
                    onClick={() => handleStatusChange(order.id, "PREPARING")}
                    disabled={updateStatus.isPending}
                    className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updateStatus.isPending && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
                    Iniciar Preparo
                  </button>
                )}
                {order.status === "PREPARING" && (
                  <button
                    onClick={() => handleStatusChange(order.id, "READY")}
                    disabled={updateStatus.isPending}
                    className="btn bg-green-600 hover:bg-green-700 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updateStatus.isPending && (
                      <Loader2 className="animate-spin" size={16} />
                    )}
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
      )}
    </div>
  );
}
