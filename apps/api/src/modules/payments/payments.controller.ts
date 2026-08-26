import { Body, Controller, Get, HttpCode, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RawBodyRequest } from "@nestjs/common";
import { Request } from "express";
import { verifyPaymentSchema } from "@quickbite/validation";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { PaymentsService } from "./payments.service";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get("order/:orderId")
  getForOrder(@Param("orderId") orderId: string, @CurrentUser() user: AuthUser) {
    return this.payments.getForOrder(orderId, user as any);
  }

  @UseGuards(JwtAuthGuard)
  @Post("verify")
  verify(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(verifyPaymentSchema)) body: ReturnType<typeof verifyPaymentSchema.parse>,
  ) {
    return this.payments.verifyPayment(
      body.orderId,
      user.userId,
      body.razorpayOrderId,
      body.razorpayPaymentId,
      body.razorpaySignature,
    );
  }

  // Public: Razorpay calls this directly, not an authenticated user. The signature
  // check inside PaymentsService is the only trust boundary for this route.
  @Post("webhook")
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature: string | undefined,
  ) {
    const rawBody = req.rawBody?.toString("utf8") ?? "";
    await this.payments.handleWebhookEvent(rawBody, signature);
    return { received: true };
  }
}
