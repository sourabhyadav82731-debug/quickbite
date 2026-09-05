import { Injectable } from "@nestjs/common";
import { OrdersGateway } from "./orders.gateway";
import { DeliveryGateway } from "./delivery.gateway";

@Injectable()
export class RealtimeEmitterService {
  constructor(
    private readonly ordersGateway: OrdersGateway,
    private readonly deliveryGateway: DeliveryGateway,
  ) {}

  orderCreated(order: any) {
    this.ordersGateway.emitOrderCreated(order, order.restaurantId);
  }

  orderStatusChanged(order: any) {
    this.ordersGateway.emitOrderStatusChanged(order);
  }

  kitchenTicketUpdate(restaurantId: string, order: any) {
    this.ordersGateway.emitKitchenTicketUpdate(restaurantId, order);
  }

  deliveryOffer(driverId: string, offer: any) {
    this.deliveryGateway.emitOffer(driverId, offer);
  }

  deliveryOfferClosed(driverId: string, deliveryId: string) {
    this.deliveryGateway.emitOfferClosed(driverId, deliveryId);
  }

  deliveryAssigned(orderId: string, delivery: any) {
    this.deliveryGateway.emitAssigned(orderId, delivery);
  }

  deliveryStageChanged(orderId: string, driverId: string, delivery: any) {
    this.deliveryGateway.emitStageChanged(orderId, driverId, delivery);
  }

  deliveryLocationChanged(orderId: string, location: any) {
    this.deliveryGateway.emitLocationChanged(orderId, location);
  }
}
