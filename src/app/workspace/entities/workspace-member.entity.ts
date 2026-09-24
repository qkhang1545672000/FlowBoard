import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { WorkspaceRole } from 'src/shared/types/workspace-role.enum';
import { Workspace } from './workspace.entity';
import { User } from 'src/app/user/entities/user.entity';

@Entity('workspace_members')
@Index(['workspaceId', 'userId'], { unique: true })
export class WorkspaceMember extends BaseUuidEntity {
  @Column({ type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => Workspace, (ws) => ws.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  role: WorkspaceRole;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
