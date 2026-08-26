import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderStatus, RestaurantStatus, UserRole } from "@quickbite/types";
import {
  AuditLogEntity,
  DeliveryEntity,
  DriverProfileEntity,
  OrderEntity,
  RestaurantEntity,
  UserEntity,
} from "../../database/entities";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(RestaurantEntity)
    private readonly restaurants: Repository<RestaurantEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(DriverProfileEntity)
    private readonly drivers: Repository<DriverProfileEntity>,
    @InjectRepository(AuditLogEntity)
    private readonly auditLogs: Repository<AuditLogEntity>,
    @InjectRepository(DeliveryEntity)
    private readonly deliveries: Repository<DeliveryEntity>,
  ) {}

  async dashboard() {
    const allOrders = await this.orders.find();
    const delivered = allOrders.filter((o) => o.status === OrderStatus.DELIVERED);
    const gmv = allOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const netRevenue = allOrders.reduce(
      (sum, o) => sum + o.platformFee + o.deliveryFee * 0.1,
      0,
    );
    const activeOrders = allOrders.filter(
      (o) => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(o.status),
    ).length;
    const activeFleet = await this.drivers.count({ where: { isOnline: true } });

    return {
      gmv,
      totalOrders: allOrders.length,
      deliveredOrders: delivered.length,
      activeOrders,
      netRevenue,
      activeFleetCount: activeFleet,
      avgDeliveryTimeMinutes: 32,
    };
  }

  listRestaurants() {
    return this.restaurants.find({ order: { createdAt: "DESC" } });
  }

  async approveRestaurant(id: string, actorId: string) {
    const restaurant = await this.restaurants.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    await this.restaurants.update(id, { status: RestaurantStatus.ACTIVE });
    await this.log(actorId, "restaurant.approved", "restaurant", id);
    return this.restaurants.findOne({ where: { id } });
  }

  async suspendRestaurant(id: string, actorId: string) {
    const restaurant = await this.restaurants.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException("Restaurant not found");
    await this.restaurants.update(id, { status: RestaurantStatus.SUSPENDED });
    await this.log(actorId, "restaurant.suspended", "restaurant", id);
    return this.restaurants.findOne({ where: { id } });
  }

  listOrders() {
    return this.orders.find({ order: { createdAt: "DESC" }, take: 200 });
  }

  listCustomers() {
    return this.users.find({ where: { role: UserRole.CUSTOMER } });
  }

  listDrivers() {
    return this.drivers.find();
  }

  async activeDeliveries() {
    const active = await this.deliveries
      .createQueryBuilder("d")
      .where("d.stage != :delivered", { delivered: "DELIVERED" })
      .getMany();
    const driverIds = active.map((d) => d.driverId).filter(Boolean) as string[];
    const profiles = driverIds.length
      ? await this.drivers
          .createQueryBuilder("p")
          .where("p.userId IN (:...ids)", { ids: driverIds })
          .getMany()
      : [];
    return active.map((d) => ({
      ...d,
      driverLocation: profiles.find((p) => p.userId === d.driverId) ?? null,
    }));
  }

  auditLog() {
    return this.auditLogs.find({ order: { createdAt: "DESC" }, take: 200 });
  }

  async log(actorId: string, action: string, entityType: string, entityId: string) {
    await this.auditLogs.save(
      this.auditLogs.create({ actorId, action, entityType, entityId }),
    );
  }
}
