import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

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

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Board theo Workspace ID' })
  @ApiQuery({ name: 'workspaceId', required: true, type: String })
  findAllByWorkspace(@Query('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.boardService.findAllByWorkspace(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Board theo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.boardService.findOne(id);
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.boardService.remove(id);
  }
}
