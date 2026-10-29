import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubTask } from './entities/sub-task.entity';
import { SubTaskService } from './sub-task.service';
import { SubTaskController } from './sub-task.controller';
import { Task } from 'src/app/task/entities/task.entity';
import { User } from 'src/app/user/entities/user.entity'; // 👈 Import User entity

@Module({
  imports: [TypeOrmModule.forFeature([SubTask, Task, User])], // 👈 Thêm User vào đây
  controllers: [SubTaskController],
  providers: [SubTaskService],
  exports: [SubTaskService],
})
export class SubTaskModule {}
