import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { InviteMemberDto } from './dto/InviteMember.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { SessionAuthGuard } from 'src/core/guards/session-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { WorkspaceRole } from 'src/shared/types/workspace-role.enum';
@UseGuards(SessionAuthGuard)
@ApiTags('Quản lý Workspace')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  private mapWorkspaceResponse(workspace: any) {
    return plainToInstance(WorkspaceResponseDto, workspace, {
      excludeExtraneousValues: true,
    });
  }

  // ==========================================
  // WORKSPACE CRUD ENDPOINTS
  // ==========================================

  @Post()
  @ApiOperation({
    summary: 'Tạo không gian làm việc mới (Workspace)',
    operationId: 'workspace_create',
  })
  @ApiCreatedResponse({ type: WorkspaceResponseDto })
  async createWorkspace(
    @CurrentUser() user: User,
    @Body() dto: CreateWorkspaceDto,
  ) {
    const workspace = await this.workspaceService.createWorkspace(user.id, dto);
    return this.mapWorkspaceResponse(workspace);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách Workspace của người dùng hiện tại',
    operationId: 'workspace_get_my_workspaces',
  })
  @ApiOkResponse({ type: [WorkspaceResponseDto] })
  async getMyWorkspaces(@CurrentUser() user: User) {
    const workspaces = await this.workspaceService.getUserWorkspaces(user.id);

    return workspaces.map((ws) => this.mapWorkspaceResponse(ws));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết Workspace theo ID',
    operationId: 'workspace_get_by_id',
  })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  async getWorkspace(@Param('id') id: string) {
    const workspace = await this.workspaceService.getWorkspaceById(id);
    return this.mapWorkspaceResponse(workspace);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin Workspace',
    operationId: 'workspace_update',
  })
  @ApiOkResponse({ type: WorkspaceResponseDto })
  async updateWorkspace(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspaceService.updateWorkspace(id, dto);
    return this.mapWorkspaceResponse(workspace);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa Workspace',
    operationId: 'workspace_delete',
  })
  @ApiOkResponse({
    schema: { example: { success: true } },
  })
  @HttpCode(HttpStatus.OK)
  async deleteWorkspace(@Param('id') id: string) {
    return this.workspaceService.deleteWorkspace(id);
  }

  // ==========================================
  // MEMBER MANAGEMENT ENDPOINTS
  // ==========================================

  @Post(':id/members')
  @ApiOperation({
    summary: 'Thêm thành viên vào Workspace',
    operationId: 'workspace_add_member',
  })
  @ApiCreatedResponse({ description: 'Thêm thành viên thành công' })
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.workspaceService.addMember(id, dto);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({
    summary: 'Cập nhật vai trò (Role) của thành viên',
    operationId: 'workspace_update_member_role',
  })
  @ApiOkResponse({ description: 'Cập nhật vai trò thành công' })
  async updateMemberRole(
    @Param('id') workspaceId: string,
    @Param('userId') userId: string,
    @Body('role') role: WorkspaceRole,
  ) {
    return this.workspaceService.updateMemberRole(workspaceId, userId, role);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Xóa thành viên khỏi Workspace',
    operationId: 'workspace_remove_member',
  })
  @ApiOkResponse({
    schema: { example: { success: true } },
  })
  @HttpCode(HttpStatus.OK)
  async removeMember(
    @Param('id') workspaceId: string,
    @Param('userId') userId: string,
  ) {
    return this.workspaceService.removeMember(workspaceId, userId);
  }

  // ==========================================
  // INVITATION ENDPOINTS (MỚI BỔ SUNG)
  // ==========================================

  @Post(':id/invitations')
  @ApiOperation({
    summary: 'Gửi lời mời gia nhập Workspace qua Email',
    operationId: 'workspace_send_invitation',
  })
  @ApiCreatedResponse({ description: 'Gửi lời mời thành công' })
  async sendInvitation(
    @Param('id') id: string,
    @CurrentUser() inviter: User,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspaceService.sendInvitation(id, inviter, dto);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chấp nhận lời mời gia nhập Workspace qua Token',
    operationId: 'workspace_accept_invitation',
  })
  @ApiOkResponse({ description: 'Gia nhập Workspace thành công' })
  async acceptInvitation(
    @Query('token') token: string,
    @CurrentUser() user: User,
  ) {
    return this.workspaceService.acceptInvitation(token, user);
  }
}
