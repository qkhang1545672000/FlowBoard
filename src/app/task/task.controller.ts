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
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { SessionAuthGuard } from 'src/core/guards/session-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { AssignTaskDto } from './dto/AssignTask.dto';

@UseGuards(SessionAuthGuard)
@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới một Task' })
  create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: User) {
    return this.taskService.create(createTaskDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Task theo Column ID' })
  @ApiQuery({ name: 'columnId', required: true, type: String })
  findAllByColumn(@Query('columnId', ParseUUIDPipe) columnId: string) {
    return this.taskService.findAllByColumn(columnId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết Task theo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.findOne(id);
  }
  @Patch(':id/assign')
  @ApiOperation({
    summary: 'Gán danh sách thành viên và phân quyền Leader cho Task',
  })
  assignMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignTaskDto: AssignTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.taskService.addMemberForTask(
      id,
      assignTaskDto.userIds,
      user.id,
      assignTaskDto.leaderId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin Task' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Patch(':id/move')
  @ApiOperation({
    summary: 'Kéo thả / Di chuyển Task sang cột hoặc vị trí mới',
  })
  move(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() moveTaskDto: MoveTaskDto,
  ) {
    return this.taskService.move(id, moveTaskDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một Task (Xóa mềm)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.taskService.remove(id, user);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Khôi phục Task đã xóa' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.taskService.restore(id);
  }
}
