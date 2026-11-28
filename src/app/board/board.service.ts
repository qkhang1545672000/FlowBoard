/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from '../column/dto/update-board.dto';
import { BoardMemberRole } from 'src/shared/types/BoardMemberRole.enum';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';
import {
  calculateDynamicProgress,
  calculateTimeRemaining,
} from 'src/shared/helpers/caculaterDate';
import { TaskMember } from '../task/entities/task-member.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityLog } from '../activity-log/entities/activity-log.entity';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(TaskMember)
    private readonly taskMemberRepository: Repository<TaskMember>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    private readonly dataSource: DataSource,
    private readonly activityLogService: ActivityLogService,
  ) {}

  /**
   * Tạo mới 1 Board và tự động thêm User tạo vào làm ADMIN của Board đó
   */

  async isCheckMemberBoard(boardId: string, userId: string): Promise<boolean> {
    const member = await this.boardMemberRepository.findOne({
      where: { boardId, userId },
    });

    return !!member; // Trả về true nếu là thành viên, ngược lại trả về false
  }
  async create(createBoardDto: CreateBoardDto, currentUserId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 0. Kiểm tra xem slug đã tồn tại trong workspace này chưa (hoặc toàn hệ thống tùy cấu trúc của bạn)
      const existingBoard = await queryRunner.manager.findOne(Board, {
        where: {
          slug: createBoardDto.slug,
          workspaceId: createBoardDto.workspaceId, // Thêm điều kiện này nếu slug chỉ cần unique trong cùng workspace
        },
      });

      if (existingBoard) {
        throw new ConflictException('tên đặt đã tồn tại hãy đặt tên khác');
      }

      // 1. Tạo và lưu Board
      const board = queryRunner.manager.create(Board, {
        title: createBoardDto.title,
        description: createBoardDto.description,
        workspaceId: createBoardDto.workspaceId,
        slug: createBoardDto.slug, // Lưu slug từ DTO
      });
      const savedBoard = await queryRunner.manager.save(board);

      // 2. Lấy danh sách ID từ DTO và lọc trùng lặp
      const memberIdsInput = createBoardDto.memberIds || [];
      const uniqueMemberIds = Array.from(new Set(memberIdsInput));

      // 3. Tìm WorkspaceMember khớp với WorkspaceMember.id HOẶC WorkspaceMember.userId
      let workspaceMembers: WorkspaceMember[] = [];

      if (uniqueMemberIds.length > 0) {
        workspaceMembers = await queryRunner.manager.find(WorkspaceMember, {
          where: [
            { id: In(uniqueMemberIds) }, // Khớp với id của bảng workspace_members
            { userId: In(uniqueMemberIds) }, // Khớp với user_id của bảng workspace_members
          ],
        });
      }

      // 4. Dùng Map<userId, role> để loại bỏ hoàn toàn trùng lặp userId
      const userRoleMap = new Map<string, BoardMemberRole>();

      // Ánh xạ các thành viên tìm được trong Workspace
      for (const wsMember of workspaceMembers) {
        const isLeader =
          createBoardDto.leaderId &&
          (wsMember.id === createBoardDto.leaderId ||
            wsMember.userId === createBoardDto.leaderId);

        const role = isLeader
          ? BoardMemberRole.BOARD_LEADER
          : BoardMemberRole.BOARD_MEMBER;
        userRoleMap.set(wsMember.userId, role);
      }

      // Luôn đảm bảo Người tạo (currentUserId) có mặt và mang quyền OWNER
      userRoleMap.set(currentUserId, BoardMemberRole.OWNER);

      // 5. Chuyển Map thành danh sách Entity BoardMember
      const boardMembersToSave = Array.from(userRoleMap.entries()).map(
        ([userId, role]) =>
          queryRunner.manager.create(BoardMember, {
            boardId: savedBoard.id,
            userId,
            role,
          }),
      );

      // 6. Lưu tất cả thành viên vào DB
      if (boardMembersToSave.length > 0) {
        await queryRunner.manager.save(BoardMember, boardMembersToSave);
      }

      await queryRunner.commitTransaction();
      return savedBoard;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Lấy danh sách các Board theo workspaceId
   */
  async findAllByWorkspace(workspaceId: string) {
    return this.boardRepository.find({
      where: { workspaceId },
      order: {
        createdAt: 'DESC',
        columns: {
          position: 'ASC',
          tasks: {
            position: 'ASC', // Sửa ở đây: lồng object thay vì dùng chuỗi 'columns.tasks'
          },
        },
      },
      relations: {
        columns: {
          tasks: {
            members: true,
            labels: true,
          },
        },
      },
      select: {
        id: true,
        title: true,
        background: true,
        columns: {
          id: true,
          title: true,
          lock_type: true,
          position: true,
          tasks: {
            id: true,
            title: true,
            dueDate: true,
            // Hoặc đếm qua relation _count nếu dùng Prisma/TypeORM

            members: {
              id: true,
              user: {
                image: true,
                name: true,
              },
            },
            labels: {
              id: true,
              title: true,
              color: true, // Dùng làm vạch màu nhãn
            },
          },
        },
      },
    });
  }

  /**
   * Lấy chi tiết 1 Board cùng danh sách Columns và Members
   */
  async findBoardByID(boardId: string, userId: string) {
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
        workspace: {
          members: {
            userId: userId,
          },
        },
      },
      relations: {
        workspace: {
          members: true,
        },
        members: {
          user: true,
        },
        columns: {
          tasks: {
            members: {
              user: true,
            },
            labels: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(
        'Board không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    const now = new Date().getTime();

    // --- SẮP XẾP VÀ DUYỆT CÁC COLUMN & TASK ---
    if (board.columns) {
      board.columns.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      for (const column of board.columns) {
        if (column.tasks) {
          column.tasks.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

          for (const task of column.tasks) {
            // Gán tiến độ (%)
            (task as any).progress = calculateDynamicProgress(
              task.startDate,
              task.dueDate,
            );

            // Gán thời gian còn lại
            (task as any).timeRemaining = calculateTimeRemaining(
              task.startDate,
              task.dueDate,
            );

            // --- KIỂM TRA NẾU TASK ĐÃ QUÁ HẠN ĐỂ GHI LOG ---
            if (task.dueDate) {
              const endTime = new Date(task.dueDate).getTime();

              if (now >= endTime && !task.isCompleted) {
                // 1. Kiểm tra xem trong DB đã có log 'TASK_OVERDUE' của task này chưa
                const existingLog = await this.activityLogRepository.findOne({
                  where: {
                    entityId: task.id,
                    action: 'TASK_OVERDUE',
                  },
                });

                // 2. Nếu chưa có thì mới tiến hành tạo log mới
                if (!existingLog) {
                  this.activityLogService
                    .create(userId, {
                      boardId: board.id,
                      action: 'TASK_OVERDUE',
                      entityType: 'TASK',
                      entityId: task.id,
                      details: {
                        title: task.title,
                        dueDate: task.dueDate,
                      },
                    })
                    .catch((err) => {
                      console.error('Lỗi ghi activity log quá hạn:', err);
                    });
                }
              }
            }
          }
        }
      }
    }

    return board;
  }

  /**
   * Cập nhật thông tin Board
   */
  async update(id: string, updateBoardDto: UpdateBoardDto) {
    const { memberIds, leaderId, ...boardData } = updateBoardDto;

    // 1. Tìm board hiện tại kèm theo danh sách thành viên cũ trong bảng board_members
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: {
        members: true, // Lấy các bản ghi trong bảng board_members
      },
    });

    if (!board) {
      throw new NotFoundException('Không tìm thấy Board để cập nhật');
    }

    // 2. Cập nhật các thông tin cơ bản của board (title, description, slug...)
    Object.assign(board, boardData);
    await this.boardRepository.save(board);

    // 3. Xử lý đồng bộ danh sách thành viên (memberIds) và phân quyền leaderId
    if (memberIds && Array.isArray(memberIds)) {
      const existingMembers = board.members || [];
      const existingUserIds = existingMembers.map((m) => m.userId);

      // A. Tìm các userId có trong cũ nhưng KHÔNG có trong danh sách mới -> Chuẩn bị XÓA
      const userIdsToRemove = existingUserIds.filter(
        (userId) => !memberIds.includes(userId),
      );

      if (userIdsToRemove.length > 0) {
        // 🟢 KIỂM TRA: Nếu thành viên chuẩn bị xóa vẫn đang tham gia task nào đó trong board thì báo lỗi
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const assignedTaskCount = await this.taskMemberRepository
          .createQueryBuilder('tm')
          .innerJoin('tm.task', 'task')
          .innerJoin('task.column', 'column')
          .where('column.boardId = :boardId', { boardId: id })
          .andWhere('tm.userId IN (:...userIdsToRemove)', { userIdsToRemove })
          .getCount();

        if (assignedTaskCount > 0) {
          throw new BadRequestException(
            'Không thể xóa thành viên đang tham gia task trong board. Vui lòng gỡ họ khỏi các task trước khi xóa khỏi board.',
          );
        }

        await this.boardMemberRepository.delete({
          boardId: id,
          userId: In(userIdsToRemove),
        });
      }

      // B. Tìm các userId có trong danh sách mới nhưng CHƯA có trong cũ -> THÊM MỚI
      const userIdsToAdd = memberIds.filter(
        (userId) => !existingUserIds.includes(userId),
      );

      if (userIdsToAdd.length > 0) {
        const newBoardMembers = userIdsToAdd.map((userId) => {
          const isLeader = userId === leaderId;
          return this.boardMemberRepository.create({
            boardId: id,
            userId: userId,
            role: isLeader
              ? BoardMemberRole.BOARD_LEADER
              : BoardMemberRole.BOARD_MEMBER,
          });
        });
        await this.boardMemberRepository.save(newBoardMembers);
      }

      // C. Cập nhật lại role cho các thành viên vẫn ở lại (phòng trường hợp đổi Leader)
      for (const member of existingMembers) {
        if (!userIdsToRemove.includes(member.userId)) {
          const shouldBeLeader = member.userId === leaderId;
          const targetRole = shouldBeLeader
            ? BoardMemberRole.BOARD_LEADER
            : BoardMemberRole.BOARD_MEMBER;

          if (member.role !== targetRole) {
            member.role = targetRole;
            await this.boardMemberRepository.save(member);
          }
        }
      }
    }

    // 4. Trả về board sau khi đã cập nhật kèm thông tin thành viên và user mới nhất
    return this.boardRepository.findOne({
      where: { id },
      relations: {
        members: {
          user: true,
        },
      },
    });
  }

  async getListMemberProject(boardId: string) {
    // 1. Kiểm tra board có tồn tại hay không và lấy luôn danh sách thành viên cùng thông tin user
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: {
        members: {
          user: true, // Lấy quan hệ user thông qua bảng trung gian board_members
        },
      },
      select: {
        id: true,
        title: true,
        members: {
          id: true,
          role: true,
          user: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Nếu board không tồn tại, ném lỗi ngay từ đầu
    if (!board) {
      throw new NotFoundException(`Không tìm thấy Board với ID: ${boardId}`);
    }

    // 2. Chuẩn hóa danh sách thành viên trả về
    const members = (board.members || []).map((bm) => ({
      memberId: bm.id,
      role: bm.role,
      ...bm.user,
    }));

    // 3. Trả về thông tin kết quả kèm tổng số lượng
    return {
      boardId: board.id,
      boardTitle: board.title,
      total: members.length, // Tổng số lượng thành viên trong board
      members, // Danh sách chi tiết thông tin user và role
    };
  }

  /**
   * Xóa Board theo ID
   */
  async remove(id: string, userId: string) {
    const board = await this.findBoardByID(id, userId);
    await this.boardRepository.remove(board);
    return { success: true, message: 'Đã xóa Board thành công' };
  }

  async checkIsOwnOrLeader(boardId: string, userId: string): Promise<boolean> {
    const member = await this.boardMemberRepository.findOne({
      where: {
        boardId,
        userId,
        role: In([BoardMemberRole.OWNER, BoardMemberRole.BOARD_LEADER]), // Kiểm tra role thuộc ADMIN hoặc LEADER
      },
    });

    return !!member; // Trả về true nếu tìm thấy, false nếu không tìm thấy
  }

  async getUserInBoardMember(id: string) {
    try {
      const member = await this.boardMemberRepository.findOne({
        where: {
          id,
        },
      });
      return member;
    } catch (error) {
      console.log('lỗi của getUserInBoardMember ', error);
    }
  }

  async getApproachingOverdueTasks(userId: string, days = 3) {
    const safeDays = Number.isFinite(days) && days > 0 ? days : 3;
    const now = new Date();
    const deadlineLimit = new Date(
      now.getTime() + safeDays * 24 * 60 * 60 * 1000,
    );

    // 1. Lấy các workspace mà user là OWNER hoặc LEADER của workspace
    const wsMembers = await this.workspaceMemberRepository
      .createQueryBuilder('wm')
      .where('wm.userId = :userId', { userId })
      .andWhere('LOWER(wm.role::text) IN (:...wsRoles)', {
        wsRoles: [
          'owner',
          'workspace_owner',
          'leader_workspace',
          'workspace_leader',
        ],
      })
      .getMany();

    const privilegedWorkspaceIds = Array.from(
      new Set(wsMembers.map((wm) => wm.workspaceId)),
    );

    // 2. Lấy các board mà user là OWNER hoặc BOARD_LEADER
    const boardMembers = await this.boardMemberRepository
      .createQueryBuilder('bm')
      .where('bm.userId = :userId', { userId })
      .andWhere('LOWER(bm.role::text) IN (:...boardRoles)', {
        boardRoles: ['owner', 'board_leader', 'leader'],
      })
      .getMany();

    const privilegedBoardIdsFromRole = Array.from(
      new Set(boardMembers.map((bm) => bm.boardId)),
    );

    if (
      privilegedWorkspaceIds.length === 0 &&
      privilegedBoardIdsFromRole.length === 0
    ) {
      return [];
    }

    // 3. Truy vấn các task ĐÃ QUÁ HẠN (dueDate <= now) hoặc SẮP ĐẾN HẠN (now < dueDate <= deadlineLimit)
    const qb = this.boardRepository
      .createQueryBuilder('board')
      .innerJoinAndSelect('board.workspace', 'workspace')
      .innerJoinAndSelect('board.columns', 'column')
      .innerJoinAndSelect('column.tasks', 'task')
      .leftJoinAndSelect('task.members', 'taskMember')
      .leftJoinAndSelect('taskMember.user', 'memberUser')
      .leftJoinAndSelect('task.labels', 'label')
      .where('board.deletedAt IS NULL')
      .andWhere('column.deletedAt IS NULL')
      .andWhere('task.deletedAt IS NULL')
      .andWhere('task.isCompleted = :isCompleted', { isCompleted: false })
      .andWhere('task.dueDate IS NOT NULL')
      .andWhere('task.dueDate <= :deadlineLimit', { deadlineLimit });

    if (
      privilegedWorkspaceIds.length > 0 &&
      privilegedBoardIdsFromRole.length > 0
    ) {
      qb.andWhere(
        '(board.workspaceId IN (:...wsIds) OR board.id IN (:...boardIds))',
        {
          wsIds: privilegedWorkspaceIds,
          boardIds: privilegedBoardIdsFromRole,
        },
      );
    } else if (privilegedWorkspaceIds.length > 0) {
      qb.andWhere('board.workspaceId IN (:...wsIds)', {
        wsIds: privilegedWorkspaceIds,
      });
    } else {
      qb.andWhere('board.id IN (:...boardIds)', {
        boardIds: privilegedBoardIdsFromRole,
      });
    }

    qb.orderBy('task.dueDate', 'ASC');

    const boards = await qb.getMany();

    // 4. Chuẩn hóa danh sách task (bao gồm cả quá hạn & sắp đến hạn)
    const result = [];
    const nowMs = now.getTime();

    for (const board of boards) {
      for (const column of board.columns || []) {
        for (const task of column.tasks || []) {
          if (!task.dueDate) continue;

          const dueMs = new Date(task.dueDate).getTime();
          const isOverdue = dueMs <= nowMs;
          const diffMs = Math.abs(dueMs - nowMs);

          const totalSeconds = Math.floor(diffMs / 1000);
          const remainingMinutes = Math.floor(diffMs / (1000 * 60));
          const remainingSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          const remainingHours = Math.ceil(diffMs / (1000 * 60 * 60));
          const remainingDays = Math.max(
            1,
            Math.ceil(diffMs / (1000 * 60 * 60 * 24)),
          );

          const prefix = isOverdue ? 'Quá hạn' : 'Còn';
          let remainingText = '';

          if (diffMs < 60 * 1000) {
            remainingText = `${prefix} ${remainingSeconds} giây`;
          } else if (diffMs < 60 * 60 * 1000) {
            remainingText =
              remainingSeconds > 0
                ? `${prefix} ${remainingMinutes} phút ${remainingSeconds} giây`
                : `${prefix} ${remainingMinutes} phút`;
          } else if (diffMs < 24 * 60 * 60 * 1000) {
            const hoursExact = Math.floor(diffMs / (1000 * 60 * 60));
            const minsInHour = Math.floor(
              (diffMs % (1000 * 60 * 60)) / (1000 * 60),
            );
            remainingText =
              minsInHour > 0
                ? `${prefix} ${hoursExact} giờ ${minsInHour} phút`
                : `${prefix} ${hoursExact} giờ`;
          } else {
            const daysExact = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hoursInDay = Math.floor(
              (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            remainingText =
              hoursInDay > 0
                ? `${prefix} ${daysExact} ngày ${hoursInDay} giờ`
                : `${prefix} ${daysExact} ngày`;
          }

          result.push({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate,
            isCompleted: task.isCompleted,
            isOverdue,
            statusType: isOverdue ? 'overdue' : 'approaching',
            totalSeconds,
            remainingMinutes,
            remainingSeconds,
            remainingHours,
            remainingDays,
            remainingText,
            urgentLevel: isOverdue || remainingHours <= 24 ? 'high' : 'medium',
            workspace: {
              id: board.workspace?.id ?? board.workspaceId,
              name: board.workspace?.name ?? '',
            },
            board: {
              id: board.id,
              title: board.title,
            },
            column: {
              id: column.id,
              title: column.title,
            },
            labels: task.labels || [],
            members: (task.members || []).map((tm) => ({
              id: tm.id,
              userId: tm.userId,
              role: tm.role,
              user: tm.user
                ? {
                    id: tm.user.id,
                    name: tm.user.name,
                    email: tm.user.email,
                    image: tm.user.image,
                  }
                : null,
            })),
          });
        }
      }
    }

    // Sắp xếp task quá hạn lên trước (cũ nhất/trễ nhất trước), sau đó đến task sắp hết hạn gần nhất
    result.sort(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }
}
