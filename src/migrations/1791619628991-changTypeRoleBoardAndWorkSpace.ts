import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangTypeRoleBoardAndWorkSpace1791619628991 implements MigrationInterface {
    name = 'ChangTypeRoleBoardAndWorkSpace1791619628991'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_enum" RENAME TO "workspace_members_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_enum" AS ENUM('OWNER', 'MEMBER_WORKSPACE')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role" TYPE "public"."workspace_members_role_enum" USING "role"::"text"::"public"."workspace_members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER_WORKSPACE'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."board_members_role_enum" RENAME TO "board_members_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."board_members_role_enum" AS ENUM('OWNER', 'BOARD_LEADER', 'BOARD_MEMBER')`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" TYPE "public"."board_members_role_enum" USING "role"::"text"::"public"."board_members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" SET DEFAULT 'BOARD_MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."board_members_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invitations_role_enum" RENAME TO "workspace_invitations_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invitations_role_enum" AS ENUM('OWNER', 'MEMBER_WORKSPACE')`);
        await queryRunner.query(`ALTER TABLE "workspace_invitations" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invitations" ALTER COLUMN "role" TYPE "public"."workspace_invitations_role_enum" USING "role"::"text"::"public"."workspace_invitations_role_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_invitations" ALTER COLUMN "role" SET DEFAULT 'MEMBER_WORKSPACE'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invitations_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workspace_invitations_role_enum_old" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invitations" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invitations" ALTER COLUMN "role" TYPE "public"."workspace_invitations_role_enum_old" USING "role"::"text"::"public"."workspace_invitations_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invitations" ALTER COLUMN "role" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invitations_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invitations_role_enum_old" RENAME TO "workspace_invitations_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."board_members_role_enum_old" AS ENUM('BOARD_OWNER', 'BOARD_LEADER', 'BOARD_MEMBER')`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" TYPE "public"."board_members_role_enum_old" USING "role"::"text"::"public"."board_members_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" SET DEFAULT 'BOARD_MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."board_members_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."board_members_role_enum_old" RENAME TO "board_members_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_enum_old" AS ENUM('OWNER', 'ADMIN', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role" TYPE "public"."workspace_members_role_enum_old" USING "role"::"text"::"public"."workspace_members_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_enum_old" RENAME TO "workspace_members_role_enum"`);
    }

}
