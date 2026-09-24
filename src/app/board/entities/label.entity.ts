import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Board } from './board.entity';
import { Task } from './task.entity';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  boardId: string;

  @ManyToOne(() => Board, (board) => board.labels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text' })
  color: string;

  @ManyToMany(() => Task, (task) => task.labels)
  tasks: Task[];
}
