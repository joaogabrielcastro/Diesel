import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { ordersApi, tablesApi } from "../services/api";
import { CardSkeleton, ListSkeleton } from "../components/LoadingSkeleton";

export default function Dashboard() {
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await ordersApi.getAll();
      return response.data;
    },
  });

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await tablesApi.getAll();
      return response.data;
    },
  });

  const isLoading = ordersLoading || tablesLoading;

  const stats = [
    {
      label: "Pedidos Hoje",
      value: orders?.length || 0,
      icon: ShoppingCart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Mesas Ocupadas",
      value: tables?.filter((t: any) => t.status === "OCCUPIED").length || 0,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Faturamento",
      value: "R$ 2.450",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Crescimento",
      value: "+12%",
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {isLoading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListSkeleton items={5} />
            <CardSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="card hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`${stat.color} w-8 h-8`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Pedidos Recentes</h2>
              <div className="space-y-3">
                {orders?.slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-dark rounded-lg hover:bg-gray-800/70 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        Mesa {order.comanda?.table?.number || "Cassino"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {order.items?.length}{" "}
                        {order.items?.length === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.status === "DELIVERED"
                          ? "bg-green-600/20 text-green-400 border border-green-600"
                          : order.status === "PREPARING"
                            ? "bg-blue-600/20 text-blue-400 border border-blue-600"
                            : order.status === "READY"
                              ? "bg-purple-600/20 text-purple-400 border border-purple-600"
                              : "bg-yellow-600/20 text-yellow-400 border border-yellow-600"
                      }`}
                    >
                      {order.status === "PENDING"
                        ? "Pendente"
                        : order.status === "PREPARING"
                          ? "Preparando"
                          : order.status === "READY"
                            ? "Pronto"
                            : "Entregue"}
                    </span>
                  </div>
                ))}
                {(!orders || orders.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart
                      className="mx-auto mb-2 opacity-50"
                      size={32}
                    />
                    <p>Nenhum pedido hoje</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4">Status das Mesas</h2>
              <div className="grid grid-cols-5 gap-3">
                {tables?.map((table: any) => (
                  <div
                    key={table.id}
                    className={`aspect-square flex items-center justify-center rounded-lg font-bold text-lg transition-transform hover:scale-110 ${
                      table.status === "OCCUPIED"
                        ? "bg-red-600 hover:bg-red-700"
                        : table.status === "RESERVED"
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : table.status === "CLEANING"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-green-600 hover:bg-green-700"
                    }`}
                    title={`Mesa ${table.number} - ${
                      table.status === "OCCUPIED"
                        ? "Ocupada"
                        : table.status === "RESERVED"
                          ? "Reservada"
                          : table.status === "CLEANING"
                            ? "Limpeza"
                            : "Disponível"
                    }`}
                  >
                    {table.number}
                  </div>
                ))}
                {(!tables || tables.length === 0) && (
                  <div className="col-span-5 text-center py-8 text-gray-400">
                    <Users className="mx-auto mb-2 opacity-50" size={32} />
                    <p>Nenhuma mesa cadastrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
