import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TaskPriority } from 'src/shared/types/task-priority.enum';
import { ColumnEntity } from './column.entity';
import { User } from 'src/app/user/entities/user.entity';
import { Label } from './label.entity';

@Entity('tasks')
@Index(['columnId', 'position'])
export class Task extends BaseUuidEntity {
  @Column({ type: 'uuid' })
  columnId: string;

  @ManyToOne(() => ColumnEntity, (col) => col.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'columnId' })
  column: ColumnEntity;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assigneeId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User | null;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'float' })
  position: number;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  // Relation N-N giữa Task và Label
  @ManyToMany(() => Label, (label) => label.tasks)
  @JoinTable({
    name: 'task_labels',
    joinColumn: { name: 'taskId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'labelId', referencedColumnName: 'id' },
  })
  labels: Label[];
}
