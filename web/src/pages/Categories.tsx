import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Pencil, Trash2, AlertCircle, Tag } from "lucide-react";
import { toast } from "sonner";
import { categoriesApi } from "../services/api";
import { useLanguageStore } from "../store/language";

const EMOJI_LIST = [
  "🍺",
  "🍔",
  "🍕",
  "🍝",
  "🍣",
  "🥗",
  "🍰",
  "🧃",
  "🥩",
  "🍟",
  "🍦",
  "🍷",
  "🥤",
  "🫕",
  "🍜",
  "🧆",
  "🥪",
  "🍤",
  "🍗",
  "☕",
];

function CategoryModal({
  category,
  onClose,
}: {
  category?: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { t } = useLanguageStore();
  const isEdit = !!category;

  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "🍽️");

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? categoriesApi.update(category.id, { name, icon })
        : categoriesApi.create({ name, icon }),
    onSuccess: () => {
      toast.success(isEdit ? t("categories.updated") : t("categories.created"));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onClose();
    },
    onError: () => toast.error(t("categories.error")),
  });

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">
            {isEdit
              ? t("categories.editCategory")
              : t("categories.newCategory")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Preview */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center text-5xl border-2 border-gray-700">
              {icon}
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("categories.icon")}
            </label>
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_LIST.map((e) => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`text-xl p-1 rounded-lg transition-colors ${
                    icon === e
                      ? "bg-primary ring-2 ring-primary"
                      : "hover:bg-gray-700"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="input w-full mt-2 text-center"
              placeholder="Ou cole um emoji aqui"
              maxLength={4}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("categories.name")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Ex: Bebidas, Comidas, Sobremesas..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && save.mutate()}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="btn flex-1 bg-gray-700 hover:bg-gray-600"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={!name.trim() || save.isPending}
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {save.isPending ? t("common.loading") : t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Categories() {
  const queryClient = useQueryClient();
  const { t } = useLanguageStore();
  const [modal, setModal] = useState<"new" | any | null>(null);

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await categoriesApi.getAll()).data,
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      toast.success(t("categories.deleted"));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => toast.error(t("categories.deleteError")),
  });

  const handleDelete = (cat: any) => {
    if (
      !confirm(
        `Remover categoria "${cat.name}"? Produtos vinculados perderão a categoria.`,
      )
    )
      return;
    deleteCategory.mutate(cat.id);
  };

  if (isError) {
    return (
      <div className="p-8">
        <div className="card bg-red-900/20 border border-red-700 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p>{t("common.error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag size={28} /> {t("categories.title")}
          </h1>
          <p className="text-gray-400 mt-1">
            Organize os produtos por categorias
          </p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> {t("categories.newCategory")}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-32 animate-pulse bg-gray-800" />
          ))}
        </div>
      ) : (
        <>
          {!categories || categories.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">🏷️</p>
              <p className="text-lg font-medium">
                {t("categories.noCategories")}
              </p>
              <p className="text-sm mt-2">
                Clique em "Nova Categoria" para começar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map((cat: any) => (
                <div
                  key={cat.id}
                  className="card relative group flex flex-col items-center py-6 gap-3 hover:border-primary/50 transition-colors cursor-default"
                >
                  <span className="text-5xl">{cat.icon}</span>
                  <span className="font-semibold text-center">{cat.name}</span>

                  {/* Ações (aparecem no hover) */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModal(cat)}
                      className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 bg-gray-700 hover:bg-red-700 rounded-lg"
                      title="Remover"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {modal && (
        <CategoryModal
          category={modal === "new" ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
