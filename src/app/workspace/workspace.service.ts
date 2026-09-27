import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { WorkspaceInvitation } from './entities/workspace-invitation.entity';
import { User } from 'src/app/user/entities/user.entity';

import { WorkspaceRole } from 'src/shared/types/workspace-role.enum';
import { apiNotFound } from 'src/shared/helpers/api-i18n';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { InviteMemberDto } from './dto/InviteMember.dto';
import { EmailService } from '../email/email.service'; // Điều chỉnh path nếu cần
import { InvitationStatus } from 'src/shared/types/invitation-status.enum';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepository: Repository<WorkspaceMember>,
    @InjectRepository(WorkspaceInvitation)
    private readonly invitationRepository: Repository<WorkspaceInvitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // ==========================================
  // 1. TRUY VẤN (READ)
  // ==========================================

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
    const members = await this.memberRepository.find({
      where: { userId },
      relations: {
        workspace: {
          members: true, // Lấy toàn bộ danh sách members của workspace đó
        },
      },
    });
    console.log('membner:', members);
    return members.map((m) => m.workspace).filter(Boolean);
  }

  // ==========================================
  // 2. TẠO MỚI WORKSPACE (CREATE WITH TRANSACTION)
  // ==========================================

  async createWorkspace(
    ownerId: string,
    dto: CreateWorkspaceDto,
  ): Promise<Workspace> {
    // 1. Kiểm tra trùng lặp slug
    const existing = await this.workspaceRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Slug đã tồn tại, vui lòng chọn slug khác');
    }

    // 2. Sử dụng QueryRunner để đảm bảo tính toàn vẹn dữ liệu (Transaction)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Tạo Workspace
      const workspace = queryRunner.manager.create(Workspace, dto);
      const savedWorkspace = await queryRunner.manager.save(workspace);

      // Gán Owner vào Workspace Members
      const member = queryRunner.manager.create(WorkspaceMember, {
        workspaceId: savedWorkspace.id,
        userId: ownerId,
        role: WorkspaceRole.OWNER,
      });
      await queryRunner.manager.save(member);

      // Commit Transaction
      await queryRunner.commitTransaction();

      // Trả về kết quả kèm quan hệ
      return this.getWorkspaceById(savedWorkspace.id);
    } catch (error) {
      // Rollback nếu có lỗi xảy ra
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Giải phóng kết nối
      await queryRunner.release();
    }
  }

  // ==========================================
  // 3. CẬP NHẬT WORKSPACE (UPDATE)
  // ==========================================

  async updateWorkspace(
    id: string,
    dto: UpdateWorkspaceDto,
  ): Promise<Workspace> {
    const workspace = await this.getWorkspaceById(id);

    // Kiểm tra slug mới nếu có sự thay đổi
    if (dto.slug && dto.slug !== workspace.slug) {
      const existing = await this.workspaceRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Slug đã tồn tại, vui lòng chọn slug khác');
      }
    }

    Object.assign(workspace, dto);
    await this.workspaceRepository.save(workspace);

    return workspace;
  }

  // ==========================================
  // 4. XÓA WORKSPACE (DELETE)
  // ==========================================

  async deleteWorkspace(id: string): Promise<{ success: boolean }> {
    const workspace = await this.getWorkspaceById(id);

    // Xóa Workspace (Cascade trong PostgreSQL sẽ tự dọn dẹp các thành viên & bảng liên quan)
    await this.workspaceRepository.remove(workspace);

    return { success: true };
  }

  // ==========================================
  // 5. QUẢN LÝ THÀNH VIÊN (MEMBERS)
  // ==========================================

  async addMember(
    workspaceId: string,
    dto: AddMemberDto,
  ): Promise<WorkspaceMember> {
    await this.getWorkspaceById(workspaceId);

    const existingMember = await this.memberRepository.findOne({
      where: { workspaceId, userId: dto.userId },
    });

    if (existingMember) {
      throw new ConflictException(
        'Người dùng đã là thành viên của Workspace này',
      );
    }

    const member = this.memberRepository.create({
      workspaceId,
      userId: dto.userId,
      role: dto.role ?? WorkspaceRole.MEMBER,
    });

    return this.memberRepository.save(member);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      apiNotFound('errors.workspace.memberNotFound');
    }

    member.role = role;
    return this.memberRepository.save(member);
  }

  async removeMember(
    workspaceId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      apiNotFound('errors.workspace.memberNotFound');
    }

    // Không cho phép xóa OWNER khỏi Workspace trực tiếp
    if (member.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Không thể xóa Chủ sở hữu (OWNER) khỏi Workspace',
      );
    }

    await this.memberRepository.remove(member);
    return { success: true };
  }

  // ==========================================
  // 6. TÍNH NĂNG MỜI THÀNH VIÊN (INVITATIONS)
  // ==========================================

  // Gửi email lời mời tham gia Workspace
  async sendInvitation(
    workspaceId: string,
    inviter: User,
    dto: InviteMemberDto,
  ) {
    const workspace = await this.getWorkspaceById(workspaceId);

    // 1. Kiểm tra nếu email đã là thành viên
    const targetUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (targetUser) {
      const existingMember = await this.memberRepository.findOne({
        where: { workspaceId, userId: targetUser.id },
      });
      if (existingMember) {
        throw new ConflictException(
          'Người dùng đã là thành viên của Workspace này',
        );
      }
    }

    // 2. Vô hiệu hóa lời mời cũ đang chờ (nếu có)
    await this.invitationRepository.update(
      { workspaceId, email: dto.email, status: InvitationStatus.PENDING },
      { status: InvitationStatus.EXPIRED },
    );

    // 3. Tạo Token và hết hạn sau 7 ngày
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      workspaceId,
      email: dto.email,
      inviterId: inviter.id,
      role: dto.role ?? WorkspaceRole.MEMBER,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    await this.invitationRepository.save(invitation);

    // 4. Gửi email
    const clientUrl = this.configService.get<string>(
      'CLIENT_URL',
      'http://localhost:3000',
    );
    const acceptUrl = `${clientUrl}/invitations/accept?token=${token}`;
    const inviterName = inviter.name || inviter.email;

    await this.emailService.sendWorkspaceInvitationEmail(
      dto.email,
      inviterName,
      workspace.name,
      acceptUrl,
    );

    return { success: true, message: 'Đã gửi lời mời thành công qua Email' };
  }

  // Chấp nhận lời mời từ link/token trong email
  // workspace.service.ts

  async acceptInvitation(token: string, user: User) {
    // 1. Tìm thông tin lời mời
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Lời mời không tồn tại hoặc đã bị xóa');
    }

    // 2. Kiểm tra trạng thái lời mời
    if (invitation.status === InvitationStatus.ACCEPTED) {
      // Nếu đã chấp nhận rồi, trả về luôn workspaceId để Frontend chuyển hướng, không insert lại
      return {
        success: true,
        message: 'Bạn đã gia nhập Workspace này trước đó rồi',
        workspaceId: invitation.workspaceId,
      };
    }

    if (
      invitation.status === InvitationStatus.EXPIRED ||
      new Date() > invitation.expiresAt
    ) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Lời mời này đã hết hạn');
    }

    // 3. KIỂM TRA XEM USER ĐÃ LÀ THÀNH VIÊN CHƯA (Tránh lỗi duplicate key)
    const existingMember = await this.memberRepository.findOne({
      where: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
      },
    });

    if (existingMember) {
      // Cập nhật trạng thái lời mời sang ACCEPTED nếu chưa cập nhật
      invitation.status = InvitationStatus.ACCEPTED;
      await this.invitationRepository.save(invitation);

      return {
        success: true,
        message: 'Bạn đã là thành viên của Workspace này',
        workspaceId: invitation.workspaceId,
      };
    }

    // 4. Nếu chưa phải thành viên -> Tạo thành viên mới
    const newMember = this.memberRepository.create({
      workspaceId: invitation.workspaceId,
      userId: user.id,
      role: invitation.role,
    });
    await this.memberRepository.save(newMember);

    // 5. Đánh dấu lời mời đã được chấp nhận
    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    return {
      success: true,
      message: 'Gia nhập Workspace thành công',
      workspaceId: invitation.workspaceId,
    };
  }
}
