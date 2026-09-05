import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity, OrderEntity, RefundEntity } from "../../database/entities";
import { PaymentsModule } from "../payments/payments.module";
import { RefundsService } from "./refunds.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([RefundEntity, OrderEntity, AuditLogEntity]),
    PaymentsModule,
  ],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
