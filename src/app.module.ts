import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PinoLoggerModule } from './config/logger/logger.module';
import { AppThrottlerModule } from './config/throttler/throttler.module';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CorrelationIdMiddleware } from './core/middlewares/correlation-id.middleware';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { allConfigs } from './config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './config/database/typeorm-config.service';
import { UserModule } from './app/user/user.module';
import { AuthModule } from './app/auth/auth.module';

import { EmailModule } from './app/email/email.module';
import { WorkspaceModule } from './app/workspace/workspace.module';
import { BoardModule } from './app/board/board.module';
import { ChatModule } from './app/chat/chat.module';
import { ColumnModule } from './app/column/column.module';
import { TaskModule } from './app/task/task.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ActivityLogModule } from './app/activity-log/activity-log.module';
import { SubTaskModule } from './app/sub-task/sub-task.module';

const envFile =
  process.env.NODE_ENV === 'production'
    ? ['.env.prod', '.env']
    : ['.env.dev', '.env'];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: envFile,
      load: allConfigs,
    }),
    ScheduleModule.forRoot(),
    PinoLoggerModule,
    AppThrottlerModule,
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    UserModule,
    AuthModule,
    ActivityLogModule,
    EmailModule,
    WorkspaceModule,
    BoardModule,
    ChatModule,
    ColumnModule,
    TaskModule,
    SubTaskModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
