import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefundRequestedBy1788015400000 implements MigrationInterface {
    name = 'AddRefundRequestedBy1788015400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refunds" ADD "requestedByUserId" character varying`);
        await queryRunner.query(`ALTER TABLE "refunds" ADD "requestedByRole" character varying`);
        // Backfill existing rows (none expected pre-launch, but stay honest about
        // provenance rather than leaving a NOT NULL column with nulls) attributing
        // them to the customer who owns the order — the only fact already on hand.
        await queryRunner.query(`UPDATE "refunds" SET "requestedByUserId" = "customerId", "requestedByRole" = 'customer' WHERE "requestedByUserId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "refunds" ALTER COLUMN "requestedByUserId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "refunds" ALTER COLUMN "requestedByRole" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refunds" DROP COLUMN "requestedByRole"`);
        await queryRunner.query(`ALTER TABLE "refunds" DROP COLUMN "requestedByUserId"`);
    }

}
