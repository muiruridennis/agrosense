import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetController } from './password-reset.controller';

import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([PasswordResetToken]),

    UsersModule,
    EmailModule,
  ],

  controllers: [PasswordResetController],

  providers: [PasswordResetService],

  exports: [PasswordResetService],
})
export class PasswordResetModule {}
