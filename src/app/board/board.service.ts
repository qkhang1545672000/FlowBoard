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

      // 2. Lấy danh sách WorkspaceMember IDs từ DTO
      const memberIdsInput = createBoardDto.memberIds || [];
      const uniqueMemberIds = Array.from(new Set(memberIdsInput));

      // 3. Tìm các bản ghi WorkspaceMember trong DB để lấy ra userId thực tế
      const workspaceMembers = await queryRunner.manager.find(WorkspaceMember, {
        where: { id: In(uniqueMemberIds) },
      });

      const boardMembersToSave: BoardMember[] = [];

      // Map lưu thông tin để kiểm tra Leader dựa vào WorkspaceMember ID
      for (const wsMember of workspaceMembers) {
        let role = BoardMemberRole.MEMBER;

        // Nếu workspaceMember này được chỉ định làm Leader
        if (
          createBoardDto.leaderId &&
          wsMember.id === createBoardDto.leaderId
        ) {
          role = BoardMemberRole.LEADER;
        }

        const memberRecord = queryRunner.manager.create(BoardMember, {
          boardId: savedBoard.id,
          userId: wsMember.id, // ✅ Truyền đúng userId bắt buộc
          role,
        });

        boardMembersToSave.push(memberRecord);
      }

      // 4. Luôn đảm bảo Người tạo Board (currentUserId) được thêm làm ADMIN/OWNER nếu chưa có trong danh sách
      const isOwnerAdded = boardMembersToSave.some(
        (m) => m.userId === currentUserId,
      );

      if (!isOwnerAdded) {
        boardMembersToSave.push(
          queryRunner.manager.create(BoardMember, {
            boardId: savedBoard.id,
            userId: currentUserId, // ✅ Gán userId của người tạo
            role: BoardMemberRole.ADMIN,
          }),
        );
      }

      // 5. Lưu toàn bộ danh sách thành viên Board
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
