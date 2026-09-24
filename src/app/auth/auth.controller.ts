import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AuthService } from 'src/app/auth/auth.service';
import { SessionAuthService } from 'src/app/auth/session-auth/session-auth.service';
import { UserResponseDto } from 'src/app/user/dto/user-response.dto';
import { User } from 'src/app/user/entities/user.entity';
import { UserService } from 'src/app/user/user.service';
import { ResEx } from 'src/swagger/response-examples';

@ApiTags('Xác thực (Auth)')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly sessionAuth: SessionAuthService,
  ) {}

  private mapUserResponse(user: User) {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  private async sessionFromRequest(req: { headers: any }) {
    const ctx = await this.sessionAuth.resolveSessionContext(req.headers);

    if (!ctx) return null;

    return {
      user: this.mapUserResponse(ctx.user),
      session: {
        token: ctx.session.token,
        expiresAt: ctx.session.expiresAt,
      },
    };
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Xác minh email qua token (query)',
    operationId: 'auth_verify_email',
  })
  @ApiOkResponse({
    description: 'Ví dụ phản hồi',
    schema: { example: ResEx.auth.verifyEmail },
  })
  async verifyEmail(
    @Query('token') token: string,
    @Query('email') email: string,
  ) {
    return this.authService.verifyEmailCustom(token, email);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Lấy thông tin user hiện tại (Bearer hoặc cookie session)',
    operationId: 'auth_get_me',
  })
  @ApiOkResponse({
    description:
      'Ví dụ khi đã đăng nhập; khi không có session trả authenticated: false',
    schema: { example: ResEx.auth.me },
  })
  @ApiBearerAuth()
  async getCurrentUser(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session?.user) {
      return {
        success: false,
        authenticated: false,
        message: 'Not authenticated',
        user: null,
      };
    }

    const fullUser = await this.userService.getUser(session.user.id);

    return {
      success: true,
      authenticated: true,
      user: fullUser ? this.mapUserResponse(fullUser) : session.user,
    };
  }

  @Get('session')
  @ApiOperation({
    summary: 'Lấy session (token, hết hạn, user)',
    operationId: 'auth_get_session',
  })
  @ApiOkResponse({
    description: 'Ví dụ khi có session',
    schema: { example: ResEx.auth.session },
  })
  @ApiBearerAuth()
  async getSession(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session?.session) {
      return {
        success: false,
        authenticated: false,
      };
    }

    return {
      success: true,
      authenticated: true,
      session: {
        token: session.session.token,
        expiresAt: session.session.expiresAt,
      },
      user: session.user,
    };
  }

  @Get('check')
  @ApiOperation({
    summary: 'Kiểm tra đã đăng nhập hay chưa',
    operationId: 'auth_check',
  })
  @ApiOkResponse({
    description: 'Ví dụ phản hồi',
    schema: { example: ResEx.auth.check },
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async checkAuth(@Req() req: any) {
    const session = await this.sessionFromRequest(req);

    if (!session?.user) {
      return {
        authenticated: false,
        user: null,
      };
    }

    return {
      authenticated: true,
      user: session.user,
    };
  }
}
