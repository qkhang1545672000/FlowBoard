import {
  Controller,
  Get,
  Post,
  Body,
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
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { SessionAuthGuard } from 'src/core/guards/session-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@UseGuards(SessionAuthGuard)
@ApiTags('Chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi tin nhắn mới (Workspace, Board hoặc Task)' })
  sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
  ) {
    return this.chatService.createMessage(user.id, createMessageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn theo Scope và Target ID' })
  @ApiQuery({
    name: 'scope',
    enum: ['WORKSPACE', 'BOARD', 'TASK'],
    description: 'Phạm vi chat',
  })
  @ApiQuery({
    name: 'targetId',
    description: 'ID của Workspace, Board hoặc Task tương ứng',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getMessages(@Query() query: QueryMessageDto, @CurrentUser() user: User) {
    return this.chatService.getMessages(query, user.id);
  }
}
