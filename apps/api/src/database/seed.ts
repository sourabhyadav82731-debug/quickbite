import "reflect-metadata";
import { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import {
  AddressLabel,
  CouponType,
  DeliveryStage,
  DietaryTag,
  NotificationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  RestaurantStatus,
  UserRole,
  VehicleType,
} from "@quickbite/types";
import {
  AddonEntity,
  AddonGroupEntity,
  AddressEntity,
  AuditLogEntity,
  CouponEntity,
  DeliveryEntity,
  DishEntity,
  DriverProfileEntity,
  MenuCategoryEntity,
  NotificationEntity,
  OrderEntity,
  OrderItemEntity,
  PaymentEntity,
  RestaurantEntity,
  ReviewEntity,
  UserEntity,
} from "./entities";

const DEMO_PASSWORD = "Password@123";

export async function runSeedIfEmpty(app: INestApplicationContext) {
  // Demo data must never be able to fire against a real deployment, regardless of
  // whether an empty-DB check would otherwise pass — this is the only guard
  // standing between a fresh production database and it silently filling up with
  // "Asha Verma" / Password@123 accounts.
  if (process.env.NODE_ENV === "production") {
    console.log("Seed skipped: NODE_ENV=production (demo seed data never runs in production).");
    return;
  }
  const dataSource = app.get(DataSource);
  const userCount = await dataSource.getRepository(UserEntity).count();
  if (userCount > 0) {
    console.log("Seed skipped: database already has data.");
    return;
  }
  await seed(dataSource);
}

async function seed(dataSource: DataSource) {
  console.log("Seeding QuickBite demo data...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = dataSource.getRepository(UserEntity);
  const customer = await users.save(
    users.create({
      name: "Asha Verma",
      email: "customer@quickbite.com",
      passwordHash,
      phone: "9876500001",
      role: UserRole.CUSTOMER,
      walletBalance: 150,
    }),
  );
  const owner = await users.save(
    users.create({
      name: "Rahul Mehta",
      email: "owner@quickbite.com",
      passwordHash,
      phone: "9876500002",
      role: UserRole.RESTAURANT_OWNER,
    }),
  );
  const driverUser = await users.save(
    users.create({
      name: "Vikram Singh",
      email: "driver@quickbite.com",
      passwordHash,
      phone: "9876500003",
      role: UserRole.DELIVERY_PARTNER,
    }),
  );
  await users.save(
    users.create({
      name: "Priya Nair",
      email: "admin@quickbite.com",
      passwordHash,
      phone: "9876500004",
      role: UserRole.ADMIN,
    }),
  );

  const addresses = dataSource.getRepository(AddressEntity);
  const homeAddress = await addresses.save(
    addresses.create({
      userId: customer.id,
      label: AddressLabel.HOME,
      line1: "12 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      lat: 12.9716,
      lng: 77.5946,
      isDefault: true,
    }),
  );
  await addresses.save(
    addresses.create({
      userId: customer.id,
      label: AddressLabel.WORK,
      line1: "5th Floor, Tech Park",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103",
      lat: 12.935,
      lng: 77.6146,
      isDefault: false,
    }),
  );

  const restaurants = dataSource.getRepository(RestaurantEntity);
  const spiceRoute = await restaurants.save(
    restaurants.create({
      ownerId: owner.id,
      name: "Spice Route Biryani House",
      description: "Slow-cooked dum biryanis and Hyderabadi classics.",
      cuisines: ["Biryani", "Mughlai"],
      fssaiLicense: "FSSAI-2231009988771",
      status: RestaurantStatus.ACTIVE,
      commissionRate: 0.18,
      rating: 4.5,
      ratingCount: 342,
      avgPrepTimeMinutes: 25,
      costForTwo: 350,
      deliveryRadiusKm: 6,
      lat: 12.9716,
      lng: 77.5946,
      isAcceptingOrders: true,
    }),
  );
  const burgerBox = await restaurants.save(
    restaurants.create({
      ownerId: owner.id,
      name: "Burger Box Co.",
      description: "Stacked burgers, crispy fries, thick shakes.",
      cuisines: ["Burgers", "American"],
      fssaiLicense: "FSSAI-2231009911223",
      status: RestaurantStatus.ACTIVE,
      commissionRate: 0.2,
      rating: 4.3,
      ratingCount: 198,
      avgPrepTimeMinutes: 18,
      costForTwo: 300,
      deliveryRadiusKm: 5,
      lat: 12.965,
      lng: 77.605,
      isAcceptingOrders: true,
    }),
  );
  await restaurants.save(
    restaurants.create({
      ownerId: owner.id,
      name: "Green Bowl Kitchen",
      description: "Healthy bowls and fresh-pressed juices.",
      cuisines: ["Healthy", "Salads"],
      status: RestaurantStatus.PENDING_APPROVAL,
      commissionRate: 0.18,
      rating: 0,
      ratingCount: 0,
      avgPrepTimeMinutes: 20,
      costForTwo: 280,
      deliveryRadiusKm: 5,
      lat: 12.95,
      lng: 77.6,
      isAcceptingOrders: false,
    }),
  );

  const categories = dataSource.getRepository(MenuCategoryEntity);
  const dishes = dataSource.getRepository(DishEntity);
  const addonGroups = dataSource.getRepository(AddonGroupEntity);
  const addons = dataSource.getRepository(AddonEntity);

  // --- Spice Route menu ---
  const biryaniCategory = await categories.save(
    categories.create({ restaurantId: spiceRoute.id, name: "Biryani", sortOrder: 0 }),
  );
  const startersCategory = await categories.save(
    categories.create({ restaurantId: spiceRoute.id, name: "Starters", sortOrder: 1 }),
  );

  const chickenBiryani = await dishes.save(
    dishes.create({
      restaurantId: spiceRoute.id,
      categoryId: biryaniCategory.id,
      name: "Hyderabadi Chicken Biryani",
      description: "Aromatic basmati rice, slow-cooked with spiced chicken.",
      price: 249,
      dietaryTags: [DietaryTag.NON_VEG],
      calories: 650,
      isInStock: true,
    }),
  );
  const veggieBiryani = await dishes.save(
    dishes.create({
      restaurantId: spiceRoute.id,
      categoryId: biryaniCategory.id,
      name: "Veg Dum Biryani",
      description: "Mixed vegetables and paneer in fragrant rice.",
      price: 199,
      dietaryTags: [DietaryTag.VEG],
      calories: 520,
      isInStock: true,
    }),
  );
  await dishes.save(
    dishes.create({
      restaurantId: spiceRoute.id,
      categoryId: startersCategory.id,
      name: "Chicken 65",
      description: "Spicy, deep-fried chicken bites.",
      price: 179,
      dietaryTags: [DietaryTag.NON_VEG],
      calories: 410,
      isInStock: true,
    }),
  );
  await dishes.save(
    dishes.create({
      restaurantId: spiceRoute.id,
      categoryId: startersCategory.id,
      name: "Paneer Tikka",
      description: "Char-grilled cottage cheese skewers.",
      price: 169,
      dietaryTags: [DietaryTag.VEG],
      calories: 380,
      isInStock: true,
    }),
  );

  const biryaniSizeGroup = await addonGroups.save(
    addonGroups.create({
      dishId: chickenBiryani.id,
      name: "Size",
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
    }),
  );
  await addons.save([
    addons.create({ addonGroupId: biryaniSizeGroup.id, name: "Regular", price: 0 }),
    addons.create({ addonGroupId: biryaniSizeGroup.id, name: "Large", price: 80 }),
  ]);

  // --- Burger Box menu ---
  const burgersCategory = await categories.save(
    categories.create({ restaurantId: burgerBox.id, name: "Burgers", sortOrder: 0 }),
  );
  const sidesCategory = await categories.save(
    categories.create({ restaurantId: burgerBox.id, name: "Sides & Beverages", sortOrder: 1 }),
  );

  const classicBurger = await dishes.save(
    dishes.create({
      restaurantId: burgerBox.id,
      categoryId: burgersCategory.id,
      name: "Classic Cheeseburger",
      description: "Grilled patty, cheddar, house sauce.",
      price: 189,
      discountPrice: 159,
      dietaryTags: [DietaryTag.NON_VEG],
      calories: 540,
      isInStock: true,
    }),
  );
  await dishes.save(
    dishes.create({
      restaurantId: burgerBox.id,
      categoryId: burgersCategory.id,
      name: "Crispy Veg Burger",
      description: "Crunchy potato-corn patty, lettuce, mayo.",
      price: 149,
      dietaryTags: [DietaryTag.VEG],
      calories: 460,
      isInStock: true,
    }),
  );
  await dishes.save(
    dishes.create({
      restaurantId: burgerBox.id,
      categoryId: sidesCategory.id,
      name: "Peri Peri Fries",
      description: "Crispy fries tossed in peri peri seasoning.",
      price: 99,
      dietaryTags: [DietaryTag.VEG],
      calories: 320,
      isInStock: true,
    }),
  );

  const addonExtras = await addonGroups.save(
    addonGroups.create({
      dishId: classicBurger.id,
      name: "Add-ons",
      isRequired: false,
      minSelect: 0,
      maxSelect: 3,
    }),
  );
  await addons.save([
    addons.create({ addonGroupId: addonExtras.id, name: "Extra Cheese", price: 30 }),
    addons.create({ addonGroupId: addonExtras.id, name: "Bacon", price: 50 }),
  ]);

  // --- Coupons ---
  const coupons = dataSource.getRepository(CouponEntity);
  const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await coupons.save([
    coupons.create({
      code: "WELCOME50",
      type: CouponType.PERCENTAGE,
      value: 50,
      minOrderValue: 199,
      maxDiscount: 100,
      usageLimit: 1000,
      timesUsed: 0,
      expiresAt: futureExpiry,
      isActive: true,
    }),
    coupons.create({
      code: "FLAT75",
      type: CouponType.FLAT,
      value: 75,
      minOrderValue: 300,
      usageLimit: 500,
      timesUsed: 0,
      expiresAt: futureExpiry,
      isActive: true,
    }),
    coupons.create({
      code: "FREEDEL",
      restaurantId: spiceRoute.id,
      type: CouponType.FREE_DELIVERY,
      value: 0,
      minOrderValue: 0,
      timesUsed: 0,
      expiresAt: futureExpiry,
      isActive: true,
    }),
  ]);

  // --- Driver profile ---
  const drivers = dataSource.getRepository(DriverProfileEntity);
  const driverProfile = await drivers.save(
    drivers.create({
      userId: driverUser.id,
      vehicleType: VehicleType.BIKE,
      vehicleNumber: "KA-01-AB-1234",
      isOnline: true,
      currentLat: 12.968,
      currentLng: 77.6,
      rating: 4.9,
      ratingCount: 512,
      acceptanceRate: 96,
      onTimeRate: 97.5,
      codCashInHand: 0,
    }),
  );

  // --- Orders in 3 distinct lifecycle states ---
  const orders = dataSource.getRepository(OrderEntity);
  const orderItems = dataSource.getRepository(OrderItemEntity);
  const payments = dataSource.getRepository(PaymentEntity);
  const deliveries = dataSource.getRepository(DeliveryEntity);
  const reviews = dataSource.getRepository(ReviewEntity);

  // Order A — DELIVERED, with review
  const orderA = await orders.save(
    orders.create({
      customerId: customer.id,
      restaurantId: spiceRoute.id,
      addressId: homeAddress.id,
      status: OrderStatus.DELIVERED,
      itemTotal: 249,
      deliveryFee: 25,
      packagingFee: 15,
      platformFee: 5,
      taxAmount: 12.45,
      discountAmount: 0,
      tipAmount: 30,
      grandTotal: 336.45,
      paymentMethod: PaymentMethod.UPI,
    }),
  );
  await orderItems.save(
    orderItems.create({
      orderId: orderA.id,
      dishId: chickenBiryani.id,
      nameSnapshot: chickenBiryani.name,
      unitPriceSnapshot: 249,
      quantity: 1,
      addons: [],
    }),
  );
  await payments.save(
    payments.create({
      orderId: orderA.id,
      method: PaymentMethod.UPI,
      status: PaymentStatus.SUCCEEDED,
      amount: 336.45,
      simulatedTxnRef: "SIM-DELIVERED1",
    }),
  );
  await deliveries.save(
    deliveries.create({
      orderId: orderA.id,
      driverId: driverUser.id,
      stage: DeliveryStage.DELIVERED,
      pickupOtp: "1234",
      dropOtp: "5678",
      basePay: 25,
      distancePay: 32,
      surgeBonus: 0,
      tip: 30,
      distanceKm: 4,
    }),
  );
  await reviews.save(
    reviews.create({
      authorId: customer.id,
      restaurantId: spiceRoute.id,
      driverId: driverUser.id,
      orderId: orderA.id,
      foodRating: 5,
      packagingRating: 4,
      deliveryRating: 5,
      comment: "Biryani was fantastic, delivered hot!",
    }),
  );

  // Order B — PREPARING
  const orderB = await orders.save(
    orders.create({
      customerId: customer.id,
      restaurantId: burgerBox.id,
      addressId: homeAddress.id,
      status: OrderStatus.PREPARING,
      itemTotal: 159,
      deliveryFee: 25,
      packagingFee: 15,
      platformFee: 5,
      taxAmount: 7.95,
      discountAmount: 0,
      tipAmount: 20,
      grandTotal: 231.95,
      paymentMethod: PaymentMethod.CARD,
      specialInstructions: "No onions please",
    }),
  );
  await orderItems.save(
    orderItems.create({
      orderId: orderB.id,
      dishId: classicBurger.id,
      nameSnapshot: classicBurger.name,
      unitPriceSnapshot: 159,
      quantity: 1,
      addons: [{ addonId: "extra-cheese", name: "Extra Cheese", price: 30 }],
    }),
  );
  await payments.save(
    payments.create({
      orderId: orderB.id,
      method: PaymentMethod.CARD,
      status: PaymentStatus.SUCCEEDED,
      amount: 231.95,
      simulatedTxnRef: "SIM-PREPARING1",
    }),
  );

  // Order C — READY_FOR_PICKUP with an active delivery assigned to the seeded driver
  const orderC = await orders.save(
    orders.create({
      customerId: customer.id,
      restaurantId: spiceRoute.id,
      addressId: homeAddress.id,
      status: OrderStatus.READY_FOR_PICKUP,
      itemTotal: 199,
      deliveryFee: 25,
      packagingFee: 15,
      platformFee: 5,
      taxAmount: 9.95,
      discountAmount: 0,
      tipAmount: 0,
      grandTotal: 253.95,
      paymentMethod: PaymentMethod.COD,
    }),
  );
  await orderItems.save(
    orderItems.create({
      orderId: orderC.id,
      dishId: veggieBiryani.id,
      nameSnapshot: veggieBiryani.name,
      unitPriceSnapshot: 199,
      quantity: 1,
      addons: [],
    }),
  );
  await payments.save(
    payments.create({
      orderId: orderC.id,
      method: PaymentMethod.COD,
      status: PaymentStatus.PENDING,
      amount: 253.95,
      simulatedTxnRef: "SIM-READY1",
    }),
  );
  await deliveries.save(
    deliveries.create({
      orderId: orderC.id,
      driverId: driverUser.id,
      stage: DeliveryStage.ASSIGNED,
      pickupOtp: "8821",
      dropOtp: "4912",
      basePay: 25,
      distancePay: 24,
      surgeBonus: 0,
      tip: 0,
      distanceKm: 3,
    }),
  );

  // --- Notifications & audit log ---
  const notifications = dataSource.getRepository(NotificationEntity);
  await notifications.save([
    notifications.create({
      userId: customer.id,
      type: NotificationType.ORDER_UPDATE,
      title: "Order out for delivery",
      body: "Your Spice Route order is ready for pickup.",
      isRead: false,
    }),
    notifications.create({
      userId: owner.id,
      type: NotificationType.SYSTEM,
      title: "New order received",
      body: "Burger Box Co. has a new order to prepare.",
      isRead: false,
    }),
    notifications.create({
      userId: driverUser.id,
      type: NotificationType.SYSTEM,
      title: "New delivery offer",
      body: "A new pickup is available near you.",
      isRead: true,
    }),
  ]);

  const auditLogs = dataSource.getRepository(AuditLogEntity);
  await auditLogs.save([
    auditLogs.create({
      actorId: owner.id,
      action: "restaurant.created",
      entityType: "restaurant",
      entityId: spiceRoute.id,
    }),
    auditLogs.create({
      actorId: owner.id,
      action: "coupon.created",
      entityType: "coupon",
      entityId: "WELCOME50",
    }),
  ]);

  console.log("Seed complete. Demo credentials (all use password Password@123):");
  console.log("  customer@quickbite.com | owner@quickbite.com | driver@quickbite.com | admin@quickbite.com");
  void driverProfile;
}

// Allow `pnpm seed` to run this file standalone via ts-node.
if (require.main === module) {
  (async () => {
    if (process.env.NODE_ENV === "production") {
      console.log("Seed skipped: NODE_ENV=production (demo seed data never runs in production).");
      return;
    }
    const { AppModule } = await import("../app.module");
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    await seed(dataSource);
    await app.close();
  })();
}
