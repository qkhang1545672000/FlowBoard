import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ColumnEntity } from './entities/column.entity';

import { ColumnController } from './column.controller';
import { ColumnService } from './column.service';

import { BoardModule } from '../board/board.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ColumnEntity]),
    BoardModule,
    WorkspaceModule,
    ActivityLogModule,
  ],
  controllers: [ColumnController],
  providers: [ColumnService],
  exports: [ColumnService],
})
export class ColumnModule {}
