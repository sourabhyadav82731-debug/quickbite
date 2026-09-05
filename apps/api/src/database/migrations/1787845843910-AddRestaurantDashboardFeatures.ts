import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRestaurantDashboardFeatures1787845843910 implements MigrationInterface {
    name = 'AddRestaurantDashboardFeatures1787845843910'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "restaurants" ADD "availabilityStatus" character varying NOT NULL DEFAULT 'OPEN'`);
        await queryRunner.query(`ALTER TABLE "restaurants" ADD "pauseReason" character varying`);
        await queryRunner.query(`ALTER TABLE "restaurants" ADD "hours" text`);
        // Backfill: every pre-existing restaurant's real-time availability was
        // previously expressed only by isAcceptingOrders — map it onto the new
        // column so nothing silently flips from "accepting orders" to CLOSED.
        await queryRunner.query(`UPDATE "restaurants" SET "availabilityStatus" = 'CLOSED' WHERE "isAcceptingOrders" = false`);

        await queryRunner.query(`ALTER TABLE "coupons" ADD "startsAt" character varying`);

        await queryRunner.query(`CREATE TABLE "restaurant_holidays" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" character varying NOT NULL, "date" character varying NOT NULL, "label" character varying NOT NULL, CONSTRAINT "PK_restaurant_holidays_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_restaurant_holidays_restaurantId" ON "restaurant_holidays" ("restaurantId")`);

        await queryRunner.query(`CREATE TABLE "staff" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying, "role" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_staff_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_staff_restaurantId" ON "staff" ("restaurantId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_staff_restaurantId"`);
        await queryRunner.query(`DROP TABLE "staff"`);
        await queryRunner.query(`DROP INDEX "IDX_restaurant_holidays_restaurantId"`);
        await queryRunner.query(`DROP TABLE "restaurant_holidays"`);
        await queryRunner.query(`ALTER TABLE "coupons" DROP COLUMN "startsAt"`);
        await queryRunner.query(`ALTER TABLE "restaurants" DROP COLUMN "hours"`);
        await queryRunner.query(`ALTER TABLE "restaurants" DROP COLUMN "pauseReason"`);
        await queryRunner.query(`ALTER TABLE "restaurants" DROP COLUMN "availabilityStatus"`);
    }

}
