import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomerPricing1787774226159 implements MigrationInterface {
    name = 'AddCustomerPricing1787774226159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dishes" ADD "customerPrice" double precision`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "restaurantPriceSnapshot" double precision`);
        // Backfill: before this feature existed there was no markup, so the restaurant's
        // price and the customer's price were always identical for every past order.
        await queryRunner.query(`UPDATE "order_items" SET "restaurantPriceSnapshot" = "unitPriceSnapshot" WHERE "restaurantPriceSnapshot" IS NULL`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "restaurantPriceSnapshot" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "restaurantPriceSnapshot"`);
        await queryRunner.query(`ALTER TABLE "dishes" DROP COLUMN "customerPrice"`);
    }

}
