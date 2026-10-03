import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BoardVisibility } from 'src/shared/types/board-visibility.enum';
import { Workspace } from 'src/app/workspace/entities/workspace.entity';
import { ColumnEntity } from '../../column/entities/column.entity';
import { Label } from '../../task/entities/label.entity';
import { BoardMember } from './board-member.entity';

@Entity('boards')
export class Board extends BaseUuidEntity {
  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @ManyToOne(() => Workspace, (ws) => ws.boards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  background: string | null;

  @Column({
    type: 'enum',
    enum: BoardVisibility,
    default: BoardVisibility.WORKSPACE,
  })
  visibility: BoardVisibility;

  @OneToMany(() => ColumnEntity, (col) => col.board)
  columns: ColumnEntity[];

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Label, (label) => label.board)
  labels: Label[];

  @OneToMany(() => BoardMember, (member) => member.board)
  members: BoardMember[];
}
