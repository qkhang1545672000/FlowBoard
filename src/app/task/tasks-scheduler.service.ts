// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm'; // hoặc thư viện ORM bạn dùng
// import { Task } from './entities/task.entity'; // Đường dẫn đến entity Task của bạn

// @Injectable()
// export class TasksSchedulerService {
//   private readonly logger = new Logger(TasksSchedulerService.name);

//   constructor(
//     @InjectRepository(Task)
//     private taskRepository: Repository<Task>,
//   ) {}

//   // Chạy tự động vào lúc 00:00 AM mỗi ngày
//   @Cron(CronExpression.EVERY_HOUR)
//   async handleCron() {
//     this.logger.debug('Đang tự động cập nhật tiến độ các task...');

//     const tasks = await this.taskRepository.find();

//     for (const task of tasks) {
//       if (!task.createdAt || !task.dueDate) continue;

//       const start = new Date(task.createdAt).getTime();
//       const end = new Date(task.dueDate).getTime();
//       const now = new Date().getTime();

//       let newProgress = 0;
//       if (now >= end) {
//         newProgress = 100;
//       } else if (now > start) {
//         const total = end - start;
//         const elapsed = now - start;
//         newProgress = Math.min(
//           Math.max(Math.round((elapsed / total) * 100), 0),
//           100,
//         );
//       }

//       // Chỉ cập nhật nếu tiến độ thay đổi
//       if (task.progress !== newProgress) {
//         task.progress = newProgress;
//         await this.taskRepository.save(task);
//       }
//     }

//     this.logger.debug('Đã cập nhật xong tiến độ cho toàn bộ task.');
//   }
// }
