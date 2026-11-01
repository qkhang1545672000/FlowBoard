import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { WorkspaceInvitation } from './entities/workspace-invitation.entity';

import { User } from '../user/entities/user.entity';
import { Board } from '../board/entities/board.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMember,
      WorkspaceInvitation,
      User,
      Board,
    ]),
    AuthModule,
    EmailModule,
    NotificationModule,
  ],

  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
