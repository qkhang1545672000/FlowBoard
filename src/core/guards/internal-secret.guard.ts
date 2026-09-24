import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verifyInternalSecret } from 'src/shared/utils/internal-secret.util';

@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const raw = request.headers?.['x-internal-secret'];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    const expected = this.configService.get<string>('INTERNAL_API_SECRET');

    if (!verifyInternalSecret(provided, expected)) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    return true;
  }
}
