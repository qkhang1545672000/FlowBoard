import {
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

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Tạo mới 1 Board và tự động thêm User tạo vào làm ADMIN của Board đó
   */
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
    // Tìm board kèm theo điều kiện user phải là thành viên của Workspace (hoặc thành viên của Board)
    const board = await this.boardRepository.findOne({
      where: {
        id: boardId,
        workspace: {
          members: {
            userId: userId, // Kiểm tra User hiện tại có nằm trong Workspace chứa Board này không
          },
        },
      },
      relations: {
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
      // Thêm sắp xếp thứ tự cho Column và Task
      order: {
        columns: {
          position: 'ASC',
          tasks: {
            position: 'ASC',
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(
        'Board không tồn tại hoặc bạn không có quyền truy cập',
      );
    }

    // --- DUYỆT QUA CÁC COLUMN VÀ TASK ĐỂ GÁN PROGRESS DỰA TRÊN startDate & dueDate ---
    if (board.columns) {
      board.columns.forEach((column) => {
        if (column.tasks) {
          column.tasks.forEach((task) => {
            // Gán tiến độ (%) dựa vào startDate và dueDate
            (task as any).progress = calculateDynamicProgress(
              task.startDate,
              task.dueDate,
            );

            // Gán thời gian còn lại dạng chữ dựa vào dueDate
            (task as any).timeRemaining = calculateTimeRemaining(
              task.startDate,
              task.dueDate,
            );
          });
        }
      });
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

      // A. Tìm các userId có trong cũ nhưng KHÔNG có trong danh sách mới -> XÓA
      const userIdsToRemove = existingUserIds.filter(
        (userId) => !memberIds.includes(userId),
      );

      if (userIdsToRemove.length > 0) {
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
            // Lưu ý: Thay BoardMemberRole bằng tên enum thực tế của bạn nếu khác (ví dụ: LEADER, MEMBER)
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
}
