import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColumnEntity } from './entities/column.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from '../board/dto/update-column.dto';

import { BoardService } from '../board/board.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { User } from '../user/entities/user.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class ColumnService {
  constructor(
    @InjectRepository(ColumnEntity)
    private readonly columnRepository: Repository<ColumnEntity>,

    private readonly boardService: BoardService,
    private readonly workspaceService: WorkspaceService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * 1. THÊM CỘT MỚI
   * Tự động tính toán vị trí (position) cuối cùng nếu người dùng không truyền position.
   */
  async create(dto: CreateColumnDto): Promise<ColumnEntity> {
    let position = dto.position;

    if (position === undefined || position === null) {
      // Tìm vị trí lớn nhất hiện tại của board để cộng thêm 1000 (giúp dễ kéo thả sau này)
      const lastColumn = await this.columnRepository.findOne({
        where: { boardId: dto.boardId },
        order: { position: 'DESC' },
      });
      position = lastColumn ? lastColumn.position + 1000 : 1000;
    }

    const newColumn = this.columnRepository.create({
      ...dto,
      position,
    });

    return await this.columnRepository.save(newColumn);
  }

  /**
   * 2. LẤY CHI TIẾT 1 CỘT (kèm theo danh sách Task)
   */
  async findOne(id: string): Promise<ColumnEntity> {
    const column = await this.columnRepository.findOne({
      where: { id },
      relations: {
        tasks: true,
      },
      order: {
        tasks: { position: 'ASC' },
      },
    });

    if (!column) {
      throw new NotFoundException(`Không tìm thấy cột với ID: ${id}`);
    }

    return column;
  }

  /**
   * 3. SỬA CỘT (Tên, Lock status, Position...)
   */
  async update(
    id: string,
    dto: UpdateColumnDto,
    userId: string,
  ): Promise<ColumnEntity> {
    let isOwn = await this.boardService.checkIsOwnOrLeader(dto.boardId, userId);

    if (isOwn == false) {
      isOwn = await this.workspaceService.checkIsOwnOrLeaderWorkspaceWithBoard(
        dto.boardId,
        userId,
      );
    }
    if (!isOwn) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện thao tác này!',
      );
    }
    const column = await this.findOne(id);

    Object.assign(column, dto);

    return await this.columnRepository.save(column);
  }

  /**
   * 4. XÓA MỀM CỘT (Soft Delete)
   * Sử dụng DeleteDateColumn đã khai báo trên Entity.
   */
  async remove(id: string): Promise<{ message: string }> {
    const column = await this.findOne(id);
    await this.columnRepository.softDelete(column.id);
    return { message: 'Đã xóa cột thành công' };
  }

  /**
   * 5. KHÔI PHỤC CỘT ĐÃ XÓA MỀM (Restore)
   */
  async restore(id: string): Promise<ColumnEntity> {
    await this.columnRepository.restore(id);
    return await this.findOne(id);
  }

  /**
   * 6. XÓA CỨNG (Hard Delete)
   */
  async hardDelete(id: string): Promise<{ message: string }> {
    const result = await this.columnRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy cột với ID: ${id}`);
    }
    return { message: 'Đã xóa hoàn toàn cột khỏi hệ thống' };
  }
  /**
   * LẤY DANH SÁCH CỘT THEO BOARD ID (KÈM DSD TASK)
   */
  async findAllByBoard(boardId: string): Promise<ColumnEntity[]> {
    return await this.columnRepository.find({
      where: { boardId },
      order: {
        position: 'ASC',
        tasks: {
          position: 'ASC',
        },
      },
      relations: {
        tasks: {
          members: {
            user: true,
          },
          labels: true,
        },
      },
      select: {
        id: true,
        boardId: true,
        title: true,
        lock_type: true,
        position: true,
        createdAt: true,
        tasks: {
          id: true,
          title: true,
          description: true,
          position: true,
          priority: true,
          dueDate: true,
          isCompleted: true,

          // 🟢 BỔ SUNG CÁC TRƯỜNG CỦA TASKMEMBER VÀO ĐÂY:
          members: {
            id: true, // Khóa chính của TaskMember (Bắt buộc)
            taskId: true, // Khóa ngoại (Bắt buộc)
            userId: true, // Khóa ngoại (Bắt buộc)
            role: true, // Vai trò (TASK_LEADER / TASK_MEMBER)
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
      },
    });
  }

  async moveColumn(
    columnId: string,
    moveColumnDto: { position: number },
    user?: User,
  ) {
    const { position } = moveColumnDto;

    // 1. Kiểm tra Column có tồn tại không
    const column = await this.columnRepository.findOne({
      where: { id: columnId },
    });
    if (!column) {
      throw new NotFoundException(`Column với ID "${columnId}" không tồn tại.`);
    }

    // 2. Cập nhật position mới vào DB cho cột được kéo
    await this.columnRepository.update(columnId, { position });

    // 3. Chuẩn hóa lại thứ tự position chuẩn cho toàn bộ các cột trong board đó
    // (tránh việc position bị trùng lặp hoặc số quá lẻ sau nhiều lần kéo thả)
    const columnsInBoard = await this.columnRepository.find({
      where: { boardId: column.boardId },
      order: { position: 'ASC' },
    });

    for (let i = 0; i < columnsInBoard.length; i++) {
      await this.columnRepository.update(columnsInBoard[i].id, {
        position: (i + 1) * 100.0,
      });
    }

    // 4. 📝 GHI LOG HOẠT ĐỘNG (Activity Log) nếu có truyền user
    if (user) {
      await this.activityLogService.create(user.id, {
        boardId: column.boardId,
        action: 'MOVED_COLUMN', // Hoặc tên action tương ứng trong hệ thống log của bạn
        entityType: 'COLUMN',
        entityId: column.id,
        details: {
          columnTitle: column.title,
        },
      });
    }

    return {
      success: true,
      message: 'Di chuyển cột thành công',
    };
  }
}
