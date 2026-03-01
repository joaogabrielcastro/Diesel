import { useQuery } from "@tanstack/react-query";
import { tablesApi } from "../services/api";

export default function Tables() {
  const { data: tables } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const response = await tablesApi.getAll();
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-600";
      case "OCCUPIED":
        return "bg-red-600";
      case "RESERVED":
        return "bg-yellow-600";
      case "CLEANING":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Mesas</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {tables?.map((table: any) => (
          <div
            key={table.id}
            className={`card ${getStatusColor(table.status)} cursor-pointer hover:opacity-80 transition-opacity`}
          >
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">{table.number}</p>
              <p className="text-sm">{getStatusLabel(table.status)}</p>
              <p className="text-xs mt-2 text-gray-300">
                {table.capacity} pessoas
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
