import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { ActivityLogService } from './activity-log.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogDto } from './dto/query-activity-log.dto';
import { SessionAuthGuard } from 'src/core/guards/session-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@UseGuards(SessionAuthGuard)
@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Post()
  @ApiOperation({ summary: 'Ghi lại lịch sử hoạt động mới' })
  create(
    @CurrentUser() user: User,
    @Body() createActivityLogDto: CreateActivityLogDto,
  ) {
    return this.activityLogService.create(user.id, createActivityLogDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách lịch sử hoạt động (Có thể lọc theo boardId)',
  })
  findAll(@Query() query: QueryActivityLogDto) {
    return this.activityLogService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bản ghi lịch sử theo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.activityLogService.findOne(id);
  }
}
