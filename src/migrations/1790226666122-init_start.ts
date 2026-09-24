import { MigrationInterface, QueryRunner } from "typeorm";

export class InitStart1790226666122 implements MigrationInterface {
    name = 'InitStart1790226666122'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'customer', 'unregistered')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" text NOT NULL, "email" text NOT NULL, "email_verified" boolean NOT NULL DEFAULT false, "image" text, "role" "public"."user_role_enum" NOT NULL DEFAULT 'customer', "phone" text, "birthday" date, "gender" text, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "session" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "token" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ip_address" text, "user_agent" text, CONSTRAINT "UQ_232f8e85d7633bd6ddfad421696" UNIQUE ("token"), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_30e98e8746699fb9af235410af" ON "session"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2223e981900a413ce4ce6386f9" ON "session"  ("expires_at") `);
        await queryRunner.query(`CREATE TABLE "account" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "account_id" text NOT NULL, "provider_id" text NOT NULL, "access_token" text, "refresh_token" text, "access_token_expires_at" TIMESTAMP WITH TIME ZONE, "refresh_token_expires_at" TIMESTAMP WITH TIME ZONE, "scope" text, "id_token" text, "password" text, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_efef1e5fdbe318a379c06678c5" ON "account"  ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4c4acfbdf57f81c65a880439e3" ON "account"  ("provider_id", "account_id") `);
        await queryRunner.query(`CREATE TABLE "verification" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "identifier" text NOT NULL, "value" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_f7e3a90ca384e71d6e2e93bb340" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`CREATE TABLE "workspace_members" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "workspace_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."workspace_members_role_enum" NOT NULL DEFAULT 'MEMBER', "deleted_at" TIMESTAMP WITH TIME ZONE, "workspaceId" uuid, "userId" uuid, CONSTRAINT "PK_22ab43ac5865cd62769121d2bc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4896b609c71ca5ad20ad662077" ON "workspace_members"  ("workspace_id", "user_id") `);
        await queryRunner.query(`CREATE TABLE "workspaces" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" text NOT NULL, "slug" text NOT NULL, "description" text, "logo" text, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_b8e9fe62e93d60089dfc4f175f3" UNIQUE ("slug"), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "labels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "board_id" uuid NOT NULL, "title" text, "color" text NOT NULL, "boardId" uuid, CONSTRAINT "PK_c0c4e97f76f1f3a268c7a70b925" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "column_id" uuid NOT NULL, "assignee_id" uuid, "title" text NOT NULL, "description" text, "position" double precision NOT NULL, "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM', "due_date" TIMESTAMP WITH TIME ZONE, "is_completed" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP WITH TIME ZONE, "columnId" uuid, "assigneeId" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_855d484825b715c545349212c7" ON "tasks"  ("assignee_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5417779e2823cac1db80a55f70" ON "tasks"  ("column_id", "position") `);
        await queryRunner.query(`CREATE TYPE "public"."columns_lock_type_enum" AS ENUM('UNLOCKED', 'FULLY_LOCKED', 'ONE_WAY_LOCKED')`);
        await queryRunner.query(`CREATE TABLE "columns" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "board_id" uuid NOT NULL, "title" text NOT NULL, "lock_type" "public"."columns_lock_type_enum" NOT NULL DEFAULT 'UNLOCKED', "position" double precision NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "boardId" uuid, CONSTRAINT "PK_4ac339ccbbfed1dcd96812abbd5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b4a76339b019ce2f6d29be1670" ON "columns"  ("board_id", "position") `);
        await queryRunner.query(`CREATE TYPE "public"."boards_visibility_enum" AS ENUM('PRIVATE', 'WORKSPACE', 'PUBLIC')`);
        await queryRunner.query(`CREATE TABLE "boards" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "workspace_id" uuid NOT NULL, "title" text NOT NULL, "description" text, "background" text, "visibility" "public"."boards_visibility_enum" NOT NULL DEFAULT 'WORKSPACE', "deleted_at" TIMESTAMP, "workspaceId" uuid, CONSTRAINT "PK_606923b0b068ef262dfdcd18f44" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "activity_logs" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "board_id" uuid NOT NULL, "user_id" uuid NOT NULL, "action" text NOT NULL, "entity_type" text NOT NULL, "entity_id" uuid NOT NULL, "details" jsonb, "boardId" uuid, "userId" uuid, CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."messages_scope_enum" AS ENUM('WORKSPACE', 'BOARD', 'TASK')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sender_id" uuid NOT NULL, "scope" "public"."messages_scope_enum" NOT NULL, "workspace_id" uuid, "board_id" uuid, "task_id" uuid, "content" text NOT NULL, "attachments" jsonb, "senderId" uuid, "workspaceId" uuid, "boardId" uuid, "taskId" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c55d26177fb01a60a677db7270" ON "messages"  ("scope", "task_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3f49f2c7adf2400980452b1842" ON "messages"  ("scope", "board_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_43b8fd796ac04cb18d5a21754a" ON "messages"  ("scope", "workspace_id") `);
        await queryRunner.query(`CREATE TABLE "task_labels" ("taskId" uuid NOT NULL, "labelId" uuid NOT NULL, CONSTRAINT "PK_f6a43a093588281dbd8916b8c44" PRIMARY KEY ("taskId", "labelId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b148c8d5eb7df0b134cab11ad2" ON "task_labels"  ("taskId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d63572a77b6a7cccc92903b31f" ON "task_labels"  ("labelId") `);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account" ADD CONSTRAINT "FK_efef1e5fdbe318a379c06678c51" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD CONSTRAINT "FK_22176b38813258c2aadaae32448" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "labels" ADD CONSTRAINT "FK_18b754f85358843adaceb6703c4" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_0ecfe75e5bd731e00e634d70e5f" FOREIGN KEY ("columnId") REFERENCES "columns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "columns" ADD CONSTRAINT "FK_ac92bfd7ba33174aabef610f361" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "boards" ADD CONSTRAINT "FK_f13eef6b2a45019e1df9cfe9963" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_e6d0e84bad894d929e1c66d1d1c" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_597e6df96098895bf19d4b5ea45" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_1d227f15b5d76efbfd5ddd72be6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_6fa09f01d131e60768f3d2bbdfb" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_fd2c4496fbb610e44408e279537" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_labels" ADD CONSTRAINT "FK_b148c8d5eb7df0b134cab11ad2e" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "task_labels" ADD CONSTRAINT "FK_d63572a77b6a7cccc92903b31f2" FOREIGN KEY ("labelId") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_labels" DROP CONSTRAINT "FK_d63572a77b6a7cccc92903b31f2"`);
        await queryRunner.query(`ALTER TABLE "task_labels" DROP CONSTRAINT "FK_b148c8d5eb7df0b134cab11ad2e"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_fd2c4496fbb610e44408e279537"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_6fa09f01d131e60768f3d2bbdfb"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_1d227f15b5d76efbfd5ddd72be6"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_597e6df96098895bf19d4b5ea45"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_e6d0e84bad894d929e1c66d1d1c"`);
        await queryRunner.query(`ALTER TABLE "boards" DROP CONSTRAINT "FK_f13eef6b2a45019e1df9cfe9963"`);
        await queryRunner.query(`ALTER TABLE "columns" DROP CONSTRAINT "FK_ac92bfd7ba33174aabef610f361"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_0ecfe75e5bd731e00e634d70e5f"`);
        await queryRunner.query(`ALTER TABLE "labels" DROP CONSTRAINT "FK_18b754f85358843adaceb6703c4"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_22176b38813258c2aadaae32448"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP CONSTRAINT "FK_0dd45cb52108d0664df4e7e33e6"`);
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_efef1e5fdbe318a379c06678c51"`);
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d63572a77b6a7cccc92903b31f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b148c8d5eb7df0b134cab11ad2"`);
        await queryRunner.query(`DROP TABLE "task_labels"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_43b8fd796ac04cb18d5a21754a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f49f2c7adf2400980452b1842"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c55d26177fb01a60a677db7270"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_scope_enum"`);
        await queryRunner.query(`DROP TABLE "activity_logs"`);
        await queryRunner.query(`DROP TABLE "boards"`);
        await queryRunner.query(`DROP TYPE "public"."boards_visibility_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b4a76339b019ce2f6d29be1670"`);
        await queryRunner.query(`DROP TABLE "columns"`);
        await queryRunner.query(`DROP TYPE "public"."columns_lock_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5417779e2823cac1db80a55f70"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_855d484825b715c545349212c7"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
        await queryRunner.query(`DROP TABLE "labels"`);
        await queryRunner.query(`DROP TABLE "workspaces"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4896b609c71ca5ad20ad662077"`);
        await queryRunner.query(`DROP TABLE "workspace_members"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_enum"`);
        await queryRunner.query(`DROP TABLE "verification"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4c4acfbdf57f81c65a880439e3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efef1e5fdbe318a379c06678c5"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2223e981900a413ce4ce6386f9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_30e98e8746699fb9af235410af"`);
        await queryRunner.query(`DROP TABLE "session"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    }

}
