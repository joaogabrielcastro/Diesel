import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Clock,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { stockApi } from "../services/api";
import { useConfirm } from "../hooks/useConfirm";
import { TableSkeleton, CardSkeleton } from "../components/LoadingSkeleton";

export default function Stock() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const [selectedTab, setSelectedTab] = useState<
    "all" | "alerts" | "predictions"
  >("all");

  const { data: stockData, isLoading: loadingStock } = useQuery({
    queryKey: ["stock", selectedTab === "alerts"],
    queryFn: () => stockApi.getAll(selectedTab === "alerts"),
  });

  const { data: alertsData, isLoading: loadingAlerts } = useQuery({
    queryKey: ["stock-alerts"],
    queryFn: () => stockApi.getAlerts(),
    enabled: selectedTab === "alerts",
  });

  const { data: predictionsData, isLoading: loadingPredictions } = useQuery({
    queryKey: ["stock-predictions"],
    queryFn: () => stockApi.getPredictions(),
    enabled: selectedTab === "predictions",
  });

  const createMovement = useMutation({
    mutationFn: (data: any) => stockApi.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-predictions"] });
      toast.success("Movimentação registrada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao registrar movimentação");
    },
  });

  const handleMovement = async (product: any, type: "IN" | "OUT") => {
    const quantity = prompt(
      `Quantidade a ${type === "IN" ? "adicionar" : "remover"}:`,
    );
    if (!quantity || isNaN(Number(quantity))) return;

    const reason = prompt("Motivo da movimentação:");
    if (!reason) return;

    await confirm({
      title: `${type === "IN" ? "Entrada" : "Saída"} de Estoque`,
      message: `Confirma ${type === "IN" ? "entrada" : "saída"} de ${quantity} ${product.unit || "un"} de ${product.name}?`,
      confirmText: "Sim, confirmar",
      cancelText: "Cancelar",
      variant: "info",
      onConfirm: () =>
        createMovement.mutate({
          productId: product.id,
          quantity: Number(quantity),
          type,
          reason,
        }),
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
      </div>

      {/* Alerts Summary */}
      {loadingAlerts ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total de Produtos</p>
                <p className="text-3xl font-bold mt-2">
                  {stockData?.data?.length || 0}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Package className="text-blue-500 w-8 h-8" />
              </div>
            </div>
          </div>

          <div
            className="card hover:scale-105 transition-transform cursor-pointer"
            onClick={() => setSelectedTab("alerts")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Estoque Baixo</p>
                <p className="text-3xl font-bold mt-2 text-yellow-500">
                  {alertsData?.data?.total || 0}
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <AlertTriangle className="text-yellow-500 w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="card hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Crítico (zerado)</p>
                <p className="text-3xl font-bold mt-2 text-red-500">
                  {alertsData?.data?.critical || 0}
                </p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="text-red-500 w-8 h-8" />
              </div>
            </div>
          </div>

          <div
            className="card hover:scale-105 transition-transform cursor-pointer"
            onClick={() => setSelectedTab("predictions")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Acabando em 7 dias</p>
                <p className="text-3xl font-bold mt-2 text-orange-500">
                  {predictionsData?.data?.filter((p: any) => p.needsRestockSoon)
                    .length || 0}
                </p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <TrendingDown className="text-orange-500 w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedTab("all")}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedTab === "all"
              ? "bg-primary text-white"
              : "bg-dark-light text-gray-400 hover:bg-gray-800"
          }`}
        >
          Todos os Produtos
        </button>
        <button
          onClick={() => setSelectedTab("alerts")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            selectedTab === "alerts"
              ? "bg-primary text-white"
              : "bg-dark-light text-gray-400 hover:bg-gray-800"
          }`}
        >
          <AlertTriangle size={16} />
          Alertas
        </button>
        <button
          onClick={() => setSelectedTab("predictions")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            selectedTab === "predictions"
              ? "bg-primary text-white"
              : "bg-dark-light text-gray-400 hover:bg-gray-800"
          }`}
        >
          <Clock size={16} />
          Previsões
        </button>
      </div>

      {/* All Products Table */}
      {selectedTab === "all" && (
        <>
          {loadingStock ? (
            <TableSkeleton rows={10} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4">Produto</th>
                    <th className="text-left py-3 px-4">Categoria</th>
                    <th className="text-center py-3 px-4">Estoque Atual</th>
                    <th className="text-center py-3 px-4">Mínimo</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData?.data?.map((item: any) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-gray-400">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold ${item.needsRestock ? "text-red-500" : "text-green-500"}`}
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
                            Reabastecer
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 border border-green-600 rounded text-xs">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleMovement(item, "IN")}
                            className="p-2 hover:bg-green-600/20 rounded transition-colors"
                            title="Entrada"
                          >
                            <Plus size={16} className="text-green-400" />
                          </button>
                          <button
                            onClick={() => handleMovement(item, "OUT")}
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
            </div>
          )}
        </>
      )}

      {/* Alerts View */}
      {selectedTab === "alerts" && (
        <div className="space-y-4">
          {/* Critical Alerts */}
          {alertsData?.data?.products?.critical?.length > 0 && (
            <div className="card border-red-600 border-l-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="text-red-500" size={24} />
                <h3 className="text-xl font-bold text-red-500">
                  Crítico - Estoque Zerado (
                  {alertsData?.data?.products?.critical?.length})
                </h3>
              </div>
              <div className="space-y-2">
                {alertsData?.data?.products?.critical?.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-900/20 rounded"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-400">
                        {product.category}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMovement(product, "IN")}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Reabastecer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Alerts */}
          {alertsData?.data?.products?.warning?.length > 0 && (
            <div className="card border-yellow-600 border-l-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-yellow-500" size={24} />
                <h3 className="text-xl font-bold text-yellow-500">
                  Alerta - Estoque muito baixo (
                  {alertsData?.data?.products?.warning?.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertsData?.data?.products?.warning?.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-yellow-900/20 rounded"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-400">
                        Restam {product.currentStock} / min {product.minStock}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMovement(product, "IN")}
                      className="p-2 hover:bg-gray-700 rounded"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attention Alerts */}
          {alertsData?.data?.products?.attention?.length > 0 && (
            <div className="card border-blue-600 border-l-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="text-blue-500" size={24} />
                <h3 className="text-xl font-bold text-blue-500">
                  Atenção - Estoque no mínimo (
                  {alertsData?.data?.products?.attention?.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertsData?.data?.products?.attention?.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-blue-900/20 rounded"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-400">
                        Estoque: {product.currentStock} / min {product.minStock}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMovement(product, "IN")}
                      className="p-2 hover:bg-gray-700 rounded"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Predictions View */}
      {selectedTab === "predictions" && (
        <>
          {loadingPredictions ? (
            <TableSkeleton rows={8} />
          ) : (
            <div className="card overflow-x-auto">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock size={20} />
                Previsão de Consumo (baseado em 30 dias)
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4">Produto</th>
                    <th className="text-center py-3 px-4">Estoque Atual</th>
                    <th className="text-center py-3 px-4">Consumo Diário</th>
                    <th className="text-center py-3 px-4">Dias Restantes</th>
                    <th className="text-center py-3 px-4">
                      Sugestão de Pedido
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {predictionsData?.data?.map((prediction: any) => (
                    <tr
                      key={prediction.productId}
                      className={`border-b border-gray-800 hover:bg-gray-800/50 ${
                        prediction.needsRestockSoon ? "bg-orange-900/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4">{prediction.productName}</td>
                      <td className="py-3 px-4 text-center">
                        {prediction.currentStock}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {prediction.dailyConsumption}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold ${
                            prediction.daysRemaining < 3
                              ? "text-red-500"
                              : prediction.daysRemaining < 7
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        >
                          {prediction.daysRemaining === 999
                            ? "∞"
                            : `${prediction.daysRemaining} dias`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {prediction.suggestedOrderQuantity > 0 ? (
                          <span className="font-medium text-orange-400">
                            {prediction.suggestedOrderQuantity} unidades
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
