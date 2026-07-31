import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { EmailConfirmationController } from './email-verification.controller';

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    JwtModule.register({}),
    UsersModule,
    FeatureFlagsModule,
  ],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
  controllers: [EmailConfirmationController],
})
export class EmailVerificationModule {}
