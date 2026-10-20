import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRoleForWorkspaceMember1792477736394 implements MigrationInterface {
    name = 'UpdateRoleForWorkspaceMember1792477736394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_enum" ADD VALUE 'LEADER_WORKSPACE'`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invitations_role_enum" ADD VALUE 'LEADER_WORKSPACE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workspace_invitations_role_enum_old" AS ENUM('OWNER', 'MEMBER_WORKSPACE')`);
        await queryRunner.query(`ALTER TABLE "workspace_invitations" ALTER COLUMN "role" TYPE "public"."workspace_invitations_role_enum_old" USING "role"::"text"::"public"."workspace_invitations_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invitations_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invitations_role_enum_old" RENAME TO "workspace_invitations_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_enum_old" AS ENUM('OWNER', 'MEMBER_WORKSPACE')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role" TYPE "public"."workspace_members_role_enum_old" USING "role"::"text"::"public"."workspace_members_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_enum_old" RENAME TO "workspace_members_role_enum"`);
    }

}
