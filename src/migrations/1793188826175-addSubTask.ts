import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubTask1793188826175 implements MigrationInterface {
    name = 'AddSubTask1793188826175'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sub_tasks" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "task_id" uuid NOT NULL, "title" text NOT NULL, "completed" boolean NOT NULL DEFAULT false, "position" double precision NOT NULL DEFAULT '1000', "assignee_id" uuid, "start_date" TIMESTAMP WITH TIME ZONE, "due_date" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0028874355f68f2ed21a89c2faf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3f481594a443edc6ee48694e76" ON "sub_tasks"  ("assignee_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_792ee7ce1185d58b0f8b424d20" ON "sub_tasks"  ("task_id", "position") `);
        await queryRunner.query(`ALTER TABLE "sub_tasks" ADD CONSTRAINT "FK_be4002db4cc6e2d20577f48ddf3" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_tasks" ADD CONSTRAINT "FK_3f481594a443edc6ee48694e76c" FOREIGN KEY ("assignee_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sub_tasks" DROP CONSTRAINT "FK_3f481594a443edc6ee48694e76c"`);
        await queryRunner.query(`ALTER TABLE "sub_tasks" DROP CONSTRAINT "FK_be4002db4cc6e2d20577f48ddf3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_792ee7ce1185d58b0f8b424d20"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f481594a443edc6ee48694e76"`);
        await queryRunner.query(`DROP TABLE "sub_tasks"`);
    }

}
