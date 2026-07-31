import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/auth.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthenticationGuard } from './guards/jwt-authentication.guard';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import { AuthGuard } from '@nestjs/passport';
import { EmailVerificationService } from '../email-verification/email-verification.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  // POST /auth/register
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(dto);
    await this.emailVerificationService.sendVerificationLink(dto.email);
    return user;
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('custom-local'))
  // @UseGuards(LocalAuthenticationGuard)
  async login(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user } = req;
    await this.authService.issueTokens(user, res);
    await this.authService.updateLastLogin(user.id, new Date());
    // TransformInterceptor wraps → { success: true, data: user, timestamp }
    return user;
  }

  // POST /auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthenticationGuard)
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeTokens(req.user.id, res);
    // TransformInterceptor wraps → { success: true, data: { message }, timestamp }
    return { message: 'Successfully logged out' };
  }

  // GET /auth/currentuser
  @Get('currentuser')
  @UseGuards(JwtAuthenticationGuard)
  getCurrentUser(@Req() req: RequestWithUser) {
    const { currentHashedRefreshToken: _rt, password: _pw, ...safe } = req.user;
    // Return plain object — TransformInterceptor wraps it
    // Result: { success: true, data: { id, email, ... }, timestamp }
    return safe;
  }

  // GET /auth/refresh
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { currentHashedRefreshToken: _rt, password: _pw, ...safe } = req.user;
    await this.authService.issueTokens(req.user, res);
    // Return plain object — TransformInterceptor wraps it
    // Result: { success: true, data: { id, email, ... }, timestamp }
    return safe;
  }
}
