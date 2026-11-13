import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecipientIdForChat1794551350400 implements MigrationInterface {
  name = 'AddRecipientIdForChat1794551350400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" ADD "recipient_id" uuid`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c55d26177fb01a60a677db7270"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f49f2c7adf2400980452b1842"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43b8fd796ac04cb18d5a21754a"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."messages_scope_enum" ADD VALUE 'DIRECT'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e76dab94eb533482f4813a0ae" ON "messages"  ("scope", "recipient_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c55d26177fb01a60a677db7270" ON "messages"  ("scope", "task_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f49f2c7adf2400980452b1842" ON "messages"  ("scope", "board_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43b8fd796ac04cb18d5a21754a" ON "messages"  ("scope", "workspace_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_566c3d68184e83d4307b86f85ab" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_566c3d68184e83d4307b86f85ab"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43b8fd796ac04cb18d5a21754a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f49f2c7adf2400980452b1842"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c55d26177fb01a60a677db7270"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e76dab94eb533482f4813a0ae"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_scope_enum_old" AS ENUM('WORKSPACE', 'BOARD', 'TASK')`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "scope" TYPE "public"."messages_scope_enum_old" USING "scope"::"text"::"public"."messages_scope_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."messages_scope_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."messages_scope_enum_old" RENAME TO "messages_scope_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43b8fd796ac04cb18d5a21754a" ON "messages" USING btree ("scope", "workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f49f2c7adf2400980452b1842" ON "messages" USING btree ("scope", "board_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c55d26177fb01a60a677db7270" ON "messages" USING btree ("scope", "task_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN "recipient_id"`,
    );
  }
}
