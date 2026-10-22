import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { Label } from './entities/label.entity';

import { ColumnEntity } from '../column/entities/column.entity';

import { BoardModule } from '../board/board.module';
import { TaskMember } from './entities/task-member.entity';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Label, ColumnEntity, TaskMember]),
    BoardModule,
    ActivityLogModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
