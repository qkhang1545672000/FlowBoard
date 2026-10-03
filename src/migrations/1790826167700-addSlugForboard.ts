import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlugForboard1790826167700 implements MigrationInterface {
  name = 'AddSlugForboard1790826167700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "boards" ADD "slug" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "boards" ADD CONSTRAINT "UQ_9a01141982175d5633687bcb47d" UNIQUE ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "boards" DROP CONSTRAINT "UQ_9a01141982175d5633687bcb47d"`,
    );
    await queryRunner.query(`ALTER TABLE "boards" DROP COLUMN "slug"`);
  }
}
