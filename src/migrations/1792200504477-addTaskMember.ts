import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskMember1792200504477 implements MigrationInterface {
  name = 'AddTaskMember1792200504477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_855d484825b715c545349212c7f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_855d484825b715c545349212c7"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_members_role_enum" AS ENUM('TASK_LEADER', 'TASK_MEMBER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_members" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."task_members_role_enum" NOT NULL DEFAULT 'TASK_MEMBER', CONSTRAINT "UQ_d8acdfb88479100e2654c3baf6f" UNIQUE ("task_id", "user_id"), CONSTRAINT "PK_abb09cdcfbe8bf7bc6686184293" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e3a526efa083bf2d93f28597a8" ON "task_members"  ("task_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9479a7828448cd818eda779197" ON "task_members"  ("user_id") `,
    );
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "assignee_id"`);
    await queryRunner.query(
      `ALTER TABLE "task_members" ADD CONSTRAINT "FK_e3a526efa083bf2d93f28597a85" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_members" ADD CONSTRAINT "FK_9479a7828448cd818eda7791972" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_members" DROP CONSTRAINT "FK_9479a7828448cd818eda7791972"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_members" DROP CONSTRAINT "FK_e3a526efa083bf2d93f28597a85"`,
    );
    await queryRunner.query(`ALTER TABLE "tasks" ADD "assignee_id" uuid`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9479a7828448cd818eda779197"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3a526efa083bf2d93f28597a8"`,
    );
    await queryRunner.query(`DROP TABLE "task_members"`);
    await queryRunner.query(`DROP TYPE "public"."task_members_role_enum"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_855d484825b715c545349212c7" ON "tasks" USING btree ("assignee_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_855d484825b715c545349212c7f" FOREIGN KEY ("assignee_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
