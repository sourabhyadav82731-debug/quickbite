import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMobileOtpLogin1787847700155 implements MigrationInterface {
    name = 'AddMobileOtpLogin1787847700155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Normalize any existing phone value to the canonical "+91XXXXXXXXXX"
        // form (matching normalizeIndianPhone) before the unique index below
        // — every account seeded/created so far stored a bare 10-digit
        // number with no country code. Only touches rows that cleanly reduce
        // to exactly 10 digits; anything else is left untouched rather than
        // guessed at (no silent reassignment of phone numbers).
        await queryRunner.query(`
            UPDATE "users"
            SET "phone" = '+91' || regexp_replace("phone", '[^0-9]', '', 'g')
            WHERE "phone" IS NOT NULL
              AND "phone" NOT LIKE '+%'
              AND length(regexp_replace("phone", '[^0-9]', '', 'g')) = 10
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_phone" ON "users" ("phone")`);

        await queryRunner.query(`CREATE TABLE "otp_requests" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "phone" character varying NOT NULL, "otpHash" character varying NOT NULL, "expiresAt" character varying NOT NULL, "attemptCount" integer NOT NULL DEFAULT 0, "consumedAt" character varying, "requestIp" character varying, CONSTRAINT "PK_otp_requests_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_otp_requests_phone" ON "otp_requests" ("phone")`);
        await queryRunner.query(`CREATE INDEX "IDX_otp_requests_requestIp" ON "otp_requests" ("requestIp")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_otp_requests_requestIp"`);
        await queryRunner.query(`DROP INDEX "IDX_otp_requests_phone"`);
        await queryRunner.query(`DROP TABLE "otp_requests"`);
        await queryRunner.query(`DROP INDEX "IDX_users_phone"`);
        // Deliberately does not reverse the phone-format normalization —
        // going back to inconsistent formats isn't a safe/meaningful revert.
    }

}
