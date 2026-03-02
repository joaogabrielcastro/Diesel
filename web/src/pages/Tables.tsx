import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { tablesApi } from "../services/api";
import { useConfirm } from "../hooks/useConfirm";
import { LoadingSkeleton } from "../components/LoadingSkeleton";

export default function Tables() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const {
    data: tables,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await tablesApi.getAll();
      return response.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tablesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Status da mesa atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status da mesa");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-600 hover:bg-green-700";
      case "OCCUPIED":
        return "bg-red-600 hover:bg-red-700";
      case "RESERVED":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "CLEANING":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Disponível";
      case "OCCUPIED":
        return "Ocupada";
      case "RESERVED":
        return "Reservada";
      case "CLEANING":
        return "Limpeza";
      default:
        return status;
    }
  };

  const handleTableClick = async (table: any) => {
    const statusOptions = [
      { value: "AVAILABLE", label: "Disponível" },
      { value: "OCCUPIED", label: "Ocupada" },
      { value: "RESERVED", label: "Reservada" },
      { value: "CLEANING", label: "Limpeza" },
    ];

    // Simple status rotation for now - in production, you'd show a modal with options
    const currentIndex = statusOptions.findIndex(
      (s) => s.value === table.status,
    );
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];

    await confirm({
      title: `Mesa ${table.number}`,
      message: `Mudar status para "${nextStatus.label}"?`,
      confirmText: "Sim, alterar",
      cancelText: "Cancelar",
      variant: "info",
      onConfirm: () =>
        updateStatus.mutate({ id: table.id, status: nextStatus.value }),
    });
  };

  if (isError) {
    return (
      <div className="p-8">
        <div className="card bg-red-900/20 border border-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <div>
              <h3 className="font-semibold">Erro ao carregar mesas</h3>
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
        <h1 className="text-3xl font-bold">Mesas</h1>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus size={20} />
          Nova Mesa
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {tables?.map((table: any) => (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`card ${getStatusColor(table.status)} cursor-pointer transition-all transform hover:scale-105`}
            >
              <div className="text-center">
                <p className="text-4xl font-bold mb-2">{table.number}</p>
                <p className="text-sm font-medium">
                  {getStatusLabel(table.status)}
                </p>
                <p className="text-xs mt-2 text-gray-300">
                  {table.capacity} pessoas
                </p>
              </div>
            </div>
          ))}
          {(!tables || tables.length === 0) && (
            <div className="col-span-full text-center py-12 text-gray-400">
              Nenhuma mesa cadastrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}
