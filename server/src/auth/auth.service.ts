import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { v4 as uuid } from 'uuid';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/auth.dto';
import {
  TokenPayload,
  RefreshTokenPayload,
} from './interfaces/token-payload.interface';
import { AuthCookie } from './interfaces/auth-cookie.interface';
import * as bcrypt from 'bcrypt';
import { PostgresErrorCode } from '../database/postgresErrorCodes.enum';

@Injectable()
export class AuthService {
  private readonly isProd: boolean;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.isProd = config.get<string>('NODE_ENV') === 'production';
  }

   async validateUser(identifier: string, password: string): Promise<any> {
    // Check if identifier is email (contains @) or phone number
    const isEmail = identifier.includes('@');
    
    let user;
    if (isEmail) {
      user = await this.usersService.findByEmail(identifier);
    } else {
      // Clean phone number (remove spaces, ensure format)
      const cleanPhone = identifier.replace(/\s/g, '');
      user = await this.usersService.findByPhoneNumber(cleanPhone);
    }
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }
    
    // Remove sensitive data
    const { password: _pw, currentHashedRefreshToken: _rt, ...result } = user;
    return result;
  }

  // ── Registration ──────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
  ): Promise<Omit<User, 'password' | 'hashedRefreshToken'>> {
    try {
      const user = await this.usersService.createUser(dto);
      const {
        password: _pw,
        currentHashedRefreshToken: _rt,
        ...safe
      } = user as any;
      return safe;
    } catch (err: any) {
      if (err?.code === PostgresErrorCode.UniqueViolation) {
        throw new ConflictException(
          'A user with these credentials already exists',
        );
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  // ── Cookie builders — single source of truth ──────────────────────────────

  // Not async — no await inside, returns value directly
  getCookieWithJwtAccessToken(user: User): AuthCookie {
    const payload: TokenPayload = {
      sub: user.id,
      phone: user.phoneNumber,
      role: user.role,
    };

    const secret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const expiresIn = this.config.get<string>('JWT_ACCESS_EXPIRY', '15m');

    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as any,
    });

    return {
      name: 'access_token',
      value: token,
      options: {
        httpOnly: true,
        secure: this.isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: this.toMs(expiresIn),
      },
    };
  }

  getCookieWithJwtRefreshToken(user: User): AuthCookie & { rawToken: string } {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      phone: user.phoneNumber,
      role: user.role,
      tokenFamily: uuid(),
    };

    const secret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRY', '30d');

    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn: expiresIn as any,
    });

    return {
      name: 'refresh_token',
      value: token,
      rawToken: token,
      options: {
        httpOnly: true,
        secure: this.isProd,
        sameSite: 'lax',
        path: '/', 
        maxAge: this.toMs(expiresIn),
      },
    };
  }

  getCookiesForLogOut(): AuthCookie[] {
    return [
      {
        name: 'access_token',
        value: '',
        options: {
          httpOnly: true,
          secure: this.isProd,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        },
      },
      {
        name: 'refresh_token',
        value: '',
        options: {
          httpOnly: true,
          secure: this.isProd,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        },
      },
    ];
  }

  // ── Token lifecycle ───────────────────────────────────────────────────────

  async issueTokens(user: User, res: Response): Promise<void> {
    const accessCookie = this.getCookieWithJwtAccessToken(user);
    const refreshCookie = this.getCookieWithJwtRefreshToken(user);

    // Store hashed refresh token — never the raw value
    await this.usersService.setCurrentRefreshToken(
      user.id,
      refreshCookie.rawToken,
    );

    res.cookie(accessCookie.name, accessCookie.value, accessCookie.options);
    res.cookie(refreshCookie.name, refreshCookie.value, refreshCookie.options);
  }

  async revokeTokens(userId: string, res: Response): Promise<void> {
    await this.usersService.removeRefreshToken(userId);

    const logoutCookies = this.getCookiesForLogOut();
    for (const c of logoutCookies) {
      res.cookie(c.name, c.value, c.options);
    }
  }

  async updateLastLogin(userId: string, timestamp: Date): Promise<void> {
    await this.usersService.updateLastLogin(userId, timestamp);
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  private toMs(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);
    const map: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return (map[unit] ?? 60_000) * value;
  }

  
}
