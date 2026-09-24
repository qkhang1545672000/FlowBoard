import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { apiNotFound } from 'src/shared/helpers/api-i18n';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
  ) {}

  async getWorkspaceById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: {
        members: {
          user: true, // Lấy chi tiết thông tin User nằm trong WorkspaceMember
        },
      },
    });

    if (!workspace) {
      apiNotFound('errors.workspace.notFound');
    }

    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    return this.workspaceRepository.find({
      where: { members: { userId } },
      relations: {
        members: true,
      },
    });
  }
}
