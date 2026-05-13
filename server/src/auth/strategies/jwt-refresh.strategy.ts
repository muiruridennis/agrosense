// strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          
          // ✅ Match your auth service cookie name
          const token = request?.cookies?.refresh_token;
          
          if (!token) {
            this.logger.debug('No refresh_token found in cookies');
          }
          
          return token;
        },
        // Optional: Also check Authorization header for refresh
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(request: Request, payload: any) {
    this.logger.debug('Refresh token payload:', payload);
    
    // ✅ Use 'sub' field (matches your auth service)
    const userId = payload.sub ;
    
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    const refreshToken = request.cookies?.refresh_token;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }
    
    
    // Verify refresh token matches stored hash
    const user = await this.usersService.getUserIfRefreshTokenMatches(
      refreshToken,
      userId,
    );
    
    if (!user) {
      this.logger.warn(`Invalid refresh token for user: ${userId}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
    
    this.logger.debug(`Refresh token validated for user: ${userId}`);
    return user;
  }
}