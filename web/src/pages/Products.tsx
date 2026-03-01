import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../services/api";
import { Plus } from "lucide-react";

export default function Products() {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await productsApi.getAll();
      return response.data;
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4">Produto</th>
              <th className="text-left py-3 px-4">Categoria</th>
              <th className="text-left py-3 px-4">Preço</th>
              <th className="text-left py-3 px-4">Código</th>
              <th className="text-left py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product: any) => (
              <tr
                key={product.id}
                className="border-b border-gray-800 hover:bg-gray-800/50"
              >
                <td className="py-3 px-4">{product.name}</td>
                <td className="py-3 px-4">{product.category.name}</td>
                <td className="py-3 px-4">R$ {product.price.toFixed(2)}</td>
                <td className="py-3 px-4">{product.code || "-"}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      product.active ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {product.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
