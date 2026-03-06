import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuthStore } from "../store/auth";
import { useLanguageStore } from "../store/language";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { t } = useLanguageStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [establishmentInfo, setEstablishmentInfo] = useState<{
    name: string;
    logo: string | null;
  }>({
    name: "Diesel Bar",
    logo: null,
  });

  // Busca informações públicas do estabelecimento ao carregar
  useEffect(() => {
    const fetchEstablishmentInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/establishments/info`);
        if (response.data) {
          setEstablishmentInfo({
            name: response.data.name || "Diesel Bar",
            logo: response.data.logo,
          });
        }
      } catch (err) {
        console.log("Usando configuração padrão do estabelecimento");
      }
    };

    fetchEstablishmentInfo();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const response = await authApi.login(email, password);
      console.log("🔑 Login feito com sucesso. Resposta:", response.data);

      const { access_token, user } = response.data;

      if (!user || !user.role) {
        console.error("❌ ERRO CRÍTICO: Usuário sem role definida!", user);
      }

      setAuth(access_token, user);

      // Redireciona por role
      const role = user.role?.toLowerCase();
      if (role === "cozinha" || role === "kitchen") navigate("/kitchen");
      else if (role === "garcom" || role === "waiter") navigate("/tables");
      else navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  // Define qual logo usar: do banco > arquivo estático > padrão
  const logoSrc = establishmentInfo.logo
    ? `${API_URL}/uploads/${establishmentInfo.logo}`
    : "/logo.png";

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logoSrc}
            alt={establishmentInfo.name}
            className="h-24 mx-auto mb-3 object-contain"
            onError={(e) => {
              // Fallback para logo padrão se houver erro
              e.currentTarget.src = "/icon-192.png";
            }}
          />
          <h1 className="text-2xl font-bold mb-2">{establishmentInfo.name}</h1>
          <p className="text-gray-400">{t("login.panel")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("login.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("login.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? t("login.loading") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
