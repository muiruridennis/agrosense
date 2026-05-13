import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { CustomLocalStrategy } from './strategies/custom-local.strategy';
import { FarmRoleGuard } from './guards/roles.guard';
import { FarmAccessGuard } from './guards/farm-access.guard';
import { FarmMembersModule } from '../farm-members/farm-members.module';

@Module({
  imports: [
    UsersModule,
    FarmMembersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: 15 * 60 * 1000, // 15 minutes in milliseconds
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy, CustomLocalStrategy,   FarmAccessGuard,         // ✅ Register the guard
    FarmRoleGuard,   ],
  exports: [AuthService, FarmAccessGuard, FarmRoleGuard],
})
export class AuthModule {}
