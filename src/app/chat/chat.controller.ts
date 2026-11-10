import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
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
import { ChatGateway } from './chat.gateway'; // 🟢 Import ChatGateway

@UseGuards(SessionAuthGuard)
@ApiTags('Chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway, // 🟢 Inject ChatGateway vào Controller
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  @ApiOperation({ summary: 'Gửi tin nhắn mới (Workspace, Board hoặc Task)' })
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: User,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // 1. Lưu tin nhắn và upload file lên Cloudinary
    const savedMessage = await this.chatService.createMessage(
      user.id,
      createMessageDto,
      files,
    );

    // 2. Xác định targetId và Room tương ứng để Broadcast Realtime
    const targetId =
      createMessageDto.taskId ||
      createMessageDto.boardId ||
      createMessageDto.workspaceId;

    if (targetId && createMessageDto.scope) {
      const roomName = `chat:${createMessageDto.scope.toLowerCase()}:${targetId}`;

      // 🟢 BẮT BUỘC: Gửi sự kiện new-message ra toàn bộ phòng qua WebSocket để user2 nhận được file/ảnh ngay lập tức
      this.chatGateway.server.to(roomName).emit('new-message', savedMessage);
    }

    return savedMessage;
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
