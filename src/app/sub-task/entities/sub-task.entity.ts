import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Task } from 'src/app/task/entities/task.entity';
import { User } from 'src/app/user/entities/user.entity';

@Entity('sub_tasks')
@Index(['taskId', 'position'])
export class SubTask extends BaseUuidEntity {
  @Column({ type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.subTasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'float', default: 1000 })
  position: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assigneeId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;
}
