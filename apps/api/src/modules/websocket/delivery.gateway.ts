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

@WebSocketGateway({ namespace: "/ws/delivery", cors: { origin: "*" } })
export class DeliveryGateway implements OnGatewayConnection {
  private readonly logger = new Logger(DeliveryGateway.name);

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
    socket.join(`driver:${user.userId}`);
  }

  @SubscribeMessage("delivery.subscribe")
  onDeliverySubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { orderId: string },
  ) {
    socket.join(`delivery:${body.orderId}`);
  }

  @SubscribeMessage("admin.subscribeMap")
  onAdminMapSubscribe(@ConnectedSocket() socket: Socket) {
    socket.join("admin:map");
  }

  emitOffer(driverId: string, offer: unknown) {
    this.server.to(`driver:${driverId}`).emit("delivery.offer", offer);
  }

  emitAssigned(orderId: string, delivery: unknown) {
    this.server.to(`delivery:${orderId}`).to("admin:map").emit("delivery.assigned", delivery);
  }

  emitStageChanged(orderId: string, driverId: string, delivery: unknown) {
    this.server
      .to(`delivery:${orderId}`)
      .to(`driver:${driverId}`)
      .to("admin:map")
      .emit("delivery.stageChanged", delivery);
  }

  emitLocationChanged(orderId: string, location: unknown) {
    this.server
      .to(`delivery:${orderId}`)
      .to("admin:map")
      .emit("delivery.locationChanged", location);
  }
}
