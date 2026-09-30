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

      // 2. Lấy danh sách WorkspaceMember IDs từ DTO và lọc trùng
      const memberIdsInput = createBoardDto.memberIds || [];
      const uniqueWsMemberIds = Array.from(new Set(memberIdsInput));

      // 3. ĐÃ SỬA: Tìm WorkspaceMember theo ID của bảng WorkspaceMember (`id`)
      let workspaceMembers: WorkspaceMember[] = [];
      if (uniqueWsMemberIds.length > 0) {
        workspaceMembers = await queryRunner.manager.find(WorkspaceMember, {
          where: { id: In(uniqueWsMemberIds) },
        });
      }

      // Map chứa danh sách các userId nguyên bản để tránh trùng lặp
      // Key: userId, Value: role
      const userRoleMap = new Map<string, BoardMemberRole>();

      // Gán role cho các thành viên được chọn từ workspace
      for (const wsMember of workspaceMembers) {
        // Nếu member này là Leader (kiểm tra theo wsMember.id hoặc wsMember.userId)
        const isLeader =
          createBoardDto.leaderId &&
          (wsMember.id === createBoardDto.leaderId ||
            wsMember.userId === createBoardDto.leaderId);

        const role = isLeader ? BoardMemberRole.LEADER : BoardMemberRole.MEMBER;
        userRoleMap.set(wsMember.userId, role);
      }

      // 4. BẮT BUỘC: Đảm bảo Người tạo (currentUserId) luôn có mặt với quyền ADMIN
      // (Nếu đã có sẵn từ trước thì override thành ADMIN)
      userRoleMap.set(currentUserId, BoardMemberRole.ADMIN);

      // 5. Chuyển Map thành mảng Entity để lưu vào DB (Đảm bảo mỗi userId chỉ xuất hiện đúng 1 lần)
      const boardMembersToSave = Array.from(userRoleMap.entries()).map(
        ([userId, role]) =>
          queryRunner.manager.create(BoardMember, {
            boardId: savedBoard.id,
            userId,
            role,
          }),
      );

      // 6. Lưu toàn bộ danh sách thành viên Board
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
