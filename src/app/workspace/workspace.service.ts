/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, FindOperator } from 'typeorm';
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
import { Board } from '../board/entities/board.entity';
import { WorkspaceFilterType } from './dto/PaginationQuery.dto';
import { SessionAuthService } from '../auth/session-auth/session-auth.service';
import { TaskMember } from '../task/entities/task-member.entity';
import { Task } from '../task/entities/task.entity';
import { BoardMember } from '../board/entities/board-member.entity';
import { ColumnEntity } from '../column/entities/column.entity';
import { PinoLogger } from 'nestjs-pino';
import {
  NotificationScope,
  NotificationType,
} from 'src/shared/types/notification.enum';
import { NotificationService } from '../notification/notification.service';
interface BoardRaw {
  id: string;
  title: string;
  slug: string;
  tasksCount: string;
  membersCount: string;
  updatedAt: Date;
}
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
    @InjectRepository(Board)
    private readonly boardRepository: Repository<Board>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly sessionAuthService: SessionAuthService,
    private readonly logger: PinoLogger,
    private readonly notificationService: NotificationService,
  ) {}

  // ==========================================
  // 1. TRUY VẤN (READ)
  // ==========================================
  async checkIsOwnOrLeaderWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: {
        workspaceId,
        userId,
        role: In([WorkspaceRole.OWNER]), // Kiểm tra role thuộc ADMIN hoặc LEADER
      },
    });

    return !!member; // Trả về true nếu tìm thấy, false nếu không tìm thấy
  }

  async checkIsOwnOrLeaderWorkspaceWithBoard(
    boardId: string,
    userId: string,
  ): Promise<boolean> {
    // 1. Tìm board theo boardId để lấy workspaceId liên kết
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
    });

    // Nếu không tìm thấy board, trả về false luôn
    if (!board || !board.workspaceId) {
      return false;
    }

    // 2. Dùng workspaceId và userId để tìm trong bảng WorkspaceMember
    // Kiểm tra xem user có mang quyền OWNER hoặc LEADER_WORKSPACE không
    const member = await this.memberRepository.findOne({
      where: {
        workspaceId: board.workspaceId,
        userId: userId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.LEADER_WORKSPACE]),
      },
    });

    // 3. Trả về true nếu tìm thấy bản ghi thỏa mãn, ngược lại trả về false
    return !!member;
  }

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

  async getUserWorkspaces(
    userId: string,
    page: number = 1,
    limit: number = 10,
    type: WorkspaceFilterType = WorkspaceFilterType.ALL,
  ): Promise<{ data: Workspace[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;

    // 1. Tạo điều kiện lọc cơ bản theo userId
    const whereCondition: {
      userId: string;
      role?: WorkspaceRole | FindOperator<WorkspaceRole>;
    } = { userId };

    // 2. Lọc theo type truyền vào
    if (type === WorkspaceFilterType.OWNED) {
      // Chỉ lấy Workspace do user này sở hữu / làm OWNER
      whereCondition.role = WorkspaceRole.OWNER;
    } else if (type === WorkspaceFilterType.JOINED) {
      // 👉 Dùng In() để lấy cả MEMBER_WORKSPACE và LEADER_WORKSPACE
      whereCondition.role = In([
        WorkspaceRole.MEMBER_WORKSPACE,
        WorkspaceRole.LEADER_WORKSPACE,
      ]);
    }

    // 3. Truy vấn bảng WorkspaceMember
    const [members, total] = await this.memberRepository.findAndCount({
      where: whereCondition,
      relations: {
        workspace: {
          boards: true,
          members: {
            user: true,
          },
        },
      },
      order: {
        workspace: {
          updatedAt: 'DESC',
        },
      },
      skip,
      take: limit,
    });

    // 4. Lấy đối tượng Workspace ra khỏi Member
    const workspaces = members.map((m) => m.workspace).filter(Boolean);
    const hasMore = page * limit < total;

    return { data: workspaces, total, hasMore };
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

  async getWorkspaceWithBoards(workspaceId: string) {
    // 1. Lấy thông tin Workspace kèm danh sách thành viên
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: {
        members: {
          user: true,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        members: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Không tìm thấy Workspace');
    }

    // 2. Lấy danh sách ID của tất cả user trong workspace (Thêm ?? [] để an toàn tuyệt đối)
    const membersList = workspace.members ?? [];
    const userIds = membersList.map((m) => m.user.id);

    // 3. Gọi hàm xác nhận trạng thái online từ SessionAuthService
    const onlineStatusMap =
      await this.sessionAuthService.checkUsersOnlineStatus(userIds);

    // 4. Truy vấn danh sách Boards trong Workspace
    const boards = await this.boardRepository
      .createQueryBuilder('board')
      .where('board.workspaceId = :workspaceId', { workspaceId })
      .select([
        'board.id AS id',
        'board.title AS title',
        'board.slug AS slug',
        'board.updatedAt AS "updatedAt"',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(task.id)', 'tasksCount')
          .from('tasks', 'task')
          .innerJoin('columns', 'column', 'column.id = task.column_id')
          .where('column.board_id = board.id');
      }, 'tasksCount')
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(bm.id)', 'membersCount')
          .from('board_members', 'bm')
          .where('board.id = bm.board_id');
      }, 'membersCount')
      .orderBy('board.updatedAt', 'DESC')
      .getRawMany<BoardRaw>();

    // 5. Trả về kết quả, map thêm trường isOnline cho từng user
    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      members: membersList.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.createdAt,
        user: {
          id: m.user?.id,
          email: m.user?.email,
          name: m.user?.name,
          image: m.user?.image,
          isOnline: m.user?.id ? (onlineStatusMap[m.user.id] ?? false) : false,
        },
      })),
      boards: boards.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        tasksCount: parseInt(b.tasksCount || '0', 10),
        membersCount: parseInt(b.membersCount || '0', 10),
        updatedAt: b.updatedAt,
      })),
    };
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
      role: dto.role ?? WorkspaceRole.MEMBER_WORKSPACE,
    });

    return this.memberRepository.save(member);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    currentUser: User, // Truyền thêm thông tin người thực hiện thao tác (nếu có)
  ): Promise<WorkspaceMember> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // Sử dụng transaction của TypeORM để đảm bảo tính an toàn dữ liệu
    return await this.memberRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const memberRepository =
          transactionalEntityManager.getRepository(WorkspaceMember);

        // 1. Tìm thành viên cần cập nhật role
        const member = await memberRepository.findOne({
          where: { workspaceId, userId },
        });

        if (!member) {
          throw new NotFoundException(
            'Không tìm thấy thành viên trong workspace',
          );
        }

        // 🛡️ BẢO VỆ OWNER
        if (
          member.role === WorkspaceRole.OWNER &&
          role !== WorkspaceRole.OWNER
        ) {
          throw new BadRequestException('Không thể thay đổi quyền của Owner');
        }

        const oldRole = member.role;

        // 2. Nếu role mới được gán là LEADER_WORKSPACE, cần xử lý leader cũ
        let previousLeader: WorkspaceMember | null = null;
        if (role === WorkspaceRole.LEADER_WORKSPACE) {
          previousLeader = await memberRepository.findOne({
            where: { workspaceId, role: WorkspaceRole.LEADER_WORKSPACE },
          });

          if (
            previousLeader &&
            previousLeader.userId !== userId &&
            previousLeader.role !== WorkspaceRole.OWNER
          ) {
            previousLeader.role = WorkspaceRole.MEMBER_WORKSPACE; // Hạ cấp leader cũ
            await memberRepository.save(previousLeader);
          }
        }

        // 3. Cập nhật role mới cho thành viên hiện tại
        member.role = role;
        const updatedMember = await memberRepository.save(member);

        // 4. 🔥 BẮN THÔNG BÁO CHO CÁC BÊN LIÊN QUAN

        // Trường hợp A: Người được thăng làm Leader mới
        if (
          oldRole !== WorkspaceRole.LEADER_WORKSPACE &&
          role === WorkspaceRole.LEADER_WORKSPACE
        ) {
          await this.notificationService.createNotificationForScope({
            senderId: currentUser?.id || null,
            type: NotificationType.WORKSPACE_ACTIVITY,
            scope: NotificationScope.DIRECT,
            specificUserId: userId, // Gửi cho người được làm leader
            workspaceId: workspaceId,
            title: `Bạn đã được bổ nhiệm làm Trưởng nhóm (Leader) tại Workspace '${workspace.name}'`,
            metadata: {
              workspaceSlug: workspace.slug,
              action: 'NEW_LEADER',
            },
          });
        }

        // Trường hợp B: Người bị hạ cấp xuống Member (do có Leader mới thay thế)
        if (previousLeader && previousLeader.userId !== userId) {
          await this.notificationService.createNotificationForScope({
            senderId: currentUser?.id || null,
            type: NotificationType.WORKSPACE_ACTIVITY,
            scope: NotificationScope.DIRECT,
            specificUserId: previousLeader.userId, // Gửi cho người bị hạ cấp
            workspaceId: workspaceId,
            title: `Bạn đã được chuyển thành Thành viên thường tại Workspace '${workspace.name}'`,
            metadata: {
              workspaceSlug: workspace.slug,
              action: 'DEMOTED_MEMBER',
            },
          });
        }

        return updatedMember;
      },
    );
  }

  async removeMember(
    workspaceId: string,
    userId: string,
  ): Promise<{ success: boolean; message?: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Kiểm tra thành viên có tồn tại trong workspace không
      const member = await queryRunner.manager.findOne(WorkspaceMember, {
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

      // 2. Tìm tất cả các Board thuộc Workspace này
      const boards = await queryRunner.manager.find(Board, {
        where: { workspaceId },
      });
      const boardIds = boards.map((b) => b.id);

      if (boardIds.length > 0) {
        // Kiểm tra user có trong bảng board_members của các board này không
        const boardMembers = await queryRunner.manager.find(BoardMember, {
          where: {
            boardId: In(boardIds),
            userId: userId,
          },
          relations: { board: true },
        });

        // Lấy tất cả các Column thuộc các Board đó
        const columns = await queryRunner.manager.find(ColumnEntity, {
          where: { boardId: In(boardIds) },
        });
        const columnIds = columns.map((c) => c.id);

        let taskMembers: TaskMember[] = [];
        if (columnIds.length > 0) {
          const tasks = await queryRunner.manager.find(Task, {
            where: { columnId: In(columnIds) },
          });
          const taskIds = tasks.map((t) => t.id);

          if (taskIds.length > 0) {
            // Kiểm tra user có được gán vào task nào không (bảng task_members)
            taskMembers = await queryRunner.manager.find(TaskMember, {
              where: {
                taskId: In(taskIds),
                userId: userId,
              },
              relations: {
                task: {
                  column: {
                    board: true,
                  },
                },
              },
            });
          }
        }

        // 3. Tổng hợp danh sách các board mà thành viên này đang tham gia hoặc có task đảm nhiệm
        const participatingBoardsMap = new Map<string, string>(); // boardId -> boardTitle

        boardMembers.forEach((bm) => {
          if (bm.board) {
            participatingBoardsMap.set(bm.board.id, bm.board.title);
          }
        });

        taskMembers.forEach((tm) => {
          const board = tm.task?.column?.board;
          if (board) {
            participatingBoardsMap.set(board.id, board.title);
          }
        });

        // 4. Nếu thành viên vẫn đang tham gia board/task -> Chặn xóa và thông báo
        if (participatingBoardsMap.size > 0) {
          const projectNames = Array.from(participatingBoardsMap.values()).join(
            ', ',
          );
          throw new BadRequestException(
            `Không thể xóa thành viên này vì đang tham gia vào các dự án/board: [${projectNames}]. Vui lòng gỡ thành viên khỏi các board và task trước khi xóa khỏi workspace.`,
          );
        }
      }

      // 5. Nếu không vướng board hoặc task nào, tiến hành xóa thành viên khỏi workspace
      await queryRunner.manager.remove(WorkspaceMember, member);

      // Commit Transaction thành công
      await queryRunner.commitTransaction();
      return {
        success: true,
        message: 'Đã xóa thành viên khỏi workspace thành công',
      };
    } catch (error) {
      // Rollback toàn bộ nếu có lỗi xảy ra
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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

    // 1. Kiểm tra nếu email đã là thành viên chính thức của Workspace
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

    // 2. 🛑 KIỂM TRA LỜI MỜI ĐANG CHỜ (PENDING) TRƯỚC ĐÓ
    // Nếu email này đã nhận được lời mời vào workspace này và vẫn đang PENDING thì không gửi lại nữa
    const existingPendingInvitation = await this.invitationRepository.findOne({
      where: {
        workspaceId,
        email: dto.email,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingPendingInvitation) {
      // 🔥 Tạo thông báo cho chính người gửi (inviter) biết là đã gửi lời mời này rồi
      await this.notificationService.createNotificationForScope({
        senderId: inviter.id,
        type: NotificationType.SYSTEM, // Hoặc thông báo hệ thống
        scope: NotificationScope.DIRECT,
        specificUserId: inviter.id, // Gửi cho chính người đang thao tác
        workspaceId: workspaceId,
        title: `Bạn đã gửi lời mời tham gia Workspace '${workspace.name}' tới email ${dto.email} trước đó rồi.`,
        metadata: {
          customTitle: 'Bạn đã gửi lời mời kết bạn trước đó',
          targetEmail: dto.email,
        },
      });

      // Trả về lỗi/thông báo cho client (hoặc quăng BadRequestException tùy ý bạn muốn hiện toast lỗi thế nào)
      throw new BadRequestException(
        `Bạn đã gửi lời mời tới ${dto.email} trước đó rồi và lời mời vẫn đang chờ phản hồi.`,
      );
    }

    // 3. Vô hiệu hóa lời mời cũ đang chờ (Đoạn này giữ nguyên nếu muốn logic cũ, nhưng vì ở trên đã chặn PENDING rồi thì có thể tùy chọn giữ hay bỏ.
    // Tuy nhiên nếu bạn muốn hệ thống tự động ghi đè/hủy cũ tạo mới thì bỏ chặn ở bước 2 đi.
    // Còn nếu muốn "nếu đã gửi rồi thì từ chối gửi thêm và báo đã gửi" thì dùng logic ở bước 2 này).

    // 4. Tạo Token và hết hạn sau 7 ngày
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      workspaceId,
      email: dto.email,
      inviterId: inviter.id,
      role: dto.role ?? WorkspaceRole.MEMBER_WORKSPACE,
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    await this.invitationRepository.save(invitation);

    // 5. Nếu người nhận ĐÃ CÓ TÀI KHOẢN trong hệ thống -> Tạo luôn thông báo In-app Realtime cho người nhận
    if (targetUser) {
      await this.notificationService.createNotificationForScope({
        senderId: inviter.id,
        type: NotificationType.WORKSPACE_INVITE,
        scope: NotificationScope.DIRECT,
        specificUserId: targetUser.id,
        workspaceId: workspaceId,
        title: `${inviter.name || inviter.email} đã mời bạn tham gia Workspace '${workspace.name}'`,
        metadata: {
          token,
          inviterName: inviter.name || inviter.email,
          workspaceName: workspace.name,
        },
      });
      return {
        success: true,
        message: 'Đã gửi lời mời hệ thống thành công',
      };
    }

    // 6. Gửi email bất đồng bộ (Không dùng await để không bắt client phải chờ)
    const clientUrl = this.configService.get<string>(
      'CLIENT_URL',
      'http://localhost:3000',
    );
    const acceptUrl = `${clientUrl}/invitations/accept?token=${token}`;
    const inviterName = inviter.name || inviter.email;

    void this.emailService
      .sendWorkspaceInvitationEmail(
        dto.email,
        inviterName,
        workspace.name,
        acceptUrl,
      )
      .catch((err) => {
        this.logger.error({
          msg: 'Background email send failed',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          error: err.message,
        });
      });

    return {
      success: true,
      message: 'Đã gửi lời mời thành công qua Email và Hệ thống',
    };
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

    const workspaceDetail = await this.workspaceRepository.findOne({
      where: { id: invitation.workspaceId },
    });

    if (!workspaceDetail) {
      throw new NotFoundException('Workspace không tồn tại');
    }

    // 2. Kiểm tra trạng thái lời mời
    if (invitation.status === InvitationStatus.ACCEPTED) {
      return {
        success: true,
        message: 'Bạn đã gia nhập Workspace này trước đó rồi',
        workspaceId: invitation.workspaceId,
        slug: workspaceDetail.slug,
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
      invitation.status = InvitationStatus.ACCEPTED;
      await this.invitationRepository.save(invitation);

      return {
        success: true,
        message: 'Bạn đã là thành viên của Workspace này',
        workspaceId: invitation.workspaceId,
        slug: workspaceDetail.slug,
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

    // 6. 🔥 BẮN THÔNG BÁO CHO NGƯỜI GỬI (INVITER)
    if (invitation.inviterId && invitation.inviterId !== user.id) {
      const userName = user.name || user.email;
      await this.notificationService.createNotificationForScope({
        senderId: user.id,
        type: NotificationType.WORKSPACE_ACTIVITY, // Hoặc SYSTEM tùy thuộc vào enum của bạn
        scope: NotificationScope.DIRECT,
        specificUserId: invitation.inviterId, // Gửi trực tiếp cho người mời
        workspaceId: invitation.workspaceId,
        metadata: {
          customTitle: `${userName} đã chấp nhận lời mời tham gia Workspace '${workspaceDetail.name}'`,
          acceptedUserId: user.id,
        },
      });
    }

    return {
      success: true,
      message: 'Gia nhập Workspace thành công',
      workspaceId: invitation.workspaceId,
      slug: workspaceDetail.slug,
    };
  }
}
