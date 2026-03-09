import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1772787615976 implements MigrationInterface {
    name = 'InitialSchema1772787615976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_channel_enum" AS ENUM('email', 'sms', 'push')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_status_enum" AS ENUM('pending', 'sent', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channel" "public"."notification_logs_channel_enum" NOT NULL, "recipient" character varying NOT NULL, "subject" character varying, "body" text NOT NULL, "status" "public"."notification_logs_status_enum" NOT NULL DEFAULT 'pending', "retryCount" integer NOT NULL DEFAULT '0', "error" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_19c524e644cdeaebfcffc284871" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_channel_enum"`);
    }

}
