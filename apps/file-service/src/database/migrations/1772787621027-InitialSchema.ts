import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1772787621027 implements MigrationInterface {
    name = 'InitialSchema1772787621027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "file_metadata" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalName" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "storagePath" character varying NOT NULL, "checksum" character varying NOT NULL, "uploadedBy" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b8805dd11c868561f260a0410ae" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "file_metadata"`);
    }

}
