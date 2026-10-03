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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from '../column/dto/update-board.dto';

import { CurrentUser } from 'src/shared/decorators/current-user.decorator'; // Decorator lấy User từ request
import { SessionAuthGuard } from 'src/core/guards/session-auth.guard';
import { User } from '../user/entities/user.entity';
@UseGuards(SessionAuthGuard)
@ApiTags('Boards')
@ApiBearerAuth()
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

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
  findBoardByID(
    @Param('boardId', ParseUUIDPipe) boardId: string,
    @CurrentUser() user: User, // Lấy userId từ Session/JWT
  ) {
    return this.boardService.findBoardByID(boardId, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin Board' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardService.update(id, updateBoardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một Board' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.boardService.remove(id, user.id);
  }
}
