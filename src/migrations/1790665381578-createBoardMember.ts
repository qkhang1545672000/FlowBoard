import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBoardMember1790665381578 implements MigrationInterface {
  name = 'CreateBoardMember1790665381578';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."board_members_role_enum" AS ENUM('ADMIN', 'MEMBER', 'VIEWER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "board_members" ("id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "board_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."board_members_role_enum" NOT NULL DEFAULT 'MEMBER', "boardId" uuid, "userId" uuid, CONSTRAINT "UQ_159415b4beacf33c9393cfe673c" UNIQUE ("board_id", "user_id"), CONSTRAINT "PK_6994cea1393b5fa3a0dd827a9f7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ca2c72a39c80199717012df393" ON "board_members"  ("board_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a9989bac63c51805e59ce91a54" ON "board_members"  ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "board_members" ADD CONSTRAINT "FK_8dfe924ec592792320086ebb692" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_members" ADD CONSTRAINT "FK_2af5912734e7fbedc23afd07adc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "board_members" DROP CONSTRAINT "FK_2af5912734e7fbedc23afd07adc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_members" DROP CONSTRAINT "FK_8dfe924ec592792320086ebb692"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a9989bac63c51805e59ce91a54"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca2c72a39c80199717012df393"`,
    );
    await queryRunner.query(`DROP TABLE "board_members"`);
    await queryRunner.query(`DROP TYPE "public"."board_members_role_enum"`);
  }
}
