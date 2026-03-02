import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { productsApi } from "../services/api";
import { useConfirm } from "../hooks/useConfirm";
import { TableSkeleton } from "../components/LoadingSkeleton";

export default function Products() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

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
      toast.success("Produto excluído com sucesso");
    },
    onError: () => {
      toast.error("Erro ao excluir produto");
    },
  });

  const handleDelete = async (product: any) => {
    await confirm({
      title: "Excluir produto",
      message: `Tem certeza que deseja excluir "${product.name}"? Esta ação não pode ser desfeita.`,
      confirmText: "Sim, excluir",
      cancelText: "Cancelar",
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
              <h3 className="font-semibold">Erro ao carregar produtos</h3>
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
        <h1 className="text-3xl font-bold">Produtos</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4">Produto</th>
                <th className="text-left py-3 px-4">Categoria</th>
                <th className="text-left py-3 px-4">Preço</th>
                <th className="text-left py-3 px-4">Código</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Ações</th>
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
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        product.active
                          ? "bg-green-600/20 text-green-400 border border-green-600"
                          : "bg-red-600/20 text-red-400 border border-red-600"
                      }`}
                    >
                      {product.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
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
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Nenhum produto cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
