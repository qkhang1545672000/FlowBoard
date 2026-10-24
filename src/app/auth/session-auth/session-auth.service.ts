import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../entities/session.entity';
import { extractSessionTokenFromHeaders } from 'src/shared/utils/request-session.util';
import { AuthGateway } from '../auth.gateway'; // Đảm bảo đúng đường dẫn tới auth.gateway

@Injectable()
export class SessionAuthService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @Inject(forwardRef(() => AuthGateway))
    private readonly authGateway: AuthGateway,
  ) {}

  async resolveSessionContext(
    headers: Record<string, string | string[] | undefined>,
  ) {
    const token = extractSessionTokenFromHeaders(headers);
    if (!token) return null;

    const row = await this.sessionRepo.findOne({
      where: { token },
      relations: {
        user: true,
      },
    });

    if (row && row.expiresAt > new Date() && row.user) {
      return {
        session: {
          id: row.id,
          token: row.token,
          expiresAt: row.expiresAt,
        },
        user: row.user,
      };
    }

    return null;
  }

  async resolveAuthenticatedUser(
    headers: Record<string, string | string[] | undefined>,
  ) {
    const ctx = await this.resolveSessionContext(headers);
    return ctx?.user ?? null;
  }

  /**
   * Kiểm tra trạng thái online thực tế dựa vào WebSocket connection trong AuthGateway
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async checkUsersOnlineStatus(
    userIds: string[],
  ): Promise<Record<string, boolean>> {
    if (!userIds || userIds.length === 0) {
      return {};
    }

    const result: Record<string, boolean> = {};
    for (const id of userIds) {
      // Tra cứu trực tiếp xem user có đang mở kết nối WebSocket thực tế hay không
      result[id] = this.authGateway.isUserOnline(id);
    }

    return result;
  }
}
