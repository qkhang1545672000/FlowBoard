import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Task } from './task.entity';
import { User } from 'src/app/user/entities/user.entity';
import { TaskMemberRole } from 'src/shared/types/TaskMemberRole.enum';

// Export Enum Vai trò của thành viên trong Task

@Entity('task_members')
@Unique(['taskId', 'userId']) // Đảm bảo 1 user không bị trùng lặp trong cùng 1 task
export class TaskMember extends BaseUuidEntity {
  @Index()
  @Column({ type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: TaskMemberRole,
    default: TaskMemberRole.TASK_MEMBER,
  })
  role: TaskMemberRole;
}
