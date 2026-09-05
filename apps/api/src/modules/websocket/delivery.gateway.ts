import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UserRole } from "@quickbite/types";
import { DeliveryEntity, OrderEntity, RestaurantEntity } from "../../database/entities";
import { authenticateSocket, SocketUser } from "./ws-auth.util";

@WebSocketGateway({ namespace: "/ws/delivery", cors: { origin: "*" } })
export class DeliveryGateway implements OnGatewayConnection {
  private readonly logger = new Logger(DeliveryGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    // Plain repositories (via TypeOrmModule.forFeature in WebsocketModule) —
    // not the full OrdersService/DeliveryService — specifically to avoid a
    // module import cycle (DeliveryModule/OrdersModule already import
    // WebsocketModule for RealtimeEmitterService; this stays one-directional).
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(DeliveryEntity) private readonly deliveries: Repository<DeliveryEntity>,
    @InjectRepository(RestaurantEntity) private readonly restaurants: Repository<RestaurantEntity>,
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

  // Live delivery location is private per order — a customer must only ever
  // be able to subscribe to their own order's room, a driver only to a
  // delivery they're actually assigned to, a restaurant only to its own
  // order, and admin to any. Previously this joined the room for whatever
  // orderId the client sent with no check at all — any authenticated socket
  // could subscribe to any other user's live delivery feed by guessing/
  // enumerating order ids.
  @SubscribeMessage("delivery.subscribe")
  async onDeliverySubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { orderId: string },
  ) {
    const user = socket.data.user as SocketUser | undefined;
    if (!user || !body?.orderId) return;

    const order = await this.orders.findOne({ where: { id: body.orderId } });
    if (!order) return;

    let authorized = user.role === UserRole.ADMIN;
    if (!authorized && user.role === UserRole.CUSTOMER) {
      authorized = order.customerId === user.userId;
    }
    if (!authorized && user.role === UserRole.RESTAURANT_OWNER) {
      const restaurant = await this.restaurants.findOne({ where: { id: order.restaurantId } });
      authorized = restaurant?.ownerId === user.userId;
    }
    if (!authorized && user.role === UserRole.DELIVERY_PARTNER) {
      const delivery = await this.deliveries.findOne({ where: { orderId: body.orderId } });
      authorized = delivery?.driverId === user.userId;
    }
    if (!authorized) return; // silently refuse — no signal about whether the order even exists

    socket.join(`delivery:${body.orderId}`);
  }

  @SubscribeMessage("admin.subscribeMap")
  onAdminMapSubscribe(@ConnectedSocket() socket: Socket) {
    socket.join("admin:map");
  }

  emitOffer(driverId: string, offer: unknown) {
    this.server.to(`driver:${driverId}`).emit("delivery.offer", offer);
  }

  // Tells a driver who was offered a delivery (but didn't win the accept race)
  // to close their popup — another driver already claimed it.
  emitOfferClosed(driverId: string, deliveryId: string) {
    this.server.to(`driver:${driverId}`).emit("delivery.offerClosed", { deliveryId });
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
