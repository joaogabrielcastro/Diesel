import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { toast } from "sonner";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

let socket: Socket | null = null;
let orderSound: HTMLAudioElement | null = null;

// Inicializar som de notificação
if (typeof window !== "undefined") {
  orderSound = new Audio("/notification.mp3");
  orderSound.volume = 0.7;
}

export function useWebSocket(establishmentId?: string) {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(socket);
  const [isConnected, setIsConnected] = useState(socket?.connected ?? false);

  useEffect(() => {
    // If we just want the instance and it already exists
    if (!establishmentId && socket) {
      setSocketInstance(socket);
      setIsConnected(socket.connected);
      return;
    }

    if (!establishmentId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Criar conexão apenas uma vez
    if (!socket) {
      socket = io(`${SOCKET_URL}/realtime`, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        console.log("✅ WebSocket conectado");
        setIsConnected(true);
        toast.success("Conectado ao servidor", { duration: 2000 });
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ WebSocket desconectado:", reason);
        setIsConnected(false);

        if (reason === "io server disconnect") {
          // Reconectar se servidor desconectou
          socket?.connect();
        }
      });

      socket.on("connect_error", (error) => {
        console.error("Erro de conexão:", error);
        setIsConnected(false);
      });

      // Pong response
      socket.on("pong", (data) => {
        console.log("Pong received:", data);
      });

      // Expose socket globally for badge notifications
      (window as any).__socket = socket;
    }

    setSocketInstance(socket);

    // Join establishment room
    socket.emit("join-establishment", { establishmentId }, (response: any) => {
      if (response?.success) {
        console.log(`Joined room: ${response.room}`);
      } else if (response?.error) {
        console.error("Failed to join room:", response.error);
        toast.error("Erro ao conectar ao estabelecimento");
      }
    });

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (socket?.connected) {
        socket.emit("ping");
      }
    }, 30000); // 30 segundos

    return () => {
      clearInterval(pingInterval);
      // Don't disconnect global socket on unmount, just leave room?
      // Actually typically we want to stay connected in SPA.
      // socket?.emit("leave-establishment", { establishmentId });
    };
  }, [establishmentId]);

  return { socket: socketInstance, isConnected };
}

export function useOrderNotifications() {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (event: any) => {
      console.log("New order received:", event);

      const order = event.data;

      // Tocar som
      orderSound?.play().catch((e) => console.error("Sound play error:", e));

      // Mostrar toast
      toast.success(`🔔 Novo Pedido #${order.id}`, {
        description: `Mesa ${order.comanda?.table?.number || "?"} - ${order.orderItems?.length || 0} itens`,
        duration: 5000,
      });

      // Enviar notificação do navegador
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Novo Pedido", {
          body: `Mesa ${order.comanda?.table?.number || "?"} - ${order.orderItems?.length || 0} itens`,
          icon: "/logo.png",
          badge: "/logo.png",
        });
      }
    };

    const handleOrderUpdate = (event: any) => {
      console.log("Order updated:", event);
      const order = event.data;

      toast.info(`Pedido #${order.id} atualizado`, {
        description: `Status: ${order.status}`,
        duration: 3000,
      });
    };

    const handleComandaUpdate = (event: any) => {
      console.log("Comanda updated:", event);
    };

    const handleTableUpdate = (event: any) => {
      console.log("Table updated:", event);
    };

    const handleStockAlert = (event: any) => {
      console.log("Stock alert:", event);
      const alert = event.data;

      orderSound?.play().catch((e) => console.error("Sound play error:", e));

      toast.warning("⚠️ Alerta de Estoque", {
        description: alert.message,
        duration: 5000,
      });
    };

    socket.on("new-order", handleNewOrder);
    socket.on("order-updated", handleOrderUpdate);
    socket.on("comanda-updated", handleComandaUpdate);
    socket.on("table-updated", handleTableUpdate);
    socket.on("stock-alert", handleStockAlert);

    // Pedir permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted");
        }
      });
    }

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.off("order-updated", handleOrderUpdate);
      socket.off("comanda-updated", handleComandaUpdate);
      socket.off("table-updated", handleTableUpdate);
      socket.off("stock-alert", handleStockAlert);
    };
  }, [socket]);
}

export function getSocket() {
  return socket;
}
