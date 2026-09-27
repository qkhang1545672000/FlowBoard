import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseUuidEntity } from 'src/config/database/base-uuid.entity';
import { Workspace } from './workspace.entity';
import { User } from 'src/app/user/entities/user.entity';
import { WorkspaceRole } from 'src/shared/types/workspace-role.enum';
import { InvitationStatus } from 'src/shared/types/invitation-status.enum';

@Entity('workspace_invitations')
export class WorkspaceInvitation extends BaseUuidEntity {
  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  email: string;

  @Column({ name: 'inviter_id' })
  inviterId: string;

  @Column({ type: 'enum', enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  role: WorkspaceRole;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_id' })
  inviter: User;
}
