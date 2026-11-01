import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationScope,
  NotificationType,
} from './entities/notification.entity';
import { WorkspaceMember } from 'src/app/workspace/entities/workspace-member.entity';
import { BoardMember } from 'src/app/board/entities/board-member.entity'; // Đường dẫn tới BoardMember entity của bạn
import { Task } from 'src/app/task/entities/task.entity';
import { TaskMember } from '../task/entities/task-member.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(BoardMember)
    private readonly boardMemberRepository: Repository<BoardMember>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,

    @InjectRepository(TaskMember) // 👈 Thay Task bằng TaskMember repository ở đây
    private readonly taskMemberRepository: Repository<TaskMember>,
  ) {}

  // 1. Lấy danh sách thông báo của user kèm phân trang/lọc
  async getUserNotifications(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 20, // Giới hạn 20 thông báo gần nhất
    });

    return notifications.map((notif) => this.mapNotificationToResponse(notif));
  }

  // 2. Đánh dấu một thông báo là đã đọc
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  // 3. Đánh dấu tất cả là đã đọc
  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  // 4. Hàm cốt lõi: Tạo thông báo phân phối theo Scope (Workspace / Board / Task / Direct)
  async createNotificationForScope(payload: {
    senderId?: string;
    type: NotificationType;
    scope: NotificationScope;
    workspaceId?: string;
    boardId?: string;
    taskId?: string;
    specificUserId?: string; // Dùng cho trường hợp DIRECT (VD: mời riêng 1 người)
    metadata?: Record<string, any>;
  }) {
    let recipientIds: string[] = [];

    switch (payload.scope) {
      case NotificationScope.DIRECT:
        if (payload.specificUserId) {
          recipientIds = [payload.specificUserId];
        }
        break;

      case NotificationScope.WORKSPACE:
        if (payload.workspaceId) {
          recipientIds = await this.getWorkspaceMemberIds(
            payload.workspaceId,
            payload.senderId,
          );
        }
        break;

      case NotificationScope.BOARD:
        if (payload.boardId) {
          recipientIds = await this.getBoardMemberIds(
            payload.boardId,
            payload.senderId,
          );
        }
        break;

      case NotificationScope.TASK:
        if (payload.taskId) {
          recipientIds = await this.getTaskMemberIds(
            payload.taskId,
            payload.senderId,
          );
        }
        break;
    }

    if (recipientIds.length === 0) return;

    // Bulk Insert vào database cho tất cả người nhận hợp lệ
    const notificationEntities = recipientIds.map((recipientId) =>
      this.notificationRepository.create({
        recipientId,
        senderId: payload.senderId || null,
        type: payload.type,
        scope: payload.scope,
        workspaceId: payload.workspaceId || null,
        boardId: payload.boardId || null,
        taskId: payload.taskId || null,
        metadata: payload.metadata || null,
      }),
    );

    const savedNotifications =
      await this.notificationRepository.save(notificationEntities);

    // TODO: Nếu bạn dùng Socket.io Gateway, có thể bắn sự kiện real-time ở đây cho từng user:
    // savedNotifications.forEach(notif => this.socketGateway.sendToUser(notif.recipientId, 'new_notification', this.mapNotificationToResponse(notif)));

    return savedNotifications;
  }

  // --- Các hàm phụ trợ lấy danh sách thành viên ---
  private async getWorkspaceMemberIds(
    workspaceId: string,
    excludeSenderId?: string,
  ): Promise<string[]> {
    const members = await this.workspaceMemberRepository.find({
      where: { workspaceId },
      select: {
        userId: true,
      },
    });
    return members.map((m) => m.userId).filter((id) => id !== excludeSenderId);
  }

  private async getBoardMemberIds(
    boardId: string,
    excludeSenderId?: string,
  ): Promise<string[]> {
    const members = await this.boardMemberRepository.find({
      where: { boardId },
      select: {
        userId: true,
      },
    });
    return members.map((m) => m.userId).filter((id) => id !== excludeSenderId);
  }

  private async getTaskMemberIds(
    taskId: string,
    excludeSenderId?: string,
  ): Promise<string[]> {
    // Truy vấn trực tiếp từ bảng task_members để lấy tất cả userId liên quan đến task này
    const taskMembers = await this.taskMemberRepository.find({
      where: { taskId },
      select: {
        userId: true,
      },
    });

    const recipientIds = new Set<string>();

    // Thêm tất cả các thành viên có trong task_members vào danh sách nhận
    taskMembers.forEach((member) => {
      if (member.userId) {
        recipientIds.add(member.userId);
      }
    });

    // Nếu task entity có lưu người tạo (createdById), bạn có thể gộp thêm vào đây nếu cần:
    // const task = await this.taskRepository.findOne({ where: { id: taskId }, select: ['createdById'] });
    // if (task?.createdById) recipientIds.add(task.createdById);

    // Loại trừ người gửi hành động (sender) ra khỏi danh sách nhận thông báo
    if (excludeSenderId) {
      recipientIds.delete(excludeSenderId);
    }

    return Array.from(recipientIds);
  }

  // --- Mapper giúp cập nhật tên động (Workspace, Board, Task) realtime ---
  private mapNotificationToResponse(notif: Notification) {
    let dynamicTitle = '';
    const senderName = notif.sender?.name || 'Ai đó';
    const wsName = notif.workspace?.name || 'Workspace';

    switch (notif.type) {
      case NotificationType.WORKSPACE_INVITE:
        dynamicTitle = `${senderName} đã mời bạn tham gia Workspace '${wsName}'`;
        break;

      case NotificationType.BOARD_CREATE:
        dynamicTitle = `Thành viên trong ${wsName} vừa tạo board mới`;
        break;

      case NotificationType.TASK_ASSIGN:
        // eslint-disable-next-line no-case-declarations
        const taskTitle = notif.task?.title || 'Công việc';
        dynamicTitle = `Bạn được phân công vào task '${taskTitle}'`;
        break;

      case NotificationType.CHAT_MENTION:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-case-declarations
        const snippet = notif.metadata?.messageSnippet || '';
        dynamicTitle = `${senderName} đã nhắc đến bạn: '${snippet}'`;
        break;

      case NotificationType.SYSTEM:
      default:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        dynamicTitle =
          notif.metadata?.customTitle || 'Thông báo mới từ hệ thống';
        break;
    }

    // Ánh xạ type sang format FE của bạn ('workspace', 'chat', 'task', 'invite', 'system')
    let feType = 'activity';
    if (notif.type === NotificationType.CHAT_MENTION) feType = 'chat';
    else if (
      notif.type === NotificationType.TASK_ASSIGN ||
      notif.type === NotificationType.TASK_DUE_SOON
    )
      feType = 'task';
    else if (notif.type === NotificationType.WORKSPACE_INVITE)
      feType = 'invite';
    else if (
      notif.type === NotificationType.BOARD_CREATE ||
      notif.type === NotificationType.WORKSPACE_ACTIVITY
    )
      feType = 'workspace';
    else feType = 'system';

    return {
      id: notif.id,
      type: feType,
      title: dynamicTitle, // 👈 Luôn cập nhật tên mới nhất của WS/Board/Task
      time: this.formatTimeAgo(notif.createdAt),
      unread: !notif.isRead,
      workspaceId: notif.workspaceId,
      boardId: notif.boardId,
      taskId: notif.taskId,
    };
  }

  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000,
    );
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }
}
