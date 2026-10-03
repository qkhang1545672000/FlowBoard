import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColumnEntity } from './entities/column.entity';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from '../board/dto/update-column.dto';

@Injectable()
export class ColumnService {
  constructor(
    @InjectRepository(ColumnEntity)
    private readonly columnRepository: Repository<ColumnEntity>,
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
  async update(id: string, dto: UpdateColumnDto): Promise<ColumnEntity> {
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
        position: 'ASC', // Sắp xếp thứ tự các cột từ trái sang phải
        tasks: {
          position: 'ASC', // Sắp xếp các task trong từng cột từ trên xuống dưới
        },
      },
      relations: {
        tasks: {
          assignee: true,
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
      },
    });
  }

  async moveColumn(columnId: string, position: number) {
    await this.columnRepository.update(columnId, { position });
    return { success: true };
  }
}
