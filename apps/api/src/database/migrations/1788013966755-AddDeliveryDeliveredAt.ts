import { MigrationInterface, QueryRunner } from "typeorm";

// Adds an app-generated ISO-string "delivered at" timestamp, used by
// DeliveryService.earnings()'s today/week/month boundary comparisons in
// place of the inherited BaseEntity.updatedAt (a real Postgres `timestamp
// without time zone` column, which node-postgres/TypeORM misreads on a
// non-UTC host — see DeliveryEntity's own comment). Existing DELIVERED rows
// are backfilled from their updatedAt as a best-effort approximation, since
// that's the closest available signal for when they actually completed.
export class AddDeliveryDeliveredAt1788013966755 implements MigrationInterface {
    name = 'AddDeliveryDeliveredAt1788013966755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deliveries" ADD "deliveredAt" character varying`);
        await queryRunner.query(`UPDATE "deliveries" SET "deliveredAt" = "updatedAt"::text WHERE "stage" = 'DELIVERED' AND "deliveredAt" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN "deliveredAt"`);
    }

}
