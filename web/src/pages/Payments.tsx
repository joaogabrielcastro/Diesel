import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";
import { CardSkeleton, TableSkeleton } from "../components/LoadingSkeleton";
import { useLanguageStore } from "../store/language";

export default function Payments() {
  const queryClient = useQueryClient();
  const { t } = useLanguageStore();
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "PIX" | null
  >(null);

  // Buscar todas as mesas ativas
  const { data: activeTablesData, isLoading: loadingTables } = useQuery({
    queryKey: ["payments-active-tables"],
    queryFn: async () => {
      const response = await api.get("/payments/tables/active");
      return response.data;
    },
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  // Buscar detalhes de consumo de uma mesa
  const { data: tableDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["payments-table", selectedTable?.tableId],
    queryFn: async () => {
      const response = await api.get(
        `/payments/table/${selectedTable.tableId}`,
      );
      return response.data;
    },
    enabled: !!selectedTable,
  });

  // Fechar conta
  const closeAccount = useMutation({
    mutationFn: async (data: { tableId: string; paymentMethod: string }) => {
      const response = await api.post(`/payments/table/${data.tableId}/close`, {
        paymentMethod: data.paymentMethod,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success(t("payments.closeSuccess"));

      // Invalida queries de pagamentos
      queryClient.invalidateQueries({
        queryKey: ["payments-active-tables"],
      });

      // Força refetch de todas as queries de relatórios
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return [
            "sales-report",
            "revenue-report",
            "dashboard-stats",
            "orders-status",
            "peak-hours",
            "top-products",
          ].includes(key);
        },
      });

      setSelectedTable(null);
      setShowCloseModal(false);
      setPaymentMethod(null);
    },
    onError: () => {
      toast.error(t("payments.closeError"));
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCloseAccount = () => {
    if (!paymentMethod) {
      toast.error(t("payments.methodError"));
      return;
    }

    closeAccount.mutate({
      tableId: selectedTable.tableId,
      paymentMethod,
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("payments.title")}</h1>
          <p className="text-gray-400 mt-2">{t("payments.subtitle")}</p>
        </div>
      </div>

      {/* Resumo Geral */}
      {loadingTables ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {t("payments.activeTables")}
                </p>
                <p className="text-3xl font-bold mt-2">
                  {activeTablesData?.totalTables || 0}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <Receipt className="text-blue-500 w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {t("payments.totalRevenue")}
                </p>
                <p className="text-3xl font-bold mt-2 text-green-500">
                  {formatCurrency(activeTablesData?.totalRevenue || 0)}
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg">
                <CreditCard className="text-green-500 w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">
                  {t("payments.averageTicket")}
                </p>
                <p className="text-3xl font-bold mt-2 text-orange-500">
                  {formatCurrency(
                    activeTablesData?.totalTables > 0
                      ? activeTablesData.totalRevenue /
                          activeTablesData.totalTables
                      : 0,
                  )}
                </p>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-lg">
                <Banknote className="text-orange-500 w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Mesas Ativas */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            {t("payments.activeTables")}
          </h2>

          {loadingTables ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="space-y-3">
              {activeTablesData?.tables?.map((table: any) => (
                <div
                  key={table.tableId}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedTable?.tableId === table.tableId
                      ? "border-primary bg-primary/10"
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                  onClick={() => setSelectedTable(table)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <Receipt className="text-primary w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">
                          {t("tables.table")} {table.tableNumber}
                        </p>
                        <p className="text-sm text-gray-400">
                          {table.openComandas} {t("payments.items")} •{" "}
                          {table.totalItems} {t("payments.items")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-500">
                        {formatCurrency(table.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {activeTablesData?.tables?.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t("payments.noTables")}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detalhes da Mesa Selecionada */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            {t("payments.consumption")}
          </h2>

          {!selectedTable ? (
            <div className="text-center py-12 text-gray-400">
              <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Selecione uma mesa para ver os detalhes</p>
            </div>
          ) : loadingDetails ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-gray-800 pb-4">
                <h3 className="text-2xl font-bold">
                  {t("tables.table")} {tableDetails?.table?.number}
                </h3>
                <p className="text-sm text-gray-400">
                  {tableDetails?.openComandas} comanda(s) aberta(s)
                </p>
              </div>

              {/* Items Breakdown */}
              <div className="max-h-64 overflow-y-auto">
                <h4 className="font-bold mb-2">{t("payments.consumption")}:</h4>
                <div className="space-y-2">
                  {tableDetails?.itemsBreakdown?.map(
                    (item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm p-2 bg-gray-800/50 rounded"
                      >
                        <div>
                          <span className="font-medium">{item.quantity}x</span>{" "}
                          {item.productName}
                        </div>
                        <span>{formatCurrency(item.total)}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-800 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">
                    {t("payments.total")}:
                  </span>
                  <span className="text-3xl font-bold text-green-500">
                    {formatCurrency(tableDetails?.totalAmount || 0)}
                  </span>
                </div>

                <button
                  onClick={() => setShowCloseModal(true)}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {t("payments.close")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-light rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-4">{t("payments.close")}</h3>

            <div className="mb-6">
              <p className="text-gray-400 mb-2">
                {t("tables.table")} {tableDetails?.table?.number}
              </p>
              <p className="text-3xl font-bold text-green-500">
                {formatCurrency(tableDetails?.totalAmount || 0)}
              </p>
            </div>

            <p className="font-bold mb-3">{t("payments.method")}:</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "CASH"
                    ? "border-primary bg-primary/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setPaymentMethod("CASH")}
              >
                <Banknote className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{t("payments.cash")}</p>
              </button>

              <button
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "CARD"
                    ? "border-primary bg-primary/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setPaymentMethod("CARD")}
              >
                <CreditCard className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{t("payments.card")}</p>
              </button>

              <button
                className={`p-4 rounded-lg border-2 transition-all ${
                  paymentMethod === "PIX"
                    ? "border-primary bg-primary/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setPaymentMethod("PIX")}
              >
                <Smartphone className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{t("payments.pix")}</p>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setPaymentMethod(null);
                }}
                className="btn bg-gray-700 hover:bg-gray-600 flex-1 flex items-center justify-center gap-2"
              >
                <X size={20} />
                {t("common.cancel")}
              </button>
              <button
                onClick={handleCloseAccount}
                disabled={!paymentMethod || closeAccount.isPending}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check size={20} />
                {closeAccount.isPending
                  ? t("common.loading")
                  : t("common.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
