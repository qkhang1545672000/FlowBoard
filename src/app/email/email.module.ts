import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { InternalEmailController } from './email.controller';
import { InternalSecretGuard } from 'src/core/guards/internal-secret.guard';

@Module({
  imports: [ConfigModule],
  controllers: [InternalEmailController],
  providers: [EmailService, InternalSecretGuard],
  exports: [EmailService],
})
export class EmailModule {}
