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
import { SubTaskService } from './sub-task.service';
import { CreateSubTaskDto } from './dto/create-sub-task.dto';
import { UpdateSubTaskDto } from './dto/update-sub-task.dto';
import { SessionAuthGuard } from 'src/core/guards/session-auth.guard';

@UseGuards(SessionAuthGuard)
@ApiTags('SubTasks')
@ApiBearerAuth()
@Controller('sub-tasks')
export class SubTaskController {
  constructor(private readonly subTaskService: SubTaskService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách công việc con theo Task ID' })
  @ApiQuery({ name: 'taskId', required: true, type: String })
  findAllByTask(@Query('taskId', ParseUUIDPipe) taskId: string) {
    return this.subTaskService.findAllByTask(taskId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới một công việc con' })
  create(@Body() dto: CreateSubTaskDto) {
    return this.subTaskService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật công việc con (thời gian, trạng thái, tên, người làm)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubTaskDto,
  ) {
    return this.subTaskService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một công việc con' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subTaskService.remove(id);
  }
}
