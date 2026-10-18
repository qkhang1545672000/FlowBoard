import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProgressForTask1792315823954 implements MigrationInterface {
    name = 'AddProgressForTask1792315823954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "progress" double precision NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "progress"`);
    }

}
