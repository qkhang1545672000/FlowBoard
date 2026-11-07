import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from '../column/dto/update-board.dto';

import { CurrentUser } from 'src/shared/decorators/current-user.decorator'; // Decorator lấy User từ request
import { SessionAuthGuard } from 'src/core/guards/session-auth.guard';
import { User } from '../user/entities/user.entity';
import { WorkspaceService } from '../workspace/workspace.service';
@UseGuards(SessionAuthGuard)
@ApiTags('Boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới một Board' })
  create(@Body() createBoardDto: CreateBoardDto, @CurrentUser() user: User) {
    return this.boardService.create(createBoardDto, user.id);
  }

  // @Get(':workspaceId')
  // @ApiOperation({ summary: 'Lấy danh sách Board theo Workspace ID' })
  // findAllByWorkspace(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
  //   return this.boardService.findAllByWorkspace(workspaceId);
  // }

  @Get(':boardId')
  @ApiOperation({ summary: 'Lấy chi tiết Board theo ID' })
  async findBoardByID(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @CurrentUser() user: User, // Lấy userId từ Session/JWT
  ) {
    const isCheckMemberBoard = await this.boardService.isCheckMemberBoard(
      boardId,
      user.id,
    );
    if (!isCheckMemberBoard) {
      throw new ForbiddenException(
        'Bạn không phải là thành viên của board này nên không có quyền thực hiện thao tác.',
      );
    }
    return this.boardService.findBoardByID(boardId, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin Board' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    const isOwn = await this.workspaceService.checkIsOwnOrLeaderWorkspace(
      updateBoardDto.workspaceId,
      user.id,
    );
    if (!isOwn) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện thao tác này!',
      );
    }
    return this.boardService.update(id, updateBoardDto);
  }
  @Get(':boardId/members')
  @ApiOperation({
    summary: 'Lấy danh sách và tổng số lượng thành viên trong Board',
  })
  getListMemberProject(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @CurrentUser() user: User, // Đảm bảo đã xác thực người dùng qua JWT/Session
  ) {
    return this.boardService.getListMemberProject(boardId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một Board' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.boardService.remove(id, user.id);
  }
}
