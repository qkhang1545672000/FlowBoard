import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangNamChat1791276379699 implements MigrationInterface {
  name = 'ChangNamChat1791276379699';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_fd2c4496fbb610e44408e279537"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_6fa09f01d131e60768f3d2bbdfb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_1d227f15b5d76efbfd5ddd72be6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "senderId"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "workspaceId"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "boardId"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "taskId"`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_fb06c053a271467000dbd1d1dab" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_98a66da59e3be48950b077ede24" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_5013aa71b31e81cde2ac45a54e9" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_5013aa71b31e81cde2ac45a54e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_98a66da59e3be48950b077ede24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_fb06c053a271467000dbd1d1dab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" ADD "taskId" uuid`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "boardId" uuid`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "workspaceId" uuid`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "senderId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_1d227f15b5d76efbfd5ddd72be6" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_6fa09f01d131e60768f3d2bbdfb" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_fd2c4496fbb610e44408e279537" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
