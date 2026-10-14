import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangTypeRoleBoard1791618561218 implements MigrationInterface {
    name = 'ChangTypeRoleBoard1791618561218'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."board_members_role_enum" RENAME TO "board_members_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."board_members_role_enum" AS ENUM('BOARD_OWNER', 'BOARD_LEADER', 'BOARD_MEMBER')`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" TYPE "public"."board_members_role_enum" USING "role"::"text"::"public"."board_members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" SET DEFAULT 'BOARD_MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."board_members_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."board_members_role_enum_old" AS ENUM('ADMIN', 'MEMBER', 'VIEWER', 'LEADER')`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" TYPE "public"."board_members_role_enum_old" USING "role"::"text"::"public"."board_members_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "board_members" ALTER COLUMN "role" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."board_members_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."board_members_role_enum_old" RENAME TO "board_members_role_enum"`);
    }

}
