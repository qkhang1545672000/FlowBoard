import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { TaskPriority } from 'src/shared/types/task-priority.enum';
import { ColumnEntity } from '../../column/entities/column.entity';
import { Label } from 'src/app/task/entities/label.entity';
import { TaskMember } from './task-member.entity';

@Entity('tasks')
@Index(['columnId', 'position'])
export class Task extends BaseUuidEntity {
  @Column({ type: 'uuid' })
  columnId: string;

  @ManyToOne(() => ColumnEntity, (col) => col.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'column_id' })
  column: ColumnEntity;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'float' })
  position: number;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'timestamptz', nullable: true })
  startDate: Date | null;

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
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'label_id', referencedColumnName: 'id' },
  })
  labels: Label[];

  // Quan hệ 1-N với danh sách tất cả thành viên (bao gồm LEADER & MEMBER) trong Task
  @OneToMany(() => TaskMember, (member) => member.task)
  members: TaskMember[];
}
