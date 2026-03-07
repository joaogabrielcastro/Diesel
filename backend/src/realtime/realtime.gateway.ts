import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
  cors: true, // Will use the main CORS configuration
  namespace: "/realtime",
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Autenticar via token no handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: No token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      (client as any).user = payload;

      this.logger.log(`Client connected: ${client.id} | User: ${payload.sub}`);
    } catch (error) {
      this.logger.warn(`Client ${client.id} rejected: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    this.logger.log(
      `Client disconnected: ${client.id} | User: ${user?.sub || "Unknown"}`,
    );
  }

  @SubscribeMessage("join-establishment")
  handleJoinEstablishment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { establishmentId: string },
  ) {
    const user = (client as any).user;

    // Verificar se o usuário pertence ao estabelecimento
    if (user.establishmentId !== data.establishmentId) {
      this.logger.warn(`Client ${client.id} tried to join wrong establishment`);
      return { error: "Unauthorized" };
    }

    const room = `establishment:${data.establishmentId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);

    return { success: true, room };
  }

  @SubscribeMessage("leave-establishment")
  handleLeaveEstablishment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { establishmentId: string },
  ) {
    const room = `establishment:${data.establishmentId}`;
    client.leave(room);
    this.logger.debug(`Client ${client.id} left ${room}`);

    return { success: true };
  }

  // Broadcast new order to kitchen
  broadcastNewOrder(establishmentId: string, order: any) {
    const room = `establishment:${establishmentId}`;
    this.logger.debug(`Broadcasting new order to ${room}: ${order.id}`);
    this.server.to(room).emit("new-order", {
      type: "NEW_ORDER",
      data: order,
      timestamp: new Date(),
    });
  }

  // Broadcast order status update
  broadcastOrderUpdate(establishmentId: string, order: any) {
    const room = `establishment:${establishmentId}`;
    this.logger.debug(`Broadcasting order update to ${room}: ${order.id}`);
    this.server.to(room).emit("order-updated", {
      type: "ORDER_UPDATED",
      data: order,
      timestamp: new Date(),
    });
  }

  // Broadcast comanda update
  broadcastComandaUpdate(establishmentId: string, comanda: any) {
    const room = `establishment:${establishmentId}`;
    this.logger.debug(`Broadcasting comanda update to ${room}: ${comanda.id}`);
    this.server.to(room).emit("comanda-updated", {
      type: "COMANDA_UPDATED",
      data: comanda,
      timestamp: new Date(),
    });
  }

  // Broadcast table update
  broadcastTableUpdate(establishmentId: string, table: any) {
    const room = `establishment:${establishmentId}`;
    this.logger.debug(`Broadcasting table update to ${room}: ${table.id}`);
    this.server.to(room).emit("table-updated", {
      type: "TABLE_UPDATED",
      data: table,
      timestamp: new Date(),
    });
  }

  // Broadcast stock alert
  broadcastStockAlert(establishmentId: string, alert: any) {
    const room = `establishment:${establishmentId}`;
    this.logger.debug(`Broadcasting stock alert to ${room}`);
    this.server.to(room).emit("stock-alert", {
      type: "STOCK_ALERT",
      data: alert,
      timestamp: new Date(),
    });
  }

  // Ping para verificar conexão
  @SubscribeMessage("ping")
  handlePing() {
    return { event: "pong", timestamp: new Date() };
  }
}
