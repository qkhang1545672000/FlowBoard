import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ChatScope } from 'src/shared/types/chat-scope.enum';
import { User } from 'src/app/user/entities/user.entity';
import { Workspace } from 'src/app/workspace/entities/workspace.entity';
import { Board } from 'src/app/board/entities/board.entity';
import { Task } from 'src/app/board/entities/task.entity';

@Entity('messages')
@Index(['scope', 'workspaceId'])
@Index(['scope', 'boardId'])
@Index(['scope', 'taskId'])
export class Message extends BaseUuidEntity {
  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'enum', enum: ChatScope })
  scope: ChatScope;

  @Column({ type: 'uuid', nullable: true })
  workspaceId: string | null;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace | null;

  @Column({ type: 'uuid', nullable: true })
  boardId: string | null;

  @ManyToOne(() => Board, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'boardId' })
  board: Board | null;

  @Column({ type: 'uuid', nullable: true })
  taskId: string | null;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'taskId' })
  task: Task | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{ url: string; name?: string; type?: string }> | null;
}
