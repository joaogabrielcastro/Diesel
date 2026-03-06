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
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { stockApi } from "../services/api";
import { useConfirm } from "../hooks/useConfirm";
import { TableSkeleton, CardSkeleton } from "../components/LoadingSkeleton";
import { useAuthStore } from "../store/auth";
import { useLanguageStore } from "../store/language";

const UNITS = ["un", "kg", "g", "L", "ml", "cx", "pct", "lata", "garrafa"];

const INGREDIENT_TYPES = [
  {
    value: "ALIMENTO",
    label: "stock.food" as const,
    desc: "stock.foodDesc" as const,
  },
  {
    value: "BEBIDA",
    label: "stock.drink" as const,
    desc: "stock.drinkDesc" as const,
  },
  {
    value: "OUTRO",
    label: "stock.other" as const,
    desc: "stock.otherDesc" as const,
  },
];

function IngredientModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    unit: "un",
    ingredientType: "OUTRO",
    minStock: "",
    currentStock: "",
  });

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () =>
      stockApi.createIngredient({
        name: form.name.trim(),
        unit: form.unit,
        ingredientType: form.ingredientType,
        minStock: parseFloat(form.minStock) || 0,
        currentStock: parseFloat(form.currentStock) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success(t("stock.created"));
      onClose();
    },
    onError: () => toast.error(t("stock.error")),
  });

  const isValid = form.name.trim() && form.unit;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{t("stock.newIngredient")}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("stock.name")}{" "}
              <span className="text-red-400">{t("stock.required")}</span>
            </label>
            <input
              className="input w-full"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("stock.productExample")}
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("stock.type")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INGREDIENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => set("ingredientType", type.value)}
                  className={`p-2 rounded-lg border-2 text-center text-xs transition-colors ${
                    form.ingredientType === type.value
                      ? "border-primary bg-primary/10 text-white"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <div className="text-base">{t(type.label).split(" ")[0]}</div>
                  <div className="font-medium mt-0.5">
                    {t(type.label).split(" ").slice(1).join(" ")}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("stock.unitOfMeasure")}{" "}
              <span className="text-red-400">{t("stock.required")}</span>
            </label>
            <select
              className="input w-full"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("stock.currentStockLabel")}
              </label>
              <input
                className="input w-full"
                type="number"
                min="0"
                step="0.01"
                value={form.currentStock}
                onChange={(e) => set("currentStock", e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("stock.minStockLabel")}
              </label>
              <input
                className="input w-full"
                type="number"
                min="0"
                step="0.01"
                value={form.minStock}
                onChange={(e) => set("minStock", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">{t("stock.minStockHelp")}</p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="btn w-full bg-gray-700 hover:bg-gray-600"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={!isValid || save.isPending}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {save.isPending ? t("stock.saving") : t("stock.register")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MovementModal — replaces window.prompt() ────────────────────────────────
function MovementModal({
  item,
  type,
  onClose,
}: {
  item: any;
  type: "IN" | "OUT";
  onClose: () => void;
}) {
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");

  const move = useMutation({
    mutationFn: () =>
      stockApi.createMovement({
        productId: item.id,
        quantity: Number(qty),
        type,
        reason:
          reason.trim() ||
          (type === "IN" ? t("stock.purchase") : t("stock.sale")),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-stock"] });
      toast.success(
        type === "IN" ? t("stock.entryRegistered") : t("stock.exitRegistered"),
      );
      onClose();
    },
    onError: () => toast.error(t("stock.movementError")),
  });

  const isValid = qty && Number(qty) > 0;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {type === "IN" ? (
              <Plus size={20} className="text-green-400" />
            ) : (
              <Minus size={20} className="text-red-400" />
            )}
            {type === "IN" ? t("stock.stockEntry") : t("stock.stockExit")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          <span className="font-semibold text-white">{item.name}</span>
          {" · "}
          {t("stock.current")}:{" "}
          <span
            className={`font-bold ${item.needsRestock ? "text-red-400" : "text-green-400"}`}
          >
            {item.currentStock} {item.unit}
          </span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("stock.quantity")} ({item.unit}){" "}
              <span className="text-red-400">{t("stock.required")}</span>
            </label>
            <input
              className="input w-full"
              type="number"
              min="0.01"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && isValid && move.mutate()}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("stock.reason")}
            </label>
            <input
              className="input w-full"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === "IN"
                  ? t("stock.purchaseExample")
                  : t("stock.consumptionExample")
              }
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="btn w-full bg-gray-700 hover:bg-gray-600"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => move.mutate()}
              disabled={!isValid || move.isPending}
              className={`btn w-full disabled:opacity-50 ${
                type === "IN"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {move.isPending ? t("stock.saving") : t("common.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Stock() {
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { user } = useAuthStore();
  const userRole = user?.role?.toLowerCase() ?? "admin";

  // Role-based default type filter
  const defaultTypeFilter =
    userRole === "cozinha" || userRole === "kitchen"
      ? "ALIMENTO"
      : userRole === "garcom" || userRole === "waiter"
        ? "BEBIDA"
        : "ALL";

  const [selectedTab, setSelectedTab] = useState<
    "all" | "alerts" | "predictions"
  >("all");
  const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter);
  const [showModal, setShowModal] = useState(false);
  const [movementModal, setMovementModal] = useState<{
    item: any;
    type: "IN" | "OUT";
  } | null>(null);

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

  const deleteIngredient = useMutation({
    mutationFn: (id: string) => stockApi.deleteIngredient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      toast.success(t("stock.ingredientRemoved"));
    },
    onError: () => toast.error(t("stock.removeError")),
  });

  const handleMovement = (item: any, type: "IN" | "OUT") =>
    setMovementModal({ item, type });

  const handleDelete = async (item: any) => {
    await confirm({
      title: t("stock.removeIngredient"),
      message: `${t("stock.removeConfirm")} ${item.name}?`,
      confirmText: t("stock.yesRemove"),
      cancelText: t("common.cancel"),
      variant: "danger",
      onConfirm: () => deleteIngredient.mutate(item.id),
    });
  };

  // Filter stock items by type
  const filteredStock = stockData?.data?.filter(
    (item: any) => typeFilter === "ALL" || item.ingredientType === typeFilter,
  );

  const typeLabel =
    typeFilter === "ALIMENTO"
      ? t("stock.foods")
      : typeFilter === "BEBIDA"
        ? t("stock.drinks")
        : t("common.all");

  return (
    <>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("stock.title")}</h1>
            {typeFilter !== "ALL" && (
              <p className="text-gray-400 text-sm mt-1">
                {t("stock.filteredBy")} {typeLabel}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            {t("stock.newIngredientButton")}
          </button>
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
                  <p className="text-gray-400 text-sm">
                    {t("stock.totalProducts")}
                  </p>
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
                  <p className="text-gray-400 text-sm">{t("stock.lowStock")}</p>
                  <p className="text-3xl font-bold mt-2 text-yellow-500">
                    {alertsData?.data?.products?.warning?.length || 0}
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
                  <p className="text-gray-400 text-sm">{t("stock.critical")}</p>
                  <p className="text-3xl font-bold mt-2 text-red-500">
                    {alertsData?.data?.products?.critical?.length || 0}
                  </p>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="text-red-500 w-8 h-8" />
                </div>
              </div>
            </div>

            <div
              className="card hover:scale-105 transition-transform cursor-pointer"
              onClick={() => setSelectedTab("alerts")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">
                    {t("stock.attention")}
                  </p>
                  <p className="text-3xl font-bold mt-2 text-orange-500">
                    {alertsData?.data?.products?.attention?.length || 0}
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
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedTab === "all"
                ? "bg-primary text-white"
                : "bg-dark-light text-gray-400 hover:bg-gray-800"
            }`}
          >
            {t("stock.allProducts")}
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
            {t("stock.alerts")}
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
            {t("stock.predictions")}
          </button>

          {/* Type filter (only in "all" tab) */}
          {selectedTab === "all" && (
            <div className="ml-auto flex gap-2">
              {[
                { value: "ALL", label: t("common.all") },
                { value: "ALIMENTO", label: t("stock.foods") },
                { value: "BEBIDA", label: t("stock.drinks") },
                { value: "OUTRO", label: t("stock.others") },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    typeFilter === f.value
                      ? "bg-gray-600 text-white"
                      : "bg-dark-light text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
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
                      <th className="text-left py-3 px-4">
                        {t("stock.product")}
                      </th>
                      <th className="text-left py-3 px-4">{t("stock.type")}</th>
                      <th className="text-center py-3 px-4">
                        {t("stock.currentStock")}
                      </th>
                      <th className="text-center py-3 px-4">
                        {t("stock.minimum")}
                      </th>
                      <th className="text-center py-3 px-4">
                        {t("stock.status")}
                      </th>
                      <th className="text-right py-3 px-4">
                        {t("common.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock?.map((item: any) => {
                      const typeInfo = INGREDIENT_TYPES.find(
                        (t) => t.value === item.ingredientType,
                      );
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-800 hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4 font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-gray-400 text-sm">
                            {typeInfo
                              ? t(typeInfo.label)
                              : (item.ingredientType ?? "—")}
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
                                {t("stock.restock")}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-600/20 text-green-400 border border-green-600 rounded text-xs">
                                {t("stock.ok")}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleMovement(item, "IN")}
                                className="p-2 hover:bg-green-600/20 rounded transition-colors"
                                title={t("stock.in")}
                              >
                                <Plus size={16} className="text-green-400" />
                              </button>
                              <button
                                onClick={() => handleMovement(item, "OUT")}
                                className="p-2 hover:bg-red-600/20 rounded transition-colors"
                                title={t("stock.out")}
                              >
                                <Minus size={16} className="text-red-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-2 hover:bg-gray-700 rounded transition-colors"
                                title={t("common.delete")}
                              >
                                <Trash2 size={16} className="text-gray-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {(!filteredStock || filteredStock.length === 0) && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-12 text-gray-400"
                        >
                          <Package
                            size={40}
                            className="mx-auto mb-3 opacity-30"
                          />
                          <p>{t("stock.noIngredients")}</p>
                          <button
                            onClick={() => setShowModal(true)}
                            className="mt-3 btn btn-primary"
                          >
                            <Plus size={16} className="inline mr-1" />
                            {t("stock.firstIngredient")}
                          </button>
                        </td>
                      </tr>
                    )}
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
                  {alertsData?.data?.products?.attention?.map(
                    (product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-blue-900/20 rounded"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-400">
                            Estoque: {product.currentStock} / min{" "}
                            {product.minStock}
                          </p>
                        </div>
                        <button
                          onClick={() => handleMovement(product, "IN")}
                          className="p-2 hover:bg-gray-700 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ),
                  )}
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
      {showModal && <IngredientModal onClose={() => setShowModal(false)} />}
      {movementModal && (
        <MovementModal
          item={movementModal.item}
          type={movementModal.type}
          onClose={() => setMovementModal(null)}
        />
      )}
    </>
  );
}
