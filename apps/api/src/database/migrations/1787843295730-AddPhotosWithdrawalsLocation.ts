import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhotosWithdrawalsLocation1787843295730 implements MigrationInterface {
    name = 'AddPhotosWithdrawalsLocation1787843295730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "restaurant_photos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" character varying NOT NULL, "url" character varying NOT NULL, "isCover" boolean NOT NULL DEFAULT false, "sortOrder" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_restaurant_photos_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_restaurant_photos_restaurantId" ON "restaurant_photos" ("restaurantId")`);

        await queryRunner.query(`CREATE TABLE "withdrawal_requests" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerType" character varying NOT NULL, "ownerId" character varying NOT NULL, "amount" double precision NOT NULL, "payoutMethod" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "referenceId" character varying, "failureReason" text, "processedAt" character varying, CONSTRAINT "PK_withdrawal_requests_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_withdrawal_requests_ownerType" ON "withdrawal_requests" ("ownerType")`);
        await queryRunner.query(`CREATE INDEX "IDX_withdrawal_requests_ownerId" ON "withdrawal_requests" ("ownerId")`);

        await queryRunner.query(`ALTER TABLE "driver_profiles" ADD "locationUpdatedAt" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver_profiles" DROP COLUMN "locationUpdatedAt"`);
        await queryRunner.query(`DROP INDEX "IDX_withdrawal_requests_ownerId"`);
        await queryRunner.query(`DROP INDEX "IDX_withdrawal_requests_ownerType"`);
        await queryRunner.query(`DROP TABLE "withdrawal_requests"`);
        await queryRunner.query(`DROP INDEX "IDX_restaurant_photos_restaurantId"`);
        await queryRunner.query(`DROP TABLE "restaurant_photos"`);
    }

}
