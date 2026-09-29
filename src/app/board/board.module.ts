import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './entities/board.entity';
import { ColumnEntity } from './entities/column.entity';
import { Task } from './entities/task.entity';
import { Label } from './entities/label.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardMember } from './entities/board-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Board,
      ColumnEntity,
      Task,
      Label,
      ActivityLog,
      BoardMember,
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
