import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubTask } from './entities/sub-task.entity';
import { CreateSubTaskDto } from './dto/create-sub-task.dto';
import { UpdateSubTaskDto } from './dto/update-sub-task.dto';
import { Task } from 'src/app/task/entities/task.entity';

@Injectable()
export class SubTaskService {
  constructor(
    @InjectRepository(SubTask)
    private readonly subTaskRepository: Repository<SubTask>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  // Lấy danh sách subtask theo taskId
  async findAllByTask(taskId: string): Promise<any[]> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task)
      throw new NotFoundException(`Task với ID ${taskId} không tồn tại.`);

    const subTasks = await this.subTaskRepository.find({
      where: { taskId },
      relations: {
        assignee: true, // Nếu entity SubTask của bạn có relation assignee
      },
      order: { position: 'ASC' },
    });

    const now = new Date().getTime();

    // Duyệt qua từng subtask để tính toán thời gian
    return subTasks.map((subTask) => {
      let timeLeftText = '';
      let isOverdue = false;

      // 🟢 1. Kiểm tra nếu có thời gian bắt đầu và lớn hơn hiện tại (Chưa đến giờ bắt đầu)
      if (subTask.startDate) {
        const startTime = new Date(subTask.startDate).getTime();
        const startDiff = startTime - now;

        if (startDiff > 0) {
          const days = Math.floor(startDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (startDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor(
            (startDiff % (1000 * 60 * 60)) / (1000 * 60),
          );

          if (days > 0) {
            timeLeftText = `Còn ${days} ngày ${hours} giờ nữa bắt đầu`;
          } else if (hours > 0) {
            timeLeftText = `Còn ${hours} giờ ${minutes} phút nữa bắt đầu`;
          } else {
            timeLeftText = `Còn ${minutes} phút nữa bắt đầu`;
          }
        }
      }

      // 🟢 2. Nếu đã đến hoặc qua thời gian bắt đầu, tiến hành tính thời gian còn lại đến hạn chót (dueDate)
      if (!timeLeftText && subTask.dueDate) {
        const dueTime = new Date(subTask.dueDate).getTime();
        const diff = dueTime - now;

        if (diff <= 0) {
          timeLeftText = 'Đã quá hạn';
          isOverdue = true;
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            timeLeftText = `Còn ${days} ngày ${hours} giờ`;
          } else if (hours > 0) {
            timeLeftText = `Còn ${hours} giờ ${minutes} phút`;
          } else {
            timeLeftText = `Còn ${minutes} phút`;
          }
        }
      }

      return {
        ...subTask,
        timeLeft: timeLeftText, // Chuỗi hiển thị thời gian linh hoạt (Chờ bắt đầu -> Đếm ngược deadline -> Quá hạn)
        isOverdue, // Cờ đánh dấu quá hạn (true/false)
      };
    });
  }

  // Tạo subtask mới
  async create(dto: CreateSubTaskDto): Promise<SubTask> {
    const task = await this.taskRepository.findOne({
      where: { id: dto.taskId },
    });
    if (!task)
      throw new NotFoundException(`Task với ID ${dto.taskId} không tồn tại.`);

    const lastSubTask = await this.subTaskRepository.findOne({
      where: { taskId: dto.taskId },
      order: { position: 'DESC' },
    });

    const position = lastSubTask ? Number(lastSubTask.position) + 1000 : 1000;

    const subTask = this.subTaskRepository.create({
      ...dto,
      position,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    });

    return await this.subTaskRepository.save(subTask);
  }

  // Cập nhật subtask (bao gồm thời gian startDate, dueDate, title, completed, assignee)
  async update(id: string, dto: UpdateSubTaskDto): Promise<SubTask> {
    const subTask = await this.subTaskRepository.findOne({ where: { id } });
    if (!subTask)
      throw new NotFoundException(`SubTask với ID ${id} không tồn tại.`);

    if (dto.startDate !== undefined) {
      subTask.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.dueDate !== undefined) {
      subTask.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined && key !== 'startDate' && key !== 'dueDate') {
        subTask[key] = dto[key];
      }
    });

    return await this.subTaskRepository.save(subTask);
  }

  // Xóa subtask
  async remove(id: string): Promise<{ message: string }> {
    const subTask = await this.subTaskRepository.findOne({ where: { id } });
    if (!subTask)
      throw new NotFoundException(`SubTask với ID ${id} không tồn tại.`);

    await this.subTaskRepository.remove(subTask);
    return { message: 'Xóa công việc con thành công' };
  }
}
