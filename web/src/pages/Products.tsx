import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Edit2, Trash2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { productsApi, categoriesApi } from "../services/api";
import { useConfirm } from "../hooks/useConfirm";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { useLanguageStore } from "../store/language";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  code: "",
  preparationTime: "",
  active: true,
  stockControl: false,
  stockQuantity: "",
  stockUnit: "unidade",
  minStock: "",
};

function ProductModal({
  product,
  onClose,
}: {
  product?: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { t } = useLanguageStore();
  const [form, setForm] = useState(
    product
      ? {
          name: product.name,
          description: product.description || "",
          price: String(product.price),
          categoryId: product.categoryId,
          code: product.code || "",
          preparationTime: product.preparationTime
            ? String(product.preparationTime)
            : "",
          active: product.active,
          stockControl: product.stockControl || false,
          stockQuantity: product.stockQuantity
            ? String(product.stockQuantity)
            : "",
          stockUnit: product.stockUnit || "unidade",
          minStock: product.minStock ? String(product.minStock) : "",
        }
      : emptyForm,
  );

  const set = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoriesApi.getAll();
      return res.data;
    },
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        code: form.code || undefined,
        preparationTime: form.preparationTime
          ? parseInt(form.preparationTime)
          : undefined,
        active: form.active,
        stockControl: form.stockControl,
        stockQuantity:
          form.stockControl && form.stockQuantity
            ? parseFloat(form.stockQuantity)
            : undefined,
        stockUnit: form.stockControl ? form.stockUnit : undefined,
        minStock:
          form.stockControl && form.minStock
            ? parseFloat(form.minStock)
            : undefined,
      };
      return product
        ? productsApi.update(product.id, payload)
        : productsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(product ? t("products.updated") : t("products.created"));
      onClose();
    },
    onError: () => toast.error(t("products.error")),
  });

  const isValid =
    form.name.trim() &&
    form.price &&
    parseFloat(form.price) >= 0 &&
    form.categoryId;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">
            {product ? t("products.editProduct") : t("products.newProduct")}
          </h2>
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
              {t("products.name")} <span className="text-red-400">*</span>
            </label>
            <input
              className="input w-full"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex: Cerveja Gelada"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("products.category")} <span className="text-red-400">*</span>
            </label>
            <select
              className="input w-full"
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              <option value="">{t("tables.selectCategory")}</option>
              {categoriesData?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("products.price")} (R$){" "}
                <span className="text-red-400">*</span>
              </label>
              <input
                className="input w-full"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("products.code")}
              </label>
              <input
                className="input w-full"
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="Ex: 101"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("products.description")}
            </label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("products.description")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("products.preparationTime")} ({t("products.minutes")})
            </label>
            <input
              className="input w-full"
              type="number"
              min="0"
              value={form.preparationTime}
              onChange={(e) => set("preparationTime", e.target.value)}
              placeholder="Ex: 10"
            />
          </div>

          <div className="border-t border-gray-700 pt-4 mt-2">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="stockControl"
                checked={form.stockControl}
                onChange={(e) => set("stockControl", e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <label htmlFor="stockControl" className="text-sm font-medium">
                🍺 {t("products.stockControl")}
              </label>
            </div>

            {form.stockControl && (
              <div className="space-y-4 pl-7 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("products.stockQuantity")}
                    </label>
                    <input
                      className="input w-full"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.stockQuantity}
                      onChange={(e) => set("stockQuantity", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("products.stockUnit")}
                    </label>
                    <select
                      className="input w-full"
                      value={form.stockUnit}
                      onChange={(e) => set("stockUnit", e.target.value)}
                    >
                      <option value="unidade">Unidade</option>
                      <option value="caixa">Caixa</option>
                      <option value="litro">Litro</option>
                      <option value="kg">Kg</option>
                      <option value="pacote">Pacote</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("products.minStock")}
                  </label>
                  <input
                    className="input w-full"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minStock}
                    onChange={(e) => set("minStock", e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium">
              {t("products.active")}
            </label>
          </div>

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
              {save.isPending ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { t } = useLanguageStore();
  const [modal, setModal] = useState<null | "new" | any>(null);

  const {
    data: products,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await productsApi.getAll();
      return response.data;
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("products.deleted"));
    },
    onError: () => {
      toast.error(t("products.deleteError"));
    },
  });

  const handleDelete = async (product: any) => {
    await confirm({
      title: t("common.delete"),
      message: t("products.deleteConfirm"),
      confirmText: t("common.yes"),
      cancelText: t("common.cancel"),
      variant: "danger",
      onConfirm: () => deleteProduct.mutate(product.id),
    });
  };

  if (isError) {
    return (
      <div className="p-8">
        <div className="card bg-red-900/20 border border-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <h3 className="font-semibold">{t("common.error")}</h3>
              <p className="text-sm text-gray-400">
                {(error as Error)?.message || "Tente novamente"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("products.title")}</h1>
        <button
          onClick={() => setModal("new")}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {t("products.newProduct")}
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4">{t("products.title")}</th>
                <th className="text-left py-3 px-4">
                  {t("products.category")}
                </th>
                <th className="text-left py-3 px-4">{t("products.price")}</th>
                <th className="text-left py-3 px-4">{t("products.code")}</th>
                <th className="text-left py-3 px-4">{t("products.stock")}</th>
                <th className="text-left py-3 px-4">{t("tables.status")}</th>
                <th className="text-right py-3 px-4">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product: any) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{product.name}</td>
                  <td className="py-3 px-4">{product.category.name}</td>
                  <td className="py-3 px-4">
                    R$ {Number(product.price).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {product.code || "-"}
                  </td>
                  <td className="py-3 px-4">
                    {product.stockControl ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            product.minStock &&
                            Number(product.stockQuantity) <=
                              Number(product.minStock)
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {Number(product.stockQuantity || 0).toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {product.stockUnit || "un"}
                        </span>
                        {product.minStock &&
                          Number(product.stockQuantity) <=
                            Number(product.minStock) && (
                            <span
                              className="text-xs px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded border border-red-700"
                              title={`Estoque baixo! Mínimo: ${product.minStock}`}
                            >
                              ⚠️
                            </span>
                          )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        product.active
                          ? "bg-green-600/20 text-green-400 border border-green-600"
                          : "bg-red-600/20 text-red-400 border border-red-600"
                      }`}
                    >
                      {product.active
                        ? t("products.active")
                        : t("users.inactive")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal(product)}
                        className="p-2 hover:bg-gray-700 rounded transition-colors"
                        title="Editar produto"
                      >
                        <Edit2 size={16} className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        disabled={deleteProduct.isPending}
                        className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Excluir produto"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    {t("products.noProducts")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ProductModal
          product={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
