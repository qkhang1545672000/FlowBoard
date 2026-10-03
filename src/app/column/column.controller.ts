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
import { ColumnService } from './column.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from '../board/dto/update-column.dto';
import { SessionAuthGuard } from 'src/core/guards/session-auth.guard';

@UseGuards(SessionAuthGuard)
@ApiTags('Columns')
@ApiBearerAuth()
@Controller('columns')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới một Column' })
  create(@Body() createColumnDto: CreateColumnDto) {
    return this.columnService.create(createColumnDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Column theo Board ID' })
  @ApiQuery({ name: 'boardId', required: true, type: String })
  findAllByBoard(@Query('boardId', ParseUUIDPipe) boardId: string) {
    return this.columnService.findAllByBoard(boardId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Column theo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.columnService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin Column' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateColumnDto: UpdateColumnDto,
  ) {
    return this.columnService.update(id, updateColumnDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một Column (Xóa mềm)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.columnService.remove(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Khôi phục Column đã xóa' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.columnService.restore(id);
  }
}
