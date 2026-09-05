import { MigrationInterface, QueryRunner } from "typeorm";

// Removes the mobile-OTP-login experiment's storage (otp_requests) now that
// the login page is back to email+password. Deliberately does NOT touch
// users.phone (still a real, normalized, uniquely-indexed column — reverting
// the phone-format normalization would be pure churn with no upside for
// email/password login, which never reads that column at all) and does NOT
// touch anything under the "deliveries" table — DeliveryEntity's own
// pickupOtp/dropOtp columns are a completely separate, pre-existing business
// flow (driver pickup/drop verification) untouched by this migration.
export class RemoveOtpLoginSystem1788011121024 implements MigrationInterface {
    name = 'RemoveOtpLoginSystem1788011121024'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otp_requests_requestIp"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_otp_requests_phone"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "otp_requests"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "otp_requests" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "phone" character varying NOT NULL, "otpHash" character varying NOT NULL, "expiresAt" character varying NOT NULL, "attemptCount" integer NOT NULL DEFAULT 0, "consumedAt" character varying, "requestIp" character varying, "requestedAt" character varying NOT NULL, CONSTRAINT "PK_otp_requests_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_otp_requests_phone" ON "otp_requests" ("phone")`);
        await queryRunner.query(`CREATE INDEX "IDX_otp_requests_requestIp" ON "otp_requests" ("requestIp")`);
    }

}
