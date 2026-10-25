import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFeatureSelectTimeDue1792840094680 implements MigrationInterface {
    name = 'FixFeatureSelectTimeDue1792840094680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_e6d0e84bad894d929e1c66d1d1c"`);
        await queryRunner.query(`ALTER TABLE "tasks" RENAME COLUMN "progress" TO "start_date"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP COLUMN "boardId"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "start_date"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "start_date" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_4f71ed80744bfcecc70e685b0f6" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_4f71ed80744bfcecc70e685b0f6"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "start_date"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "start_date" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD "boardId" uuid`);
        await queryRunner.query(`ALTER TABLE "tasks" RENAME COLUMN "start_date" TO "progress"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_e6d0e84bad894d929e1c66d1d1c" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
