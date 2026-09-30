import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleForBoard1790730790394 implements MigrationInterface {
  name = 'AddRoleForBoard1790730790394';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."board_members_role_enum" ADD VALUE 'LEADER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."board_members_role_enum_old" AS ENUM('ADMIN', 'MEMBER', 'VIEWER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_members" ALTER COLUMN "role" TYPE "public"."board_members_role_enum_old" USING "role"::"text"::"public"."board_members_role_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."board_members_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."board_members_role_enum_old" RENAME TO "board_members_role_enum"`,
    );
  }
}
