import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserCog,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { usersApi } from "../services/api";

const ROLES: { value: string; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "garcom", label: "Garçom" },
  { value: "cozinha", label: "Cozinha" },
];

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-700 text-purple-200",
  garcom: "bg-blue-700 text-blue-200",
  cozinha: "bg-orange-700 text-orange-200",
};

function UserModal({ user, onClose }: { user?: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!user;

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "garcom",
  });

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? usersApi.update(user.id, {
            name: form.name,
            email: form.email,
            role: form.role,
            ...(form.password ? { password: form.password } : {}),
          })
        : usersApi.create(form),
    onSuccess: () => {
      toast.success(isEdit ? "Usuário atualizado!" : "Usuário criado!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao salvar usuário");
    },
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">
            {isEdit ? "Editar Usuário" : "Novo Usuário"}
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
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input w-full"
              placeholder="João Silva"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="input w-full"
              placeholder="joao@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {isEdit ? "Nova Senha (deixe vazio para manter)" : "Senha"}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="input w-full"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cargo</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="input w-full"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="btn flex-1 bg-gray-700 hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={
                !form.name ||
                !form.email ||
                (!isEdit && !form.password) ||
                save.isPending
              }
              className="btn btn-primary flex-1 disabled:opacity-50"
            >
              {save.isPending ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"create" | any | null>(null);

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await usersApi.getAll()).data,
  });

  const toggleActive = useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      toast.success("Usuário removido");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => toast.error("Erro ao remover usuário"),
  });

  const handleDelete = (user: any) => {
    if (!confirm(`Remover usuário "${user.name}"?`)) return;
    deleteUser.mutate(user.id);
  };

  if (isError) {
    return (
      <div className="p-8">
        <div className="card bg-red-900/20 border border-red-700 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p>Erro ao carregar usuários</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog size={30} /> Usuários
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie os funcionários do estabelecimento
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-16 animate-pulse bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-sm text-gray-400">
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">E-mail</th>
                <th className="px-5 py-4">Cargo</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              )}
              {users?.map((user: any) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-5 py-4 font-medium">{user.name}</td>
                  <td className="px-5 py-4 text-gray-400 text-sm">
                    {user.email}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role] ?? "bg-gray-700"}`}
                    >
                      {ROLES.find((r) => r.value === user.role)?.label ??
                        user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`flex items-center gap-1.5 text-sm font-medium ${user.active ? "text-green-400" : "text-gray-500"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${user.active ? "bg-green-400" : "bg-gray-500"}`}
                      />
                      {user.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleActive.mutate(user.id)}
                        title={user.active ? "Desativar" : "Ativar"}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        {user.active ? (
                          <ToggleRight size={18} className="text-green-400" />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => setModal(user)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <UserCog size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-2 hover:bg-red-900 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <UserModal
          user={modal === "create" ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
