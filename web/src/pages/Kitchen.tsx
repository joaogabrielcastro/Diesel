import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Loader2,
  Package,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ordersApi, stockApi } from "../services/api";
import { useConfirm } from "../hooks/useConfirm";
import { ListSkeleton } from "../components/LoadingSkeleton";
import { useWebSocket } from "../services/websocket";
import { StockMovementModal } from "../components/StockMovementModal";
import { useLanguageStore } from "../store/language";

export default function Kitchen() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { socket } = useWebSocket();
  const { t } = useLanguageStore();
  const [stockOpen, setStockOpen] = useState(false);
  const [movementModal, setMovementModal] = useState<{
    item: any;
    type: "IN" | "OUT";
  } | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const response = await ordersApi.getKitchen();
      return response.data;
    },
    // Mantém polling como redundância, mas aumenta intervalo
    refetchInterval: 10000,
  });

  const { data: kitchenStock } = useQuery({
    queryKey: ["kitchen-stock"],
    queryFn: async () => (await stockApi.getAll(false)).data,
    refetchInterval: 30000,
  });

  // Filter only ALIMENTO type (or all if none tagged)
  const foodStock =
    kitchenStock?.filter(
      (i: any) =>
        i.ingredientType === "ALIMENTO" ||
        i.ingredientType === "OUTRO" ||
        !i.ingredientType,
    ) ?? [];

  // Escutar eventos via Socket
  useEffect(() => {
    if (!socket) return;

    const refresh = () => {
      console.log("⚡ [Kitchen] Atualizando pedidos via socket...");
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    };

    socket.on("new-order", refresh);
    socket.on("order-updated", refresh);

    return () => {
      socket.off("new-order", refresh);
      socket.off("order-updated", refresh);
    };
  }, [socket, queryClient]);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      if (variables.status === "CANCELLED") {
        toast.success(t("kitchen.cancelled"));
      } else {
        toast.success(t("kitchen.updated"));
      }
    },
    onError: () => {
      toast.error(t("kitchen.error"));
    },
  });

  const getTimeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes}min`;
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await confirm({
      title: t("kitchen.confirmUpdate"),
      message: t("kitchen.confirmMessage"),
      confirmText: t("common.confirm"),
      cancelText: t("common.cancel"),
      variant: "info",
      onConfirm: () => updateStatus.mutate({ id: orderId, status: newStatus }),
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    await confirm({
      title: t("kitchen.cancel"),
      message: t("kitchen.confirmMessage"),
      confirmText: t("common.yes"),
      cancelText: t("common.cancel"),
      variant: "danger",
      onConfirm: () =>
        updateStatus.mutate({ id: orderId, status: "CANCELLED" }),
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{t("kitchen.title")}</h1>

      {isLoading ? (
        <ListSkeleton items={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders?.map((order: any) => (
            <div key={order.id} className="card border-l-4 border-primary">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                  {t("tables.table")}{" "}
                  {order.comanda?.table?.number || "Cassino"}
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
                  <>
                    <button
                      onClick={() => handleStatusChange(order.id, "PREPARING")}
                      disabled={updateStatus.isPending}
                      className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updateStatus.isPending && (
                        <Loader2 className="animate-spin" size={16} />
                      )}
                      {t("kitchen.startPreparing")}
                    </button>
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={updateStatus.isPending}
                      className="btn bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 px-3"
                      title="Cancelar pedido"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
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
                    {t("kitchen.markReady")}
                  </button>
                )}
              </div>
            </div>
          ))}

          {(!orders || orders.length === 0) && (
            <div className="col-span-full text-center py-12 text-gray-400">
              {t("kitchen.noPending")}
            </div>
          )}
        </div>
      )}

      {/* ─── Controle de Estoque da Cozinha ─────────────────────────────── */}
      <div className="mt-10">
        <button
          onClick={() => setStockOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package size={20} className="text-orange-400" />
            <span className="font-bold text-lg">{t("kitchen.stock")}</span>
            {foodStock.filter((i: any) => i.needsRestock).length > 0 && (
              <span className="flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
                <AlertTriangle size={11} />
                {foodStock.filter((i: any) => i.needsRestock).length}{" "}
                {t("kitchen.lowStock")}
              </span>
            )}
          </div>
          {stockOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {stockOpen && (
          <div className="mt-4 card overflow-x-auto">
            {foodStock.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">
                {t("stock.noItems")}
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 text-sm text-gray-400">
                    <th className="text-left py-3 px-4">{t("stock.name")}</th>
                    <th className="text-center py-3 px-4">
                      {t("stock.currentStock")}
                    </th>
                    <th className="text-center py-3 px-4">
                      {t("stock.minStock")}
                    </th>
                    <th className="text-center py-3 px-4">
                      {t("stock.status")}
                    </th>
                    <th className="text-right py-3 px-4">
                      {t("stock.movement")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {foodStock.map((item: any) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-800 hover:bg-gray-800/30"
                    >
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold ${item.needsRestock ? "text-red-400" : "text-green-400"}`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-400">
                        {item.minStock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.needsRestock ? (
                          <span className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-600 rounded text-xs">
                            {t("stock.restock")}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 border border-green-600 rounded text-xs">
                            {t("stock.ok")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setMovementModal({ item, type: "IN" })
                            }
                            className="p-2 hover:bg-green-600/20 rounded transition-colors"
                            title="Entrada"
                          >
                            <Plus size={16} className="text-green-400" />
                          </button>
                          <button
                            onClick={() =>
                              setMovementModal({ item, type: "OUT" })
                            }
                            className="p-2 hover:bg-red-600/20 rounded transition-colors"
                            title="Saída"
                          >
                            <Minus size={16} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {movementModal && (
        <StockMovementModal
          item={movementModal.item}
          type={movementModal.type}
          onClose={() => setMovementModal(null)}
        />
      )}
    </div>
  );
}
