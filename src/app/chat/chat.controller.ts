import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
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
import { FilesInterceptor } from '@nestjs/platform-express';

@UseGuards(SessionAuthGuard)
@ApiTags('Chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Gửi tin nhắn mới (Workspace, Board hoặc Task)' })
  sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.chatService.createMessage(user.id, createMessageDto, files);
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
