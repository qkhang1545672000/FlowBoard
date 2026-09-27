/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionAuthService } from 'src/app/auth/session-auth/session-auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessionAuth: SessionAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const ctx = await this.sessionAuth.resolveSessionContext(request.headers);

    if (!ctx || !ctx.user) {
      // eslint-disable-next-line prettier/prettier
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }

    // Gán thông tin user và session vào request để các Controller/Decorator dùng
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    request.user = ctx.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    request.session = ctx.session;

    return true;
  }
}
