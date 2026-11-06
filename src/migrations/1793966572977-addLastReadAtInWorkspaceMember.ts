import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastReadAtInWorkspaceMember1793966572977 implements MigrationInterface {
    name = 'AddLastReadAtInWorkspaceMember1793966572977'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_members" ADD "last_read_at" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspace_members" DROP COLUMN "last_read_at"`);
    }

}
