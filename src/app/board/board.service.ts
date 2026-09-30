import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardMemberRole } from 'src/shared/types/BoardMemberRole.enum';
import { WorkspaceMember } from '../workspace/entities/workspace-member.entity';

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
      // 1. Tạo và lưu Board
      const board = queryRunner.manager.create(Board, {
        title: createBoardDto.title,
        description: createBoardDto.description,
        workspaceId: createBoardDto.workspaceId,
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

        const role = isLeader ? BoardMemberRole.LEADER : BoardMemberRole.MEMBER;
        userRoleMap.set(wsMember.userId, role);
      }

      // Luôn đảm bảo Người tạo (currentUserId) có mặt và mang quyền ADMIN
      userRoleMap.set(currentUserId, BoardMemberRole.ADMIN);

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
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy chi tiết 1 Board cùng danh sách Columns và Members
   */
  async findOne(id: string) {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: {
        columns: {
          tasks: true, // Lấy quan hệ nested: Board -> Columns -> Tasks
        },
        members: {
          user: true, // Lấy quan hệ nested: Board -> Members -> User
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Không tìm thấy Board');
    }

    return board;
  }

  /**
   * Cập nhật thông tin Board
   */
  async update(id: string, updateBoardDto: UpdateBoardDto) {
    const board = await this.boardRepository.preload({
      id,
      ...updateBoardDto,
    });

    if (!board) {
      throw new NotFoundException('Không tìm thấy Board để cập nhật');
    }

    return this.boardRepository.save(board);
  }

  /**
   * Xóa Board theo ID
   */
  async remove(id: string) {
    const board = await this.findOne(id);
    await this.boardRepository.remove(board);
    return { success: true, message: 'Đã xóa Board thành công' };
  }
}
