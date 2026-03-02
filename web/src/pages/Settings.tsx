import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Image as ImageIcon, Save, X } from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";
import { useAuthStore } from "../store/auth";

export default function Settings() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Buscar estabelecimento
  const { data: establishment, isLoading } = useQuery({
    queryKey: ["establishment", user?.establishmentId],
    queryFn: async () => {
      const response = await api.get(
        `/establishments/${user?.establishmentId}`,
      );
      return response.data;
    },
    enabled: !!user?.establishmentId,
  });

  // Upload logo
  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await api.post("/upload/logo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Logo atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["establishment"] });
      setLogo(null);
      setLogoPreview(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao fazer upload");
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 5MB");
        return;
      }

      // Validar tipo
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas");
        return;
      }

      setLogo(file);

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (logo) {
      uploadLogo.mutate(logo);
    }
  };

  const handleCancel = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const currentLogoUrl = establishment?.logo
    ? `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/uploads/${establishment.logo}`
    : null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-gray-400 mt-2">
            Gerencie as configurações do estabelecimento
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo do Estabelecimento */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ImageIcon size={20} />
            Logo do Estabelecimento
          </h2>

          {/* Logo Atual */}
          {currentLogoUrl && !logoPreview && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Logo Atual:</p>
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                <img
                  src={currentLogoUrl}
                  alt="Logo"
                  className="max-h-32 object-contain"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/150?text=Logo";
                  }}
                />
              </div>
            </div>
          )}

          {/* Preview do novo logo */}
          {logoPreview && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Novo Logo:</p>
              <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                <img
                  src={logoPreview}
                  alt="Preview"
                  className="max-h-32 object-contain"
                />
              </div>
            </div>
          )}

          {/* Upload */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="logo-upload"
                className="btn btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload size={20} />
                Selecionar Imagem
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <p className="text-xs text-gray-400 mt-2">
                Formatos: JPG, PNG, GIF, WEBP • Máximo: 5MB
              </p>
            </div>

            {logo && (
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploadLogo.isPending}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {uploadLogo.isPending ? "Salvando..." : "Salvar Logo"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={uploadLogo.isPending}
                  className="btn bg-gray-700 hover:bg-gray-600 flex items-center justify-center gap-2"
                >
                  <X size={20} />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informações do Estabelecimento */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Informações</h2>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 bg-gray-800 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-800 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-800 rounded animate-pulse"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={establishment?.name || ""}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={establishment?.cnpj || ""}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={establishment?.phone || ""}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={establishment?.address || ""}
                  disabled
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg"
                />
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Para alterar essas informações, entre em contato com o suporte
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
