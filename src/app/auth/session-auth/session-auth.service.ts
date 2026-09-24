import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
