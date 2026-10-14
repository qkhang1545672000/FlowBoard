import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { Label } from './entities/label.entity';

import { ColumnEntity } from '../column/entities/column.entity';

import { UserModule } from '../user/user.module';
import { BoardModule } from '../board/board.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Label, ColumnEntity]), BoardModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
