import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  X,
  ShoppingCart,
  Minus,
  AlertCircle,
  Users,
  ClipboardList,
  Receipt,
  Clock,
  ChefHat,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  tablesApi,
  comandasApi,
  ordersApi,
  productsApi,
  categoriesApi,
} from "../services/api";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "border-green-500 bg-green-800 hover:bg-green-700",
  OCCUPIED: "border-red-500 bg-red-800 hover:bg-red-700",
  RESERVED: "border-yellow-500 bg-yellow-800 hover:bg-yellow-700",
  CLEANING: "border-blue-500 bg-blue-800 hover:bg-blue-700",
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Disponível",
  OCCUPIED: "Ocupada",
  RESERVED: "Reservada",
  CLEANING: "Limpeza",
};

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ─── Modal Novo Pedido ─────────────────────────────────────────────────────────
function NewOrderModal({
  table,
  existingComandaId,
  onClose,
}: {
  table: any;
  existingComandaId?: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  // If we already have a comanda (mesa ocupada → Add Order), skip setup
  const [step, setStep] = useState<"setup" | "products">(
    existingComandaId ? "products" : "setup",
  );
  const [customerName, setCustomerName] = useState("");
  const [comandaId, setComanadaId] = useState<string | null>(
    existingComandaId ?? null,
  );
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [obs, setObs] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
  });

  const filteredProducts = selectedCategory
    ? products?.filter((p: any) => p.categoryId === selectedCategory)
    : products;

  const createComanda = useMutation({
    mutationFn: () =>
      comandasApi.create({
        tableId: table.id,
        customerName: customerName || `Mesa ${table.number}`,
      }),
    onSuccess: (res) => {
      setComanadaId(res.data.id);
      setStep("products");
      tablesApi.updateStatus(table.id, "OCCUPIED").catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: () => toast.error("Erro ao abrir comanda"),
  });

  const createOrder = useMutation({
    mutationFn: () =>
      ordersApi.create({
        comandaId,
        observations: obs,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      }),
    onSuccess: () => {
      toast.success("Pedido enviado para a cozinha! 🍳");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: () => toast.error("Erro ao enviar pedido"),
  });

  const addItem = (product: any) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.productId === product.id);
      if (ex)
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.productId === productId);
      if (ex && ex.quantity > 1)
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
        );
      return prev.filter((i) => i.productId !== productId);
    });
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold">Mesa {table.number}</h2>
            <p className="text-gray-400 text-sm">
              {step === "setup" ? "Abrir comanda" : "Escolher produtos"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {step === "setup" ? (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nome do cliente (opcional)
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={`Mesa ${table.number}`}
                className="input w-full"
                onKeyDown={(e) => e.key === "Enter" && createComanda.mutate()}
                autoFocus
              />
            </div>
            <button
              onClick={() => createComanda.mutate()}
              disabled={createComanda.isPending}
              className="btn btn-primary w-full text-lg py-3"
            >
              {createComanda.isPending
                ? "Abrindo comanda..."
                : "Abrir Comanda →"}
            </button>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Lista de produtos */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Filtro por categoria */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? "bg-primary text-white" : "bg-gray-800 hover:bg-gray-700"}`}
                >
                  Todos
                </button>
                {categories?.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? "bg-primary text-white" : "bg-gray-800 hover:bg-gray-700"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts
                  ?.filter((p: any) => p.active !== false)
                  .map((product: any) => {
                    const qty =
                      items.find((i) => i.productId === product.id)?.quantity ??
                      0;
                    return (
                      <div
                        key={product.id}
                        onClick={() => addItem(product)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${qty > 0 ? "border-primary bg-primary/10" : "border-gray-700 hover:border-gray-600 bg-gray-800/50"}`}
                      >
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-primary font-bold mt-1 text-sm">
                          {fmt(product.price)}
                        </p>
                        {qty > 0 && (
                          <div
                            className="flex items-center gap-2 mt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => removeItem(product.id)}
                              className="bg-gray-700 hover:bg-gray-600 rounded p-1"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-bold text-sm w-4 text-center">
                              {qty}
                            </span>
                            <button
                              onClick={() => addItem(product)}
                              className="bg-gray-700 hover:bg-gray-600 rounded p-1"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Carrinho */}
            <div className="w-60 border-l border-gray-800 flex flex-col p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                <ShoppingCart size={16} /> Pedido
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {items.length === 0 ? (
                  <p className="text-gray-500 text-xs text-center py-4">
                    Nenhum item selecionado
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between items-start text-xs bg-gray-800 rounded p-2 gap-1"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.quantity}x {item.name}
                        </p>
                        <p className="text-gray-400">
                          {fmt(item.price * item.quantity)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-gray-500 hover:text-red-400 flex-shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <textarea
                placeholder="Observações..."
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="input text-xs mt-3 resize-none h-14"
              />
              <div className="mt-3 border-t border-gray-800 pt-3">
                <div className="flex justify-between font-bold text-sm mb-3">
                  <span>Total</span>
                  <span className="text-primary">{fmt(total)}</span>
                </div>
                <button
                  onClick={() => createOrder.mutate()}
                  disabled={items.length === 0 || createOrder.isPending}
                  className="btn btn-primary w-full text-sm disabled:opacity-50"
                >
                  {createOrder.isPending
                    ? "Enviando..."
                    : "Enviar p/ Cozinha 🍳"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal Mesa Ocupada ────────────────────────────────────────────────────────
function OccupiedTableModal({
  table,
  onClose,
}: {
  table: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [showNewOrder, setShowNewOrder] = useState(false);

  const { data: comanda, isLoading } = useQuery({
    queryKey: ["comanda-table", table.id],
    queryFn: async () => (await comandasApi.getByTable(table.id)).data,
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => tablesApi.updateStatus(table.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["comanda-table", table.id] });
      toast.success("Status atualizado");
      onClose();
    },
  });

  // Flatten all items across every order for summary view
  const allItems: { name: string; qty: number; price: number }[] = [];
  if (comanda?.orders) {
    const itemMap: Record<
      string,
      { name: string; qty: number; price: number }
    > = {};
    for (const order of comanda.orders) {
      for (const item of order.items ?? []) {
        const key = item.product?.id ?? item.productId;
        if (itemMap[key]) {
          itemMap[key].qty += item.quantity;
        } else {
          itemMap[key] = {
            name: item.product?.name ?? "—",
            qty: item.quantity,
            price: item.unitPrice ?? item.product?.price ?? 0,
          };
        }
      }
    }
    allItems.push(...Object.values(itemMap));
  }
  const total = allItems.reduce((s, i) => s + i.price * i.qty, 0);

  const ORDER_STATUS_BADGE: Record<
    string,
    { label: string; cls: string; icon: JSX.Element | null }
  > = {
    PENDING: {
      label: "Aguardando",
      cls: "bg-yellow-900 text-yellow-300",
      icon: <Clock size={11} />,
    },
    PREPARING: {
      label: "Preparando",
      cls: "bg-blue-900 text-blue-300",
      icon: <ChefHat size={11} />,
    },
    READY: {
      label: "Pronto",
      cls: "bg-green-900 text-green-300",
      icon: <CheckCircle2 size={11} />,
    },
    DELIVERED: {
      label: "Entregue",
      cls: "bg-gray-700 text-gray-400",
      icon: <CheckCircle2 size={11} />,
    },
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-lg flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Receipt size={20} className="text-red-400" />
              Mesa {table.number}
            </h2>
            {comanda?.customerName && (
              <p className="text-gray-400 text-sm mt-0.5">
                👤 {comanda.customerName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Comanda body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 size={18} className="animate-spin" /> Carregando
              comanda...
            </div>
          ) : !comanda ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              Nenhuma comanda aberta encontrada
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Resumo de itens */}
              {allItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Consumo
                  </p>
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    {allItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center px-4 py-2.5 border-b border-gray-700/50 last:border-0 text-sm"
                      >
                        <span>
                          <span className="font-medium text-gray-300">
                            {item.qty}x
                          </span>{" "}
                          {item.name}
                        </span>
                        <span className="text-gray-300 font-medium">
                          {fmt(item.price * item.qty)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-800/80 font-bold">
                      <span>Total</span>
                      <span className="text-primary text-lg">{fmt(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pedidos com status */}
              {comanda.orders?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Pedidos ({comanda.orders.length})
                  </p>
                  <div className="space-y-2">
                    {comanda.orders.map((order: any, idx: number) => {
                      const badge = ORDER_STATUS_BADGE[order.status] ?? {
                        label: order.status,
                        cls: "bg-gray-700 text-gray-400",
                        icon: null,
                      };
                      return (
                        <div
                          key={order.id}
                          className="bg-gray-800 rounded-lg px-4 py-3"
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs text-gray-400">
                              Pedido #{idx + 1}
                            </span>
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}
                            >
                              {badge.icon} {badge.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">
                            {order.items
                              ?.map(
                                (i: any) => `${i.quantity}x ${i.product?.name}`,
                              )
                              .join(", ")}
                          </p>
                          {order.observations && (
                            <p className="text-xs text-yellow-400/80 mt-1">
                              📝 {order.observations}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {allItems.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">
                  Comanda aberta, sem pedidos ainda
                </p>
              )}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <button
            onClick={() => setShowNewOrder(true)}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Adicionar Pedido
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus.mutate("CLEANING")}
              disabled={updateStatus.isPending}
              className="btn bg-blue-700 hover:bg-blue-600 flex-1 text-sm"
            >
              Limpeza
            </button>
            <button
              onClick={() => updateStatus.mutate("AVAILABLE")}
              disabled={updateStatus.isPending}
              className="btn bg-green-700 hover:bg-green-600 flex-1 text-sm"
            >
              Liberar Mesa
            </button>
          </div>
        </div>
      </div>

      {showNewOrder && (
        <NewOrderModal
          table={table}
          existingComandaId={comanda?.id}
          onClose={() => {
            setShowNewOrder(false);
            queryClient.invalidateQueries({
              queryKey: ["comanda-table", table.id],
            });
          }}
        />
      )}
    </div>
  );
}

// ─── Modal Nova Mesa ──────────────────────────────────────────────────────────
function NewTableModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState("4");

  const createTable = useMutation({
    mutationFn: () =>
      tablesApi.create({
        number: parseInt(number),
        capacity: parseInt(capacity),
      }),
    onSuccess: () => {
      toast.success("Mesa criada!");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      onClose();
    },
    onError: () => toast.error("Erro ao criar mesa"),
  });

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Nova Mesa</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Número da mesa
            </label>
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="input w-full"
              placeholder="1"
              min={1}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Capacidade (pessoas)
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="input w-full"
              min={1}
              max={20}
            />
          </div>
          <button
            onClick={() => createTable.mutate()}
            disabled={!number || createTable.isPending}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {createTable.isPending ? "Criando..." : "Criar Mesa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Tables() {
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showNewTable, setShowNewTable] = useState(false);

  const {
    data: tables,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => (await tablesApi.getAll()).data,
    refetchInterval: 30000,
  });

  if (isError) {
    return (
      <div className="p-8">
        <div className="card bg-red-900/20 border border-red-700 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p>{(error as Error)?.message || "Erro ao carregar mesas"}</p>
        </div>
      </div>
    );
  }

  const available =
    tables?.filter((t: any) => t.status === "AVAILABLE").length ?? 0;
  const occupied =
    tables?.filter((t: any) => t.status === "OCCUPIED").length ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mesas</h1>
        <button
          onClick={() => setShowNewTable(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Nova Mesa
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-green-400">{available}</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-1">
            <Users size={14} /> Disponíveis
          </p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold text-red-400">{occupied}</p>
          <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-1">
            <ClipboardList size={14} /> Ocupadas
          </p>
        </div>
        <div className="card text-center py-4">
          <p className="text-3xl font-bold">{tables?.length ?? 0}</p>
          <p className="text-sm text-gray-400 mt-1">Total</p>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 mb-6 flex-wrap text-sm">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <span key={k} className="flex items-center gap-2 text-gray-400">
            <span
              className={`w-3 h-3 rounded-full ${STATUS_COLOR[k]?.split(" ")[0]}`}
            />
            {v}
          </span>
        ))}
        <span className="text-gray-500 text-xs ml-auto">
          Clique em uma mesa para abrir/gerenciar pedido
        </span>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
          {tables?.map((table: any) => (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all hover:scale-105 text-center select-none ${STATUS_COLOR[table.status] ?? "border-gray-600 bg-gray-800"}`}
            >
              <p className="text-4xl font-bold">{table.number}</p>
              <p className="text-xs mt-1 font-medium opacity-90">
                {STATUS_LABEL[table.status] ?? table.status}
              </p>
              <p className="text-xs mt-1 opacity-60">{table.capacity}p</p>
            </div>
          ))}
          {(!tables || tables.length === 0) && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <p className="text-lg">Nenhuma mesa cadastrada</p>
              <p className="text-sm mt-2">Clique em "Nova Mesa" para começar</p>
            </div>
          )}
        </div>
      )}

      {selectedTable?.status === "AVAILABLE" && (
        <NewOrderModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
      {selectedTable && selectedTable.status !== "AVAILABLE" && (
        <OccupiedTableModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
      {showNewTable && <NewTableModal onClose={() => setShowNewTable(false)} />}
    </div>
  );
}
