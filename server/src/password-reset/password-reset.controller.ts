import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { PasswordResetService } from './password-reset.service';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('password-reset')
export class PasswordResetController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
  ) {}

  /**
   * Request a password reset email.
   *
   * POST /password-reset/forgot
   */
  @Post('forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.passwordResetService.forgotPassword(dto);
  }

  /**
   * Validate a password reset token.
   *
   * POST /password-reset/validate
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateToken(
    @Body('token') token: string,
  ) {
    return this.passwordResetService.validateToken(token);
  }

  /**
   * Set a new password.
   *
   * POST /password-reset/reset
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.passwordResetService.resetPassword(dto);
  }
}
