import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCouponPerUserLimit1788015300000 implements MigrationInterface {
    name = 'AddCouponPerUserLimit1788015300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coupons" ADD "perUserLimit" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coupons" DROP COLUMN "perUserLimit"`);
    }

}
