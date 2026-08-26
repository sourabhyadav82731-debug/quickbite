import { Column, Entity, Index } from "typeorm";
import { OrderStatus, PaymentMethod } from "@quickbite/types";
import { BaseEntity } from "./base.entity";

@Entity("orders")
export class OrderEntity extends BaseEntity {
  @Index()
  @Column()
  customerId: string;

  @Index()
  @Column()
  restaurantId: string;

  @Column()
  addressId: string;

  @Column({ nullable: true })
  couponId?: string;

  @Index()
  @Column({ type: "varchar", default: OrderStatus.PLACED })
  status: OrderStatus;

  @Column({ type: "float" })
  itemTotal: number;

  @Column({ type: "float", default: 0 })
  deliveryFee: number;

  @Column({ type: "float", default: 0 })
  packagingFee: number;

  @Column({ type: "float", default: 0 })
  platformFee: number;

  @Column({ type: "float", default: 0 })
  taxAmount: number;

  @Column({ type: "float", default: 0 })
  discountAmount: number;

  @Column({ type: "float", default: 0 })
  tipAmount: number;

  @Column({ type: "float" })
  grandTotal: number;

  @Column({ type: "varchar" })
  paymentMethod: PaymentMethod;

  @Column({ type: "text", nullable: true })
  specialInstructions?: string;

  @Column({ nullable: true })
  cancelledReason?: string;
}
