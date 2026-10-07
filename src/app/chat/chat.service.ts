import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { ChatScope } from 'src/shared/types/chat-scope.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
  ) {}

  async createMessage(
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<Message> {
    const { scope, workspaceId, boardId, taskId, content, attachments } = dto;

    // Validate khớp Scope
    if (scope === ChatScope.TASK && !taskId) {
      throw new BadRequestException('taskId is required for TASK scope');
    }
    if (scope === ChatScope.BOARD && !boardId) {
      throw new BadRequestException('boardId is required for BOARD scope');
    }
    if (scope === ChatScope.WORKSPACE && !workspaceId) {
      throw new BadRequestException(
        'workspaceId is required for WORKSPACE scope',
      );
    }

    const message = this.messageRepo.create({
      senderId,
      scope,
      workspaceId: scope === ChatScope.WORKSPACE ? workspaceId : null,
      boardId: scope === ChatScope.BOARD ? boardId : null,
      taskId: scope === ChatScope.TASK ? taskId : null,
      content,
      attachments: attachments || null,
    });

    const savedMessage = await this.messageRepo.save(message);

    // Query lại kèm thông tin sender tối giản cho response & socket payload
    const fullMessage = await this.messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: {
        sender: true,
      },
      select: {
        id: true,
        content: true,
        attachments: true,
        scope: true,
        workspaceId: true,
        boardId: true,
        taskId: true,
        createdAt: true,
        sender: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    });

    if (!fullMessage) {
      throw new NotFoundException('Tin nhắn vừa tạo không tồn tại');
    }

    return fullMessage;
  }

  async getMessages(query: QueryMessageDto, userId?: string) {
    const { scope, targetId, limit = 20, page = 1 } = query;
    const skip = (page - 1) * limit;

    const whereCondition: any = { scope };

    if (scope === ChatScope.TASK) whereCondition.taskId = targetId;
    if (scope === ChatScope.BOARD) whereCondition.boardId = targetId;
    if (scope === ChatScope.WORKSPACE) whereCondition.workspaceId = targetId;

    const [items, total] = await this.messageRepo.findAndCount({
      where: whereCondition,
      relations: {
        sender: true,
      },
      select: {
        id: true,
        content: true,
        attachments: true,
        scope: true,
        workspaceId: true,
        boardId: true,
        taskId: true,
        createdAt: true,
        sender: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      order: { createdAt: 'DESC' }, // Lấy tin nhắn mới nhất trước để phân trang
      take: limit,
      skip,
    });

    return {
      items: items.reverse(), // Đảo ngược lại thứ tự cũ -> mới cho UI Chat
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
