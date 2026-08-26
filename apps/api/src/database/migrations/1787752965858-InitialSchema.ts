import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787752965858 implements MigrationInterface {
    name = 'InitialSchema1787752965858'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "phone" character varying, "role" character varying NOT NULL, "avatarUrl" character varying, "walletBalance" double precision NOT NULL DEFAULT '0', "refreshTokenHash" character varying, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying NOT NULL, "label" character varying NOT NULL, "line1" character varying NOT NULL, "line2" character varying, "city" character varying NOT NULL, "state" character varying NOT NULL, "pincode" character varying NOT NULL, "lat" double precision NOT NULL, "lng" double precision NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_95c93a584de49f0b0e13f75363" ON "addresses" ("userId") `);
        await queryRunner.query(`CREATE TABLE "restaurants" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "cuisines" text NOT NULL DEFAULT '', "coverImageUrl" character varying, "fssaiLicense" character varying, "status" character varying NOT NULL DEFAULT 'PENDING_APPROVAL', "commissionRate" double precision NOT NULL DEFAULT '0.18', "rating" double precision NOT NULL DEFAULT '4.2', "ratingCount" integer NOT NULL DEFAULT '0', "avgPrepTimeMinutes" integer NOT NULL DEFAULT '30', "costForTwo" double precision NOT NULL DEFAULT '300', "deliveryRadiusKm" double precision NOT NULL DEFAULT '5', "lat" double precision NOT NULL DEFAULT '0', "lng" double precision NOT NULL DEFAULT '0', "isAcceptingOrders" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e2133a72eb1cc8f588f7b503e68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9519e81d388514ec631d23fefc" ON "restaurants" ("ownerId") `);
        await queryRunner.query(`CREATE TABLE "menu_categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" character varying NOT NULL, "name" character varying NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_124ae987900336f983881cb04e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_99fac3bd8f4554721f954244df" ON "menu_categories" ("restaurantId") `);
        await queryRunner.query(`CREATE TABLE "dishes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" character varying NOT NULL, "categoryId" character varying NOT NULL, "name" character varying NOT NULL, "description" text, "price" double precision NOT NULL, "discountPrice" double precision, "imageUrl" character varying, "dietaryTags" text NOT NULL DEFAULT '', "calories" integer, "isInStock" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f4748c8e8382ad34ef517520b7b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_66ea254054cb3acb8bc5cc568d" ON "dishes" ("restaurantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9491dfcdc274899d7c73722987" ON "dishes" ("categoryId") `);
        await queryRunner.query(`CREATE TABLE "addon_groups" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "dishId" character varying NOT NULL, "name" character varying NOT NULL, "isRequired" boolean NOT NULL DEFAULT false, "minSelect" integer NOT NULL DEFAULT '0', "maxSelect" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_6545110ad1294643bcf3047736d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f393c7c2ee5f9d5d47e1addfed" ON "addon_groups" ("dishId") `);
        await queryRunner.query(`CREATE TABLE "addons" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "addonGroupId" character varying NOT NULL, "name" character varying NOT NULL, "price" double precision NOT NULL DEFAULT '0', CONSTRAINT "PK_cd49fb3dc0558f02cb6fe6cc138" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ca9e1b747aa2fa88f89f2d787b" ON "addons" ("addonGroupId") `);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "customerId" character varying NOT NULL, "restaurantId" character varying NOT NULL, "addressId" character varying NOT NULL, "couponId" character varying, "status" character varying NOT NULL DEFAULT 'PLACED', "itemTotal" double precision NOT NULL, "deliveryFee" double precision NOT NULL DEFAULT '0', "packagingFee" double precision NOT NULL DEFAULT '0', "platformFee" double precision NOT NULL DEFAULT '0', "taxAmount" double precision NOT NULL DEFAULT '0', "discountAmount" double precision NOT NULL DEFAULT '0', "tipAmount" double precision NOT NULL DEFAULT '0', "grandTotal" double precision NOT NULL, "paymentMethod" character varying NOT NULL, "specialInstructions" text, "cancelledReason" character varying, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e5de51ca888d8b1f5ac25799dd" ON "orders" ("customerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2312cd07a04f50ba29d76c9564" ON "orders" ("restaurantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status") `);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "orderId" character varying NOT NULL, "dishId" character varying NOT NULL, "nameSnapshot" character varying NOT NULL, "unitPriceSnapshot" double precision NOT NULL, "quantity" integer NOT NULL, "addons" text NOT NULL DEFAULT '[]', CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f1d359a55923bb45b057fbdab0" ON "order_items" ("orderId") `);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "orderId" character varying NOT NULL, "method" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "amount" double precision NOT NULL, "simulatedTxnRef" character varying, "razorpayOrderId" character varying, "razorpayPaymentId" character varying, "amountPaise" integer, "failureReason" text, "verifiedAt" TIMESTAMP, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_af929a5f2a400fdb6913b4967e" ON "payments" ("orderId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d65ce2454954e71c67ea424c4" ON "payments" ("razorpayOrderId") `);
        await queryRunner.query(`CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "code" character varying NOT NULL, "restaurantId" character varying, "type" character varying NOT NULL, "value" double precision NOT NULL, "minOrderValue" double precision NOT NULL DEFAULT '0', "maxDiscount" double precision, "usageLimit" integer, "timesUsed" integer NOT NULL DEFAULT '0', "expiresAt" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e025109230e82925843f2a14c4" ON "coupons" ("code") `);
        await queryRunner.query(`CREATE TABLE "driver_profiles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying NOT NULL, "vehicleType" character varying NOT NULL, "vehicleNumber" character varying NOT NULL, "isOnline" boolean NOT NULL DEFAULT false, "currentLat" double precision, "currentLng" double precision, "rating" double precision NOT NULL DEFAULT '4.5', "ratingCount" integer NOT NULL DEFAULT '0', "acceptanceRate" double precision NOT NULL DEFAULT '96', "onTimeRate" double precision NOT NULL DEFAULT '97.5', "codCashInHand" double precision NOT NULL DEFAULT '0', CONSTRAINT "PK_6e002fc8a835351e070978fcad4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c22d0ffc4bff60e9a39c003759" ON "driver_profiles" ("userId") `);
        await queryRunner.query(`CREATE TABLE "deliveries" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "orderId" character varying NOT NULL, "driverId" character varying, "stage" character varying NOT NULL DEFAULT 'ASSIGNED', "pickupOtp" character varying NOT NULL, "dropOtp" character varying NOT NULL, "basePay" double precision NOT NULL DEFAULT '0', "distancePay" double precision NOT NULL DEFAULT '0', "surgeBonus" double precision NOT NULL DEFAULT '0', "tip" double precision NOT NULL DEFAULT '0', "distanceKm" double precision NOT NULL DEFAULT '0', "offerExpiresAt" character varying, CONSTRAINT "PK_a6ef225c5c5f0974e503bfb731f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f7433e3639e213f901e22cf864" ON "deliveries" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a6cc84e1c957ed2d25bd7eda4b" ON "deliveries" ("driverId") `);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authorId" character varying NOT NULL, "restaurantId" character varying, "driverId" character varying, "orderId" character varying NOT NULL, "foodRating" double precision NOT NULL, "packagingRating" double precision, "deliveryRating" double precision, "comment" text, "ownerReply" text, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_92ad8cd051c76d10e284bbc328" ON "reviews" ("restaurantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_44dad78449ef449cd59f6a4740" ON "reviews" ("driverId") `);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" character varying NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "body" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "actorId" character varying NOT NULL, "action" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" character varying NOT NULL, "metadata" text, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_01993ae76b293d3b866cc3a125" ON "audit_logs" ("entityType") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_01993ae76b293d3b866cc3a125"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_692a909ee0fa9383e7859f9b40"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44dad78449ef449cd59f6a4740"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92ad8cd051c76d10e284bbc328"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6cc84e1c957ed2d25bd7eda4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7433e3639e213f901e22cf864"`);
        await queryRunner.query(`DROP TABLE "deliveries"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c22d0ffc4bff60e9a39c003759"`);
        await queryRunner.query(`DROP TABLE "driver_profiles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e025109230e82925843f2a14c4"`);
        await queryRunner.query(`DROP TABLE "coupons"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d65ce2454954e71c67ea424c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af929a5f2a400fdb6913b4967e"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1d359a55923bb45b057fbdab0"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2312cd07a04f50ba29d76c9564"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5de51ca888d8b1f5ac25799dd"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca9e1b747aa2fa88f89f2d787b"`);
        await queryRunner.query(`DROP TABLE "addons"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f393c7c2ee5f9d5d47e1addfed"`);
        await queryRunner.query(`DROP TABLE "addon_groups"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9491dfcdc274899d7c73722987"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66ea254054cb3acb8bc5cc568d"`);
        await queryRunner.query(`DROP TABLE "dishes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99fac3bd8f4554721f954244df"`);
        await queryRunner.query(`DROP TABLE "menu_categories"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9519e81d388514ec631d23fefc"`);
        await queryRunner.query(`DROP TABLE "restaurants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_95c93a584de49f0b0e13f75363"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
