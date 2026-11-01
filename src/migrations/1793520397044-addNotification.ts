import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotification1793520397044 implements MigrationInterface {
    name = 'AddNotification1793520397044'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('WORKSPACE_INVITE', 'WORKSPACE_ACTIVITY', 'BOARD_CREATE', 'TASK_ASSIGN', 'TASK_DUE_SOON', 'CHAT_MENTION', 'SYSTEM')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_scope_enum" AS ENUM('WORKSPACE', 'BOARD', 'TASK', 'DIRECT')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "recipient_id" uuid NOT NULL, "sender_id" uuid, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'SYSTEM', "scope" "public"."notifications_scope_enum" NOT NULL DEFAULT 'DIRECT', "workspace_id" uuid, "board_id" uuid, "task_id" uuid, "is_read" boolean NOT NULL DEFAULT false, "metadata" jsonb, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5332a4daa46fd3f4e6625dd275" ON "notifications"  ("recipient_id") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_4140c8b09ff58165daffbefbd7e" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_ff8a9bf1b558104a843964c01ec" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_e7762649a7a7d31e6448940eefb" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_b4a7cd30c9f4ca1b23ef0eb6dd8" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_b4a7cd30c9f4ca1b23ef0eb6dd8"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_e7762649a7a7d31e6448940eefb"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_ff8a9bf1b558104a843964c01ec"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_4140c8b09ff58165daffbefbd7e"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5332a4daa46fd3f4e6625dd275"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_scope_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }

}
