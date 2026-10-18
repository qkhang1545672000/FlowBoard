import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { Label } from 'src/app/task/entities/label.entity';
import { ColumnEntity } from '../column/entities/column.entity';

import { BoardService } from '../board/board.service';
import { User } from '../user/entities/user.entity';
import { TaskMember } from './entities/task-member.entity';
import { TaskMemberRole } from 'src/shared/types/TaskMemberRole.enum';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(ColumnEntity)
    private readonly columnRepository: Repository<ColumnEntity>,
    @InjectRepository(TaskMember)
    private readonly taskMemberRepository: Repository<TaskMember>,

    private readonly boardService: BoardService,
    private readonly dataSource: DataSource,
  ) {}
  private readonly logger = new Logger(TaskService.name);
  /**
   * 1. THÊM TASK MỚI
   */
  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    // Đã loại bỏ 'position' ra khỏi Destructuring
    const { labelIds, dueDate, ...taskData } = createTaskDto;

    // 1. Luôn tự động tìm task cuối cùng trong cột để tính position mới (tăng dần +1000)
    const lastTask = await this.taskRepository.findOne({
      where: { columnId: taskData.columnId },
      order: { position: 'DESC' },
    });
    const calculatedPosition = lastTask
      ? Number(lastTask.position) + 1000
      : 1000;

    // 2. Load danh sách Labels nếu có truyền labelIds
    let labels: Label[] = [];
    if (labelIds && labelIds.length > 0) {
      labels = await this.labelRepository.findBy({ id: In(labelIds) });
    }

    // 3. Thực thi lưu Task & TaskMember trong một Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedTaskId: string;

    try {
      // Tạo và lưu Task với position tự động tính
      const newTask = queryRunner.manager.create(Task, {
        ...taskData,
        // --- AN TOÀN HƠN: Chỉ khởi tạo Date nếu dueDate có giá trị, ngược lại gán null ---
        dueDate: dueDate ? new Date(dueDate) : null,
        position: calculatedPosition,
        labels,
      });
      const savedTask = await queryRunner.manager.save(newTask);
      savedTaskId = savedTask.id;

      // Tự động gán người tạo Task làm TASK_LEADER
      const newMember = queryRunner.manager.create(TaskMember, {
        taskId: savedTaskId,
        userId: user.id,
        role: TaskMemberRole.TASK_LEADER,
      });
      await queryRunner.manager.save(newMember);

      // Commit Transaction nếu tất cả thành công
      await queryRunner.commitTransaction();
    } catch (error) {
      // Rollback dữ liệu nếu xảy ra lỗi trong quá trình lưu
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Không thể tạo công việc, vui lòng thử lại.',
      );
    } finally {
      await queryRunner.release();
    }

    // 4. Truy vấn lại để trả về đầy đủ các Relations
    return await this.taskRepository.findOne({
      where: { id: savedTaskId },
      relations: {
        column: true,
        labels: true,
        members: {
          user: true,
        },
      },
    });
  }
  /**
   * 2. LẤY CHI TIẾT TASK
   */
  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: {
        members: true,
        labels: true,
        column: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Không tìm thấy Task với ID: ${id}`);
    }

    return task;
  }
  async addMemberForTask(
    taskId: string,
    userIds: string[],

    currentUserId: string, // Thêm tham số này để fallback
    leaderId?: string,
  ) {
    // 1. Kiểm tra task có tồn tại không
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: {
        members: {
          user: true,
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task với ID ${taskId} không tồn tại.`);
    }

    const existingMembers = task.members || [];

    // --- LOGIC MỚI: NẾU DANH SÁCH GỬI LÊN RỖNG ---
    let finalUserIds = userIds || [];
    let finalLeaderId = leaderId;

    if (finalUserIds.length === 0) {
      // Nếu không chọn ai mà có thông tin người đang thao tác, tự động gán chính họ
      if (currentUserId) {
        finalUserIds = [currentUserId];
        finalLeaderId = currentUserId; // Đồng thời là leader luôn
      } else {
        // Trường hợp không có currentUserId (hi hữu), xóa sạch như cũ hoặc xử lý tùy ý
        if (existingMembers.length > 0) {
          await this.taskMemberRepository.remove(existingMembers);
        }
        return { message: 'Đã xóa toàn bộ thành viên khỏi task thành công' };
      }
    }
    // ---------------------------------------------

    // Xác định ai sẽ là Leader
    let targetLeaderId = finalLeaderId;
    if (!targetLeaderId || !finalUserIds.includes(targetLeaderId)) {
      targetLeaderId = finalUserIds[0];
    }

    // 3. Xóa các thành viên không còn nằm trong danh sách mới
    const membersToRemove = existingMembers.filter(
      (m) => !finalUserIds.includes(m.userId),
    );
    if (membersToRemove.length > 0) {
      await this.taskMemberRepository.remove(membersToRemove);
    }

    // 4. Cập nhật hoặc Thêm mới thành viên
    for (const userId of finalUserIds) {
      const role =
        userId === targetLeaderId
          ? TaskMemberRole.TASK_LEADER
          : TaskMemberRole.TASK_MEMBER;

      const existingMember = existingMembers.find((m) => m.userId === userId);
      if (existingMember) {
        if (existingMember.role !== role) {
          existingMember.role = role;
          await this.taskMemberRepository.save(existingMember);
        }
      } else {
        const newMember = this.taskMemberRepository.create({
          taskId,
          userId,
          role,
        });
        await this.taskMemberRepository.save(newMember);
      }
    }

    // Trả về thông tin task kèm danh sách member mới nhất
    return this.taskRepository.findOne({
      where: { id: taskId },
      relations: {
        members: {
          user: true,
        },
      },
    });
  }

  /**
   * 3. LẤY DANH SÁCH TASK THEO COLUMN ID
   */
  async findAllByColumn(columnId: string): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { columnId },
      order: { position: 'ASC' },
      relations: {
        members: true,
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
        members: {
          user: {
            id: true,
            name: true,
            image: true,
          },
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
    const task = await this.findOne(id);

    // 1. Lọc bỏ hẳn 'position' và tách lấy dueDate, labelIds ra xử lý riêng
    const { labelIds, dueDate, ...updateData } = updateTaskDto;

    // 2. Cập nhật Labels nếu có truyền lên
    if (labelIds !== undefined) {
      task.labels =
        labelIds.length > 0
          ? await this.labelRepository.findBy({ id: In(labelIds) })
          : [];
    }

    // 3. Xử lý cập nhật dueDate (ép từ string sang Date) và reset isReminderSent
    if (dueDate !== undefined) {
      // Ép kiểu chuỗi ISO từ DTO sang đối tượng Date của JavaScript
      task.dueDate = dueDate ? new Date(dueDate) : null;

      // Khi đổi hạn mới, ta cho phép hệ thống quét nhắc nhở lại từ đầu
      // (Khuyên dùng: Bạn nên khai báo isReminderSent: boolean trong Task entity để không cần dùng as any)
    }

    // 4. Chỉ gán các trường khác (priority, title, description,...) nếu chúng KHÁC undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        task[key] = updateData[key];
      }
    });

    const savedTask = await this.taskRepository.save(task);

    return savedTask;
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
        members: true,
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
