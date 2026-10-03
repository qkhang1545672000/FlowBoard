import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { Label } from 'src/app/task/entities/label.entity';
import { ColumnEntity } from '../column/entities/column.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(ColumnEntity)
    private readonly columnRepository: Repository<ColumnEntity>,
  ) {}

  /**
   * 1. THÊM TASK MỚI
   */
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { labelIds, position, ...taskData } = createTaskDto;

    // Tự động tính position nếu client không truyền
    let calculatedPosition = position;
    if (calculatedPosition === undefined || calculatedPosition === null) {
      const lastTask = await this.taskRepository.findOne({
        where: { columnId: taskData.columnId },
        order: { position: 'DESC' },
      });
      calculatedPosition = lastTask ? lastTask.position + 1000 : 1000;
    }

    // Load các Labels nếu có truyền labelIds
    let labels: Label[] = [];
    if (labelIds && labelIds.length > 0) {
      labels = await this.labelRepository.findBy({ id: In(labelIds) });
    }

    const newTask = this.taskRepository.create({
      ...taskData,
      position: calculatedPosition,
      labels,
    });

    return await this.taskRepository.save(newTask);
  }

  /**
   * 2. LẤY CHI TIẾT TASK
   */
  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        assignee: true,
        labels: true,
        column: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Không tìm thấy Task với ID: ${id}`);
    }

    return task;
  }

  /**
   * 3. LẤY DANH SÁCH TASK THEO COLUMN ID
   */
  async findAllByColumn(columnId: string): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { columnId },
      order: { position: 'ASC' },
      relations: {
        assignee: true,
        labels: true,
      },
      select: {
        id: true,
        columnId: true,
        title: true,
        description: true,
        position: true,
        priority: true,
        dueDate: true,
        isCompleted: true,
        assignee: {
          id: true,
          name: true,
          image: true,
        },
        labels: {
          id: true,
          title: true,
          color: true,
        },
      },
    });
  }

  /**
   * 4. CẬP NHẬT TASK
   */
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const { labelIds, ...updateData } = updateTaskDto;
    const task = await this.findOne(id);

    // Cập nhật quan hệ Labels nếu có truyền
    if (labelIds !== undefined) {
      task.labels =
        labelIds.length > 0
          ? await this.labelRepository.findBy({ id: In(labelIds) })
          : [];
    }

    Object.assign(task, updateData);
    return await this.taskRepository.save(task);
  }

  /**
   * 5. KÉO THẢ / CHUYỂN CỘT (DRAG & DROP)
   */
  async move(id: string, moveTaskDto: MoveTaskDto): Promise<Task> {
    const { columnId, position } = moveTaskDto;

    // 1. Kiểm tra Task có tồn tại không
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task với ID "${id}" không tồn tại.`);
    }

    // 2. Kiểm tra Column mới có tồn tại không
    const targetColumn = await this.columnRepository.findOne({
      where: { id: columnId },
    });
    if (!targetColumn) {
      throw new NotFoundException(`Column với ID "${columnId}" không tồn tại.`);
    }

    // 3. Dùng UPDATE trực tiếp để ép TypeORM cập nhật columnId mới vào DB
    await this.taskRepository.update(id, {
      columnId: columnId,
      position: position,
    });

    // 4. Lấy lại danh sách task trong cột mới để đánh lại thứ tự position
    const tasksInColumn = await this.taskRepository.find({
      where: { columnId },
      order: { position: 'ASC' },
    });

    // 5. Cập nhật lại chuỗi position chuẩn (100, 200, 300,...)
    for (let i = 0; i < tasksInColumn.length; i++) {
      await this.taskRepository.update(tasksInColumn[i].id, {
        position: (i + 1) * 100,
      });
    }

    // 6. Query lại Task hoàn chỉnh kèm relation mới để trả về
    return await this.taskRepository.findOne({
      where: { id },
      relations: {
        assignee: true,
        labels: true,
        column: true,
      },
    });
  }

  /**
   * 6. XÓA MỀM (Soft Delete)
   */
  async remove(id: string): Promise<{ message: string }> {
    const task = await this.findOne(id);
    await this.taskRepository.softDelete(task.id);
    return { message: 'Xóa Task thành công' };
  }

  /**
   * 7. KHÔI PHỤC TASK ĐÃ XÓA
   */
  async restore(id: string): Promise<Task> {
    await this.taskRepository.restore(id);
    return await this.findOne(id);
  }
  async moveTask(taskId: string, targetColumnId: string, position: number) {
    await this.taskRepository.update(taskId, {
      columnId: targetColumnId,
      position,
    });
    return { success: true };
  }
}
