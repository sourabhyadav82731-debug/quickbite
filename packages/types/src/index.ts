// ---------- Enums ----------

export enum UserRole {
  CUSTOMER = "customer",
  RESTAURANT_OWNER = "restaurant_owner",
  DELIVERY_PARTNER = "delivery_partner",
  ADMIN = "admin",
}

export enum OrderStatus {
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PLACED = "PLACED",
  ACCEPTED = "ACCEPTED",
  PREPARING = "PREPARING",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  ASSIGNED = "ASSIGNED",
  PICKED_UP = "PICKED_UP",
  ON_THE_WAY = "ON_THE_WAY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

// The 6-stage delivery workflow from the spec
export enum DeliveryStage {
  ASSIGNED = "ASSIGNED",
  ARRIVED_AT_RESTAURANT = "ARRIVED_AT_RESTAURANT",
  PICKED_UP = "PICKED_UP",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  ARRIVED_AT_CUSTOMER = "ARRIVED_AT_CUSTOMER",
  DELIVERED = "DELIVERED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  CARD = "CARD",
  UPI = "UPI",
  NET_BANKING = "NET_BANKING",
  COD = "COD",
  WALLET = "WALLET",
}

export enum CouponType {
  PERCENTAGE = "PERCENTAGE",
  FLAT = "FLAT",
  FREE_DELIVERY = "FREE_DELIVERY",
}

export enum RestaurantStatus {
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  CLOSED = "CLOSED",
}

export enum VehicleType {
  BICYCLE = "BICYCLE",
  BIKE = "BIKE",
  SCOOTER = "SCOOTER",
  CAR = "CAR",
}

export enum DietaryTag {
  VEG = "VEG",
  NON_VEG = "NON_VEG",
  VEGAN = "VEGAN",
  GLUTEN_FREE = "GLUTEN_FREE",
}

export enum AddressLabel {
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}

export enum NotificationType {
  ORDER_UPDATE = "ORDER_UPDATE",
  PROMO = "PROMO",
  SYSTEM = "SYSTEM",
  PAYOUT = "PAYOUT",
}

// ---------- Core domain interfaces ----------

export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseRecord {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  walletBalance: number;
}

export interface Address extends BaseRecord {
  userId: string;
  label: AddressLabel;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface Restaurant extends BaseRecord {
  ownerId: string;
  name: string;
  description?: string;
  cuisines: string[];
  coverImageUrl?: string;
  fssaiLicense?: string;
  status: RestaurantStatus;
  commissionRate: number;
  rating: number;
  ratingCount: number;
  avgPrepTimeMinutes: number;
  costForTwo: number;
  deliveryRadiusKm: number;
  lat: number;
  lng: number;
  isAcceptingOrders: boolean;
}

export interface MenuCategory extends BaseRecord {
  restaurantId: string;
  name: string;
  sortOrder: number;
}

export interface Dish extends BaseRecord {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  imageUrl?: string;
  dietaryTags: DietaryTag[];
  calories?: number;
  isInStock: boolean;
  addonGroupIds: string[];
}

export interface AddonGroup extends BaseRecord {
  dishId: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
}

export interface Addon extends BaseRecord {
  addonGroupId: string;
  name: string;
  price: number;
}

export interface CartAddonSelection {
  addonId: string;
  name: string;
  price: number;
}

export interface CartItem {
  dishId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  addons: CartAddonSelection[];
  specialInstructions?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  dishId: string;
  nameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  addons: CartAddonSelection[];
}

export interface Order extends BaseRecord {
  customerId: string;
  restaurantId: string;
  addressId: string;
  couponId?: string;
  status: OrderStatus;
  items: OrderItem[];
  itemTotal: number;
  deliveryFee: number;
  packagingFee: number;
  platformFee: number;
  taxAmount: number;
  discountAmount: number;
  tipAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  cancelledReason?: string;
}

export interface Payment extends BaseRecord {
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  simulatedTxnRef?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amountPaise?: number;
  failureReason?: string;
  verifiedAt?: string;
}

export interface Coupon extends BaseRecord {
  code: string;
  restaurantId?: string; // null/undefined = platform-wide
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  timesUsed: number;
  expiresAt: string;
  isActive: boolean;
}

export interface DriverProfile extends BaseRecord {
  userId: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  rating: number;
  ratingCount: number;
  acceptanceRate: number;
  onTimeRate: number;
  codCashInHand: number;
}

export interface Delivery extends BaseRecord {
  orderId: string;
  driverId: string;
  stage: DeliveryStage;
  pickupOtp: string;
  dropOtp: string;
  basePay: number;
  distancePay: number;
  surgeBonus: number;
  tip: number;
  distanceKm: number;
  offerExpiresAt?: string;
}

export interface Review extends BaseRecord {
  authorId: string;
  restaurantId?: string;
  driverId?: string;
  orderId: string;
  foodRating: number;
  packagingRating?: number;
  deliveryRating?: number;
  comment?: string;
  ownerReply?: string;
}

export interface Notification extends BaseRecord {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
}

export interface AuditLog extends BaseRecord {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

// ---------- API envelopes ----------

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ---------- WebSocket event names ----------

export type OrderWsEvent =
  | "order.created"
  | "order.statusChanged"
  | "kitchen.ticketUpdate"
  | "order.subscribe"
  | "restaurant.subscribeKitchen"
  | "admin.subscribeLedger";

export type DeliveryWsEvent =
  | "delivery.offer"
  | "delivery.offer.respond"
  | "delivery.assigned"
  | "delivery.location.update"
  | "delivery.locationChanged"
  | "delivery.stage.advance"
  | "delivery.stageChanged";
