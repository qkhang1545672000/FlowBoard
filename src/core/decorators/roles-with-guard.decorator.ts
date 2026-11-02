import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from 'src/core/decorators/role.decorator';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from 'src/core/guards/role.guard';
import { UserRole } from 'src/shared/types/user-role.enum';

export function RequireRoles(...roles: UserRole[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RolesGuard));
}
