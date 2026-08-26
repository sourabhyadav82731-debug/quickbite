import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { authenticateSocket, SocketUser } from "./ws-auth.util";

@WebSocketGateway({ namespace: "/ws/orders", cors: { origin: "*" } })
export class OrdersGateway implements OnGatewayConnection {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(socket: Socket) {
    const user = await authenticateSocket(socket, this.jwt, this.config);
    if (!user) {
      socket.disconnect(true);
      return;
    }
    socket.data.user = user as SocketUser;
  }

  @SubscribeMessage("order.subscribe")
  onOrderSubscribe(@ConnectedSocket() socket: Socket, @MessageBody() body: { orderId: string }) {
    socket.join(`order:${body.orderId}`);
  }

  @SubscribeMessage("restaurant.subscribeKitchen")
  onKitchenSubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { restaurantId: string },
  ) {
    socket.join(`restaurant:${body.restaurantId}`);
  }

  @SubscribeMessage("admin.subscribeLedger")
  onAdminSubscribe(@ConnectedSocket() socket: Socket) {
    socket.join("admin");
  }

  emitOrderCreated(order: unknown, restaurantId: string) {
    this.server.to(`restaurant:${restaurantId}`).to("admin").emit("order.created", order);
  }

  emitOrderStatusChanged(order: any) {
    this.server
      .to(`order:${order.id}`)
      .to(`restaurant:${order.restaurantId}`)
      .to("admin")
      .emit("order.statusChanged", order);
  }

  emitKitchenTicketUpdate(restaurantId: string, order: unknown) {
    this.server.to(`restaurant:${restaurantId}`).emit("kitchen.ticketUpdate", order);
  }
}
