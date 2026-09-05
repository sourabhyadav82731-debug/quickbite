import { MigrationInterface, QueryRunner } from "typeorm";

// Adds an app-generated ISO-string timestamp for OtpRequestEntity's own rate-
// limit/cooldown logic, in place of the inherited BaseEntity.createdAt (a
// real Postgres `timestamp without time zone` column) — reading that back
// through node-postgres/TypeORM on a non-UTC host silently applies the wrong
// offset, which broke sub-minute comparisons. See OtpRequestEntity's comment.
export class AddOtpRequestedAt1787848134833 implements MigrationInterface {
    name = 'AddOtpRequestedAt1787848134833'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_requests" ADD "requestedAt" character varying`);
        await queryRunner.query(`UPDATE "otp_requests" SET "requestedAt" = "createdAt"::text WHERE "requestedAt" IS NULL`);
        await queryRunner.query(`ALTER TABLE "otp_requests" ALTER COLUMN "requestedAt" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_requests" DROP COLUMN "requestedAt"`);
    }

}
