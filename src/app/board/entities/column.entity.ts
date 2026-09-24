import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ColumnLockType } from 'src/shared/types/column-lock-type.enum';
import { Board } from './board.entity';
import { Task } from './task.entity';

@Entity('columns')
@Index(['boardId', 'position'])
export class ColumnEntity extends BaseUuidEntity {
  @Column({ type: 'uuid' })
  boardId: string;

  @ManyToOne(() => Board, (board) => board.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @Column({ type: 'text' })
  title: string;

  @Column({
    type: 'enum',
    enum: ColumnLockType,
    default: ColumnLockType.UNLOCKED,
  })
  lock_type: ColumnLockType;

  @Column({ type: 'float' })
  position: number;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Task, (task) => task.column)
  tasks: Task[];
}
