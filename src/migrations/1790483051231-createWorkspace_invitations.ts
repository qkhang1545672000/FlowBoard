import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkspaceInvitations1790483051231 implements MigrationInterface {
  name = 'CreateWorkspaceInvitations1790483051231';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_22176b38813258c2aadaae32448"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_18b754f85358843adaceb6703c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "columns" DROP CONSTRAINT "FK_ac92bfd7ba33174aabef610f361"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" DROP CONSTRAINT "FK_f13eef6b2a45019e1df9cfe9963"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_597e6df96098895bf19d4b5ea45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_d63572a77b6a7cccc92903b31f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_b148c8d5eb7df0b134cab11ad2e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b148c8d5eb7df0b134cab11ad2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d63572a77b6a7cccc92903b31f"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_invitations_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_invitations_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_invitations" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "workspace_id" uuid NOT NULL, "email" character varying NOT NULL, "inviter_id" uuid NOT NULL, "role" "public"."workspace_invitations_role_enum" NOT NULL DEFAULT 'MEMBER', "status" "public"."workspace_invitations_status_enum" NOT NULL DEFAULT 'PENDING', "token" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_efb7ba588916737f408a72a3cc9" UNIQUE ("token"), CONSTRAINT "PK_525b9069dc828a8ee8fdc62c32c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP COLUMN "workspaceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP COLUMN "userId"`,
    );
    await queryRunner.query(`ALTER TABLE "labels" DROP COLUMN "boardId"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "assigneeId"`);
    await queryRunner.query(`ALTER TABLE "columns" DROP COLUMN "boardId"`);
    await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "workspaceId"`);
    await queryRunner.query(`ALTER TABLE "activity_logs" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "PK_f6a43a093588281dbd8916b8c44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "PK_d63572a77b6a7cccc92903b31f2" PRIMARY KEY ("labelId")`,
    );
    await queryRunner.query(`ALTER TABLE "task_labels" DROP COLUMN "taskId"`);
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "PK_d63572a77b6a7cccc92903b31f2"`,
    );
    await queryRunner.query(`ALTER TABLE "task_labels" DROP COLUMN "labelId"`);
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD "task_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "PK_844df22351eb86c33c3e8c132f4" PRIMARY KEY ("task_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD "label_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "PK_844df22351eb86c33c3e8c132f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "PK_d46d4e476e3f6f8bf272b2bc1eb" PRIMARY KEY ("task_id", "label_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_844df22351eb86c33c3e8c132f" ON "task_labels"  ("task_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09dd3f6f9d04063726c498155f" ON "task_labels"  ("label_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_4a7c584ddfe855379598b5e20fd" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_4e83431119fa585fc7aa8b817db" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_8c01957f89bcb4364bb5b4b35ce" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_855d484825b715c545349212c7f" FOREIGN KEY ("assignee_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "columns" ADD CONSTRAINT "FK_3f88407849daf390e93035b15ef" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" ADD CONSTRAINT "FK_bf217cf96eaeb253a7cd35b52ad" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_d54f841fa5478e4734590d44036" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitations" ADD CONSTRAINT "FK_cf5df369b7a86ea3cdf18c7b56d" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitations" ADD CONSTRAINT "FK_7676b6af9283e6200193966ccf3" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_844df22351eb86c33c3e8c132f4" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_09dd3f6f9d04063726c498155f2" FOREIGN KEY ("label_id") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_09dd3f6f9d04063726c498155f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "FK_844df22351eb86c33c3e8c132f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitations" DROP CONSTRAINT "FK_7676b6af9283e6200193966ccf3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_invitations" DROP CONSTRAINT "FK_cf5df369b7a86ea3cdf18c7b56d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_d54f841fa5478e4734590d44036"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" DROP CONSTRAINT "FK_bf217cf96eaeb253a7cd35b52ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "columns" DROP CONSTRAINT "FK_3f88407849daf390e93035b15ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_855d484825b715c545349212c7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" DROP CONSTRAINT "FK_8c01957f89bcb4364bb5b4b35ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_4e83431119fa585fc7aa8b817db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_4a7c584ddfe855379598b5e20fd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09dd3f6f9d04063726c498155f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_844df22351eb86c33c3e8c132f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "PK_d46d4e476e3f6f8bf272b2bc1eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "PK_844df22351eb86c33c3e8c132f4" PRIMARY KEY ("task_id")`,
    );
    await queryRunner.query(`ALTER TABLE "task_labels" DROP COLUMN "label_id"`);
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "PK_844df22351eb86c33c3e8c132f4"`,
    );
    await queryRunner.query(`ALTER TABLE "task_labels" DROP COLUMN "task_id"`);
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD "labelId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "PK_d63572a77b6a7cccc92903b31f2" PRIMARY KEY ("labelId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD "taskId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" DROP CONSTRAINT "PK_d63572a77b6a7cccc92903b31f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "PK_f6a43a093588281dbd8916b8c44" PRIMARY KEY ("taskId", "labelId")`,
    );
    await queryRunner.query(`ALTER TABLE "activity_logs" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "boards" ADD "workspaceId" uuid`);
    await queryRunner.query(`ALTER TABLE "columns" ADD "boardId" uuid`);
    await queryRunner.query(`ALTER TABLE "tasks" ADD "assigneeId" uuid`);
    await queryRunner.query(`ALTER TABLE "labels" ADD "boardId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD "userId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD "workspaceId" uuid`,
    );
    await queryRunner.query(`DROP TABLE "workspace_invitations"`);
    await queryRunner.query(
      `DROP TYPE "public"."workspace_invitations_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."workspace_invitations_role_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d63572a77b6a7cccc92903b31f" ON "task_labels" USING btree ("labelId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b148c8d5eb7df0b134cab11ad2" ON "task_labels" USING btree ("taskId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_b148c8d5eb7df0b134cab11ad2e" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_labels" ADD CONSTRAINT "FK_d63572a77b6a7cccc92903b31f2" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_597e6df96098895bf19d4b5ea45" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" ADD CONSTRAINT "FK_f13eef6b2a45019e1df9cfe9963" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "columns" ADD CONSTRAINT "FK_ac92bfd7ba33174aabef610f361" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "labels" ADD CONSTRAINT "FK_18b754f85358843adaceb6703c4" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_22176b38813258c2aadaae32448" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
