import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { WorkspaceService } from './workspace.service';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';

@ApiTags('Quản lý Workspace')
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết Workspace theo ID',
    operationId: 'workspace_get_by_id',
  })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  @ApiBearerAuth()
  async getWorkspace(@Param('id') id: string) {
    const workspace = await this.workspaceService.getWorkspaceById(id);
    return plainToInstance(WorkspaceResponseDto, workspace, {
      excludeExtraneousValues: true,
    });
  }
}
