import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';

import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardMember } from './entities/board-member.entity';
import { BoardGateway } from './board.gateway';
import { TaskMember } from '../task/entities/task-member.entity';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { ActivityLog } from '../activity-log/entities/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, BoardMember, TaskMember, ActivityLog]),
    WorkspaceModule,
    ActivityLogModule,
  ],
  controllers: [BoardController],
  providers: [BoardService, BoardGateway],
  exports: [BoardService],
})
export class BoardModule {}
