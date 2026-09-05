import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import Razorpay from "razorpay";
// Stable, typed helper shipped by the official SDK itself (verified importable —
// the installed package has no "exports" map restricting this subpath).
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { OrderStatus, PaymentStatus, UserRole } from "@quickbite/types";
import { CouponEntity, OrderEntity, PaymentEntity } from "../../database/entities";
import { RealtimeEmitterService } from "../websocket/realtime-emitter.service";
import { OrderHistoryService } from "../order-history/order-history.service";
import { RAZORPAY_CLIENT } from "./razorpay.provider";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentEntity) private readonly payments: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(CouponEntity) private readonly coupons: Repository<CouponEntity>,
    @Inject(RAZORPAY_CLIENT) private readonly razorpay: Razorpay | undefined,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeEmitterService,
    private readonly orderHistory: OrderHistoryService,
  ) {}

  /** Server-only. Never called with a client-supplied amount — callers pass the
   *  paise integer already computed from the DB-verified grandTotal. */
  async createRazorpayOrder(
    amountPaise: number,
    receipt: string,
  ): Promise<{ razorpayOrderId: string; keyId: string | null; amountPaise: number; currency: string }> {
    if (!this.razorpay) {
      throw new ServiceUnavailableException(
        "Online payments are temporarily unavailable. Please choose Cash on Delivery.",
      );
    }
    try {
      const order = await this.razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: receipt.slice(0, 40),
        // Explicit, not relying on the merchant dashboard's account-level default —
        // without this, a successful payment can sit in "authorized" and never fire
        // the payment.captured event this whole flow depends on.
        payment: { capture: "automatic" },
        partial_payment: false,
      });
      return {
        razorpayOrderId: order.id,
        keyId: this.config.get<string>("RAZORPAY_KEY_ID") ?? null,
        amountPaise,
        currency: "INR",
      };
    } catch (err) {
      this.logger.error(
        `Failed to create Razorpay order: ${err instanceof Error ? err.message : "unknown error"}`,
      );
      throw new ServiceUnavailableException(
        "Unable to initiate online payment right now. Please try again or choose Cash on Delivery.",
      );
    }
  }

  /** Server-only, called from RefundsService once an admin has approved a refund.
   *  For an online payment (razorpayPaymentId set) this reverses real money via
   *  Razorpay's refund API — never simulated. For COD there is no gateway
   *  transaction to reverse, so this only updates local records and returns no
   *  razorpayRefundId; the caller is responsible for recording how the cash was
   *  actually returned to the customer. */
  async refundPayment(
    orderId: string,
    amountPaise: number,
  ): Promise<{ razorpayRefundId?: string }> {
    const payment = await this.payments.findOne({ where: { orderId } });
    if (!payment) throw new NotFoundException("Payment not found for this order");
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException(
        `Cannot refund a payment in ${payment.status} status`,
      );
    }

    let razorpayRefundId: string | undefined;
    if (payment.razorpayPaymentId) {
      if (!this.razorpay) {
        throw new ServiceUnavailableException(
          "Online refunds are temporarily unavailable — Razorpay is not configured.",
        );
      }
      try {
        const refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: amountPaise,
        });
        razorpayRefundId = refund.id;
      } catch (err) {
        this.logger.error(
          `Razorpay refund failed for order ${orderId}: ${err instanceof Error ? err.message : "unknown error"}`,
        );
        throw new ServiceUnavailableException("Refund failed at the payment gateway. Please try again.");
      }
    }
    // COD (no razorpayPaymentId): nothing to call at a gateway — the cash was
    // never routed through Razorpay in the first place.

    await this.payments.update({ id: payment.id }, { status: PaymentStatus.REFUNDED });
    return { razorpayRefundId };
  }

  async getForOrder(orderId: string, actor: { userId: string; role: UserRole }) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    if (order.customerId !== actor.userId && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not your order");
    }
    const payment = await this.payments.findOne({ where: { orderId } });
    if (!payment) throw new NotFoundException("Payment not found");

    return {
      ...payment,
      keyId: this.config.get<string>("RAZORPAY_KEY_ID") ?? null,
      currency: "INR",
    };
  }

  async verifyPayment(
    orderId: string,
    actorUserId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    // The core "prevent paying for another user's order" control.
    if (order.customerId !== actorUserId) throw new ForbiddenException("Not your order");

    const payment = await this.payments.findOne({ where: { orderId } });
    if (!payment) throw new NotFoundException("Payment record not found");

    if (payment.status === PaymentStatus.SUCCEEDED) {
      return { verified: true, alreadyProcessed: true };
    }

    // Rejects a genuinely-valid signature for a *different* Razorpay order being
    // replayed against this one.
    if (payment.razorpayOrderId !== razorpayOrderId) {
      this.logger.warn(`Payment verify rejected: razorpayOrderId mismatch for order ${orderId}`);
      throw new BadRequestException("Payment verification failed");
    }

    const keySecret = this.config.get<string>("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      throw new ServiceUnavailableException("Online payments are temporarily unavailable");
    }

    const isValid = validatePaymentVerification(
      { order_id: razorpayOrderId, payment_id: razorpayPaymentId },
      razorpaySignature,
      keySecret,
    );

    if (!isValid) {
      this.logger.warn(`Payment signature verification failed for order ${orderId}`);
      throw new BadRequestException("Payment verification failed");
    }

    await this.markPaymentSucceeded(orderId, razorpayPaymentId);
    return { verified: true };
  }

  async handleWebhookEvent(rawBody: string, signature: string | undefined): Promise<void> {
    const webhookSecret = this.config.get<string>("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) {
      this.logger.warn("Webhook received but RAZORPAY_WEBHOOK_SECRET is not configured");
      throw new BadRequestException("Webhook not configured");
    }
    if (!signature || !Razorpay.validateWebhookSignature(rawBody, signature, webhookSecret)) {
      this.logger.warn("Rejected webhook: invalid signature");
      throw new BadRequestException("Invalid signature");
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException("Invalid payload");
    }

    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    if (!paymentEntity?.order_id) return;

    const payment = await this.payments.findOne({
      where: { razorpayOrderId: paymentEntity.order_id },
    });
    if (!payment) {
      this.logger.warn(`Webhook for unrecognized razorpayOrderId (event=${event})`);
      return;
    }

    if (event === "payment.captured") {
      if (payment.amountPaise != null && paymentEntity.amount !== payment.amountPaise) {
        this.logger.warn(
          `Amount mismatch on order ${payment.orderId}: stored=${payment.amountPaise}, webhook=${paymentEntity.amount}`,
        );
      }
      await this.markPaymentSucceeded(payment.orderId, paymentEntity.id);
    } else if (event === "payment.failed") {
      await this.markPaymentFailed(
        payment.orderId,
        paymentEntity.id,
        typeof paymentEntity.error_description === "string"
          ? paymentEntity.error_description
          : "Payment failed",
      );
    }
  }

  /** Idempotent core: safe to call more than once (verify + webhook racing, or
   *  duplicate webhook redelivery) — only the first caller does anything. */
  private async markPaymentSucceeded(orderId: string, razorpayPaymentId: string): Promise<void> {
    const payment = await this.payments.findOne({ where: { orderId } });
    if (!payment) {
      this.logger.warn(`markPaymentSucceeded: no payment row for order ${orderId}`);
      return;
    }

    const paymentUpdate = await this.payments.update(
      { id: payment.id, status: In([PaymentStatus.PENDING, PaymentStatus.FAILED]) },
      { status: PaymentStatus.SUCCEEDED, razorpayPaymentId, verifiedAt: new Date() },
    );

    if (!paymentUpdate.affected) {
      const existing = await this.payments.findOne({ where: { id: payment.id } });
      if (
        existing?.status === PaymentStatus.SUCCEEDED &&
        existing.razorpayPaymentId !== razorpayPaymentId
      ) {
        this.logger.warn(
          `Possible double-charge on order ${orderId}: existing paymentId set, new paymentId received`,
        );
      }
      return; // idempotent no-op
    }

    const orderUpdate = await this.orders.update(
      { id: orderId, status: OrderStatus.PAYMENT_PENDING },
      { status: OrderStatus.PLACED },
    );

    if (!orderUpdate.affected) {
      this.logger.error(
        `Payment captured for order ${orderId} but the order was no longer PAYMENT_PENDING ` +
          `(likely cancelled or expired) — manual reconciliation required, consider a refund.`,
      );
      return;
    }

    const fullOrder = await this.orders.findOne({ where: { id: orderId } });
    if (!fullOrder) return;

    if (fullOrder.couponId) {
      await this.coupons.increment({ id: fullOrder.couponId }, "timesUsed", 1);
    }

    await this.orderHistory.record(
      orderId,
      OrderStatus.PLACED,
      "SYSTEM",
      undefined,
      "Payment captured via Razorpay",
    );

    this.realtime.orderCreated(fullOrder);
  }

  private async markPaymentFailed(
    orderId: string,
    razorpayPaymentId: string | undefined,
    reason: string,
  ): Promise<void> {
    const payment = await this.payments.findOne({ where: { orderId } });
    if (!payment) return;
    // Only PENDING -> FAILED. Never downgrade an already-SUCCEEDED payment from a
    // late/out-of-order failure webhook.
    await this.payments.update(
      { id: payment.id, status: In([PaymentStatus.PENDING]) },
      { status: PaymentStatus.FAILED, razorpayPaymentId, failureReason: reason },
    );
  }
}
