import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { BoardMember } from './entities/board-member.entity';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardMemberRole } from 'src/shared/types/BoardMemberRole.enum';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
  ) {}

  /**
   * Tạo mới 1 Board và tự động thêm User tạo vào làm ADMIN của Board đó
   */
  async create(createBoardDto: CreateBoardDto, userId: string) {
    // 1. Khởi tạo và lưu Board
    const board = this.boardRepository.create({
      title: createBoardDto.title,
      workspaceId: createBoardDto.workspaceId,
    });
    const savedBoard = await this.boardRepository.save(board);

    // 2. Thêm người tạo vào làm ADMIN trong bảng board_members
    const boardMember = this.boardMemberRepository.create({
      boardId: savedBoard.id,
      userId,
      role: BoardMemberRole.ADMIN,
    });
    await this.boardMemberRepository.save(boardMember);

    return savedBoard;
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
