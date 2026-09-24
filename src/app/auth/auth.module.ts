import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { Session } from './entities/session.entity';
import { Verification } from './entities/verification.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { SessionAuthService } from './session-auth/session-auth.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Session, Verification]),
    UserModule,
  ],
  providers: [SessionAuthService, AuthService],
  exports: [SessionAuthService],
  controllers: [AuthController],
})
export class AuthModule {}
