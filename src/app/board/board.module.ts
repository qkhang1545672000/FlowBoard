import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';

import { ActivityLog } from './entities/activity-log.entity';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardMember } from './entities/board-member.entity';
import { BoardGateway } from './board.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Board, ActivityLog, BoardMember])],
  controllers: [BoardController],
  providers: [BoardService, BoardGateway],
  exports: [BoardService],
})
export class BoardModule {}
