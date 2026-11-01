import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { Task } from '../task/entities/task.entity';
import { Board } from '../board/entities/board.entity';
import { TaskMember } from '../task/entities/task-member.entity';
import { BoardMember } from '../board/entities/board-member.entity';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      Task,
      Board,
      TaskMember,
      BoardMember,
      WorkspaceMember,
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
