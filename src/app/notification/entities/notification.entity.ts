import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { User } from 'src/app/user/entities/user.entity'; // Đường dẫn đến User entity
import { Workspace } from 'src/app/workspace/entities/workspace.entity';
import { Board } from 'src/app/board/entities/board.entity';
import { Task } from 'src/app/task/entities/task.entity'; // Đường dẫn đến Task entity

// 1. Phân loại nội dung/sự kiện thông báo
export enum NotificationType {
  WORKSPACE_INVITE = 'WORKSPACE_INVITE', // Lời mời tham gia Workspace (có nút Chấp nhận/Từ chối)
  WORKSPACE_ACTIVITY = 'WORKSPACE_ACTIVITY', // Hoạt động chung trong Workspace
  BOARD_CREATE = 'BOARD_CREATE', // Tạo Board mới trong Workspace
  TASK_ASSIGN = 'TASK_ASSIGN', // Được giao Task mới
  TASK_DUE_SOON = 'TASK_DUE_SOON', // Task sắp đến hạn
  CHAT_MENTION = 'CHAT_MENTION', // Được nhắc đến trong thảo luận/chat
  SYSTEM = 'SYSTEM', // Thông báo hệ thống
}

// 2. Phân loại đối tượng/phạm vi nhận thông báo
export enum NotificationScope {
  WORKSPACE = 'WORKSPACE', // Gửi cho tất cả thành viên thuộc Workspace này
  BOARD = 'BOARD', // Gửi cho tất cả thành viên thuộc Board này
  TASK = 'TASK', // Gửi cho người tạo & những người được phân công trong Task này
  DIRECT = 'DIRECT', // Gửi trực tiếp 1-1 cho 1 User cụ thể (ví dụ: Lời mời, Tag tên)
}

@Entity('notifications')
export class Notification extends BaseUuidEntity {
  // Người nhận thông báo
  @Column({ type: 'uuid' })
  @Index()
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  // Người thực hiện hành động (VD: Alex Rivera) - Null nếu là thông báo hệ thống
  @Column({ type: 'uuid', nullable: true })
  senderId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: User | null;

  // Loại hành động thông báo
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  // Phạm vi gửi thông báo (Workspace / Board / Task / Direct)
  @Column({
    type: 'enum',
    enum: NotificationScope,
    default: NotificationScope.DIRECT,
  })
  scope: NotificationScope;

  // -------------------------------------------------------------
  // Mối quan hệ Foreign Key (Dynamic references)
  // Giúp thông báo luôn tự cập nhật tên mới nhất của Workspace/Board/Task
  // -------------------------------------------------------------

  @Column({ type: 'uuid', nullable: true })
  workspaceId: string | null;

  @ManyToOne(() => Workspace, {
    onDelete: 'CASCADE',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace | null;

  @Column({ type: 'uuid', nullable: true })
  boardId: string | null;

  @ManyToOne(() => Board, { onDelete: 'CASCADE', nullable: true, eager: true })
  @JoinColumn({ name: 'boardId' })
  board: Board | null;

  @Column({ type: 'uuid', nullable: true })
  taskId: string | null;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true, eager: true })
  @JoinColumn({ name: 'taskId' })
  task: Task | null;

  // -------------------------------------------------------------

  // Trạng thái đã đọc hay chưa
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  // Metadata lưu thông tin phụ tùy biến dạn JSON (VD: trạng thái mời ACCEPTED/REJECTED, nội dung chat snippet, ...)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
