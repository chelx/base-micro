import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1772787610730 implements MigrationInterface {
    name = 'InitialSchema1772787610730'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying(50) NOT NULL, "entityName" character varying(100) NOT NULL, "userId" character varying(100), "status" character varying(20) NOT NULL, "durationMs" integer NOT NULL DEFAULT '0', "request" jsonb, "response" jsonb, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8fbe1657e4d2b65cf4836f04c7" ON "audit_logs" ("entityName", "userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8fbe1657e4d2b65cf4836f04c7"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }

}
