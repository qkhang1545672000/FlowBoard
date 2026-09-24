import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Column, DeleteDateColumn, Entity, OneToMany } from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';
import { Board } from 'src/app/board/entities/board.entity';

@Entity('workspaces')
export class Workspace extends BaseUuidEntity {
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  logo: string | null;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[];

  @OneToMany(() => Board, (board) => board.workspace)
  boards: Board[];
}
