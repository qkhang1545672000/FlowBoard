import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository, Brackets } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { ChatScope } from 'src/shared/types/chat-scope.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createMessage(
    senderId: string,
    dto: CreateMessageDto,
    files?: Express.Multer.File[],
  ): Promise<Message> {
    const { scope, workspaceId, boardId, taskId, recipientId, content } = dto;

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
    // 🟢 Validate thêm cho DIRECT scope
    if (scope === ChatScope.DIRECT && !recipientId) {
      throw new BadRequestException('recipientId is required for DIRECT scope');
    }

    let uploadedAttachments = [];

    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        this.cloudinaryService.uploadFile(file),
      );
      const uploadResults = await Promise.all(uploadPromises);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      const fileUrls = uploadResults.map((res: any) => res.secure_url);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      uploadedAttachments = [...fileUrls];
    }

    const message = this.messageRepo.create({
      senderId,
      scope,
      workspaceId: scope === ChatScope.WORKSPACE ? workspaceId : null,
      boardId: scope === ChatScope.BOARD ? boardId : null,
      taskId: scope === ChatScope.TASK ? taskId : null,
      recipientId: scope === ChatScope.DIRECT ? recipientId : null, // 🟢 Gán recipientId nếu là chat 1-1
      content,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null,
    });

    const savedMessage = await this.messageRepo.save(message);

    // Query lại kèm thông tin sender và recipient tối giản cho response & socket payload
    const fullMessage = await this.messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: {
        sender: true,
        recipient: true, // 🟢 Load thêm relation recipient
      },
      select: {
        id: true,
        content: true,
        attachments: true,
        scope: true,
        workspaceId: true,
        boardId: true,
        taskId: true,
        recipientId: true, // 🟢 Select thêm recipientId
        createdAt: true,
        sender: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
        recipient: {
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
    const { scope, targetId, limit = 20, cursor } = query;

    const takeLimit = Number(limit) + 1;
    let items: Message[] = [];

    // 🟢 Xử lý điều kiện truy vấn riêng cho DIRECT (Chat 1-1 giữa userId hiện tại và targetId)
    if (scope === ChatScope.DIRECT) {
      if (!userId) {
        throw new BadRequestException(
          'userId is required to query DIRECT messages',
        );
      }

      const qb = this.messageRepo
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.recipient', 'recipient')
        .where('message.scope = :scope', { scope: ChatScope.DIRECT })
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              '(message.senderId = :userId AND message.recipientId = :targetId)',
              { userId, targetId },
            ).orWhere(
              '(message.senderId = :targetId AND message.recipientId = :userId)',
              { userId, targetId },
            );
          }),
        );

      if (cursor) {
        qb.andWhere('message.createdAt < :cursor', {
          cursor: new Date(cursor),
        });
      }

      items = await qb
        .orderBy('message.createdAt', 'DESC')
        .take(takeLimit)
        .getMany();
    } else {
      // Xử lý thông thường cho WORKSPACE, BOARD, TASK
      const whereCondition: any = { scope };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (scope === ChatScope.TASK) whereCondition.taskId = targetId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (scope === ChatScope.BOARD) whereCondition.boardId = targetId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (scope === ChatScope.WORKSPACE) whereCondition.workspaceId = targetId;

      if (cursor) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        whereCondition.createdAt = LessThan(new Date(cursor));
      }

      items = await this.messageRepo.find({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: whereCondition,
        relations: { sender: true },
        select: {
          id: true,
          content: true,
          attachments: true,
          scope: true,
          workspaceId: true,
          boardId: true,
          taskId: true,
          recipientId: true,
          createdAt: true,
          sender: { id: true, name: true, email: true, image: true },
        },
        order: { createdAt: 'DESC' },
        take: takeLimit,
      });
    }

    let nextCursor: string | null = null;
    let hasMore = false;

    if (items.length > Number(limit)) {
      hasMore = true;
      items.pop(); // Bỏ phần tử thừa dùng để check
      const lastItem = items[items.length - 1];
      nextCursor = lastItem.createdAt.toISOString();
    }

    return {
      items: items.reverse(), // Đảo lại theo thứ tự cũ -> mới cho UI chat
      nextCursor,
      hasMore,
    };
  }
}
