import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm'; // Thêm In và MoreThan nếu chưa có
import { Session } from '../entities/session.entity';
import { extractSessionTokenFromHeaders } from 'src/shared/utils/request-session.util';

@Injectable()
export class SessionAuthService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
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
   * Hàm riêng kiểm tra trạng thái online của một danh sách User ID dựa vào bảng Session
   */
  async checkUsersOnlineStatus(
    userIds: string[],
  ): Promise<Record<string, boolean>> {
    if (!userIds || userIds.length === 0) {
      return {};
    }

    // Tìm tất cả các session hợp lệ của các user này chưa hết hạn
    const activeSessions = await this.sessionRepo.find({
      where: {
        userId: In(userIds),
        expiresAt: MoreThan(new Date()),
      },
      select: {
        userId: true,
      },
    });

    // Tạo Set chứa các userId đang online để tra cứu O(1)
    const onlineSet = new Set(activeSessions.map((s) => s.userId));

    // Trả về map dạng { [userId]: true/false }
    const result: Record<string, boolean> = {};
    for (const id of userIds) {
      result[id] = onlineSet.has(id);
    }

    return result;
  }
}
