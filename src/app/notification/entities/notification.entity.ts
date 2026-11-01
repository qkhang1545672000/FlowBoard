import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { User } from 'src/app/user/entities/user.entity'; // Đường dẫn đến User entity
import { Workspace } from 'src/app/workspace/entities/workspace.entity';
import { Board } from 'src/app/board/entities/board.entity';
import { Task } from 'src/app/task/entities/task.entity'; // Đường dẫn đến Task entity
import {
  NotificationScope,
  NotificationType,
} from 'src/shared/types/notification.enum';

// 1. Phân loại nội dung/sự kiện thông báo

@Entity('notifications')
export class Notification extends BaseUuidEntity {
  // Người nhận thông báo
  @Column({ type: 'uuid' })
  @Index()
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  // Người thực hiện hành động (VD: Alex Rivera) - Null nếu là thông báo hệ thống
  @Column({ type: 'uuid', nullable: true })
  senderId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sender_id' })
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
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace | null;

  @Column({ type: 'uuid', nullable: true })
  boardId: string | null;

  @ManyToOne(() => Board, { onDelete: 'CASCADE', nullable: true, eager: true })
  @JoinColumn({ name: 'board_id' })
  board: Board | null;

  @Column({ type: 'uuid', nullable: true })
  taskId: string | null;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true, eager: true })
  @JoinColumn({ name: 'task_id' })
  task: Task | null;

  // -------------------------------------------------------------

  // Trạng thái đã đọc hay chưa
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  // Metadata lưu thông tin phụ tùy biến dạn JSON (VD: trạng thái mời ACCEPTED/REJECTED, nội dung chat snippet, ...)
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
