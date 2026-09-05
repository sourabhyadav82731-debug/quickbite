import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminControlCenter1788015186752 implements MigrationInterface {
    name = 'AddAdminControlCenter1788015186752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD "isHidden" boolean NOT NULL DEFAULT false`);

        await queryRunner.query(`CREATE TABLE "order_status_history" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "orderId" character varying NOT NULL, "status" character varying NOT NULL, "actorType" character varying NOT NULL, "actorId" character varying, "note" character varying, "occurredAt" character varying NOT NULL, CONSTRAINT "PK_order_status_history_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_order_status_history_orderId" ON "order_status_history" ("orderId")`);

        await queryRunner.query(`CREATE TABLE "refunds" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "orderId" character varying NOT NULL, "customerId" character varying NOT NULL, "restaurantId" character varying NOT NULL, "orderAmount" double precision NOT NULL, "refundAmount" double precision NOT NULL, "reason" text NOT NULL, "status" character varying NOT NULL DEFAULT 'REQUESTED', "razorpayRefundId" character varying, "adminNote" character varying, "requestedAt" character varying NOT NULL, "processedAt" character varying, "processedByAdminId" character varying, CONSTRAINT "PK_refunds_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_refunds_orderId" ON "refunds" ("orderId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_refunds_orderId"`);
        await queryRunner.query(`DROP TABLE "refunds"`);
        await queryRunner.query(`DROP INDEX "IDX_order_status_history_orderId"`);
        await queryRunner.query(`DROP TABLE "order_status_history"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "isHidden"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
    }

}
