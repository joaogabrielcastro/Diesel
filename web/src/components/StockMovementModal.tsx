import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { stockApi } from "../services/api";

interface StockMovementModalProps {
  item: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    needsRestock?: boolean;
  };
  type: "IN" | "OUT";
  onClose: () => void;
}

export function StockMovementModal({
  item,
  type,
  onClose,
}: StockMovementModalProps) {
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
          reason.trim() || (type === "IN" ? "Reabastecimento" : "Consumo"),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["stock-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-stock"] });
      toast.success(
        type === "IN" ? "Entrada registrada!" : "Saída registrada!",
      );
      onClose();
    },
    onError: () => toast.error("Erro ao registrar movimentação"),
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
            {type === "IN" ? "Entrada de Estoque" : "Saída de Estoque"}
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
          {" · "}Atual:{" "}
          <span
            className={`font-bold ${item.needsRestock ? "text-red-400" : "text-green-400"}`}
          >
            {item.currentStock} {item.unit}
          </span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Quantidade ({item.unit}) <span className="text-red-400">*</span>
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
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <input
              className="input w-full"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === "IN"
                  ? "Ex: Compra, Reposição..."
                  : "Ex: Consumo, Vencido..."
              }
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="btn w-full bg-gray-700 hover:bg-gray-600"
            >
              Cancelar
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
              {move.isPending ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
