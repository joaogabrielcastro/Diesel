import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("join-establishment")
  handleJoinEstablishment(client: Socket, establishmentId: string) {
    client.join(`establishment:${establishmentId}`);
    console.log(`Client ${client.id} joined establishment ${establishmentId}`);
  }

  // Broadcast new order to kitchen
  broadcastNewOrder(establishmentId: string, order: any) {
    this.server.to(`establishment:${establishmentId}`).emit("new-order", order);
  }

  // Broadcast order status update
  broadcastOrderUpdate(establishmentId: string, order: any) {
    this.server
      .to(`establishment:${establishmentId}`)
      .emit("order-updated", order);
  }

  // Broadcast comanda update
  broadcastComandaUpdate(establishmentId: string, comanda: any) {
    this.server
      .to(`establishment:${establishmentId}`)
      .emit("comanda-updated", comanda);
  }
}
