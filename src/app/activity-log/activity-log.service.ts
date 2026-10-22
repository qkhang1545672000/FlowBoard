import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  /**
   * Tạo bản ghi log mới (Dùng nội bộ khi người dùng thực hiện các hành động trên hệ thống)
   */
  async create(
    userId: string,
    createDto: CreateActivityLogDto,
  ): Promise<ActivityLog> {
    const log = this.activityLogRepository.create({
      ...createDto,
      userId,
    });
    return this.activityLogRepository.save(log);
  }

  /**
   * Lấy danh sách lịch sử hoạt động (Có phân trang và lọc theo boardId)
   */
  async findAll(query: QueryActivityLogDto) {
    const { boardId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .select([
        'log.id',
        'log.action',
        'log.entityType',
        'log.entityId',
        'log.details',
        'log.createdAt',
        'user.id',
        'user.name',
        'user.email',
        'user.image',
      ]);

    if (boardId) {
      queryBuilder.where('log.boardId = :boardId', { boardId });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Lấy chi tiết một log theo ID
   */
  async findOne(id: string): Promise<ActivityLog> {
    return this.activityLogRepository.findOne({
      where: { id },
      relations: {
        user: true,
        board: true,
      },
    });
  }
}
