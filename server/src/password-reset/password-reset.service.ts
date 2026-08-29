import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';

import { PasswordResetToken } from './entities/password-reset-token.entity';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,

    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Request a password reset email.
   *
   * This method intentionally returns the same response whether
   * the email exists or not. This prevents account enumeration.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const email = dto.email.trim().toLowerCase();

    const genericResponse = {
      success: true,
      message:
        'If an account exists for this email, a password reset link has been sent.',
    };

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return genericResponse;
    }

    /*
     * Invalidate previous unused reset tokens.
     *
     * This means a newly requested reset link becomes the valid one.
     */
    await this.passwordResetTokenRepo
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({
        usedAt: new Date(),
      })
      .where('userId = :userId', { userId: user.id })
      .andWhere('usedAt IS NULL')
      .execute();

    /*
     * Generate a cryptographically secure random token.
     *
     * The raw token goes ONLY into the email.
     */
    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = this.hashToken(rawToken);

    const expirationMinutes = Number(
      this.configService.get('PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES', 30),
    );

    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    await this.passwordResetTokenRepo.save({
      userId: user.id,
      tokenHash,
      expiresAt,
      usedAt: null,
    });

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    const resetUrl = `${frontendUrl}/auth/reset-password/${encodeURIComponent(rawToken)}`;

    await this.emailService.send({
      to: user.email,
      subject: 'Reset your AgroSense password',
      html: `
        <h3>Hello ${user.fullName},</h3>

        <p>
          We received a request to reset your AgroSense password.
        </p>

        <p>
          <a href="${resetUrl}">
            Reset your password
          </a>
        </p>

        <p>
          This link will expire in ${expirationMinutes} minutes
          and can only be used once.
        </p>

        <p>
          If you did not request this password reset, you can safely
          ignore this email.
        </p>
      `,
    });

    this.logger.log(`Password reset requested for user ${user.id}`);

    return genericResponse;
  }

  /**
   * Reset a user's password using the raw token received
   * from the frontend.
   */
  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.hashToken(dto.token);

    const resetToken = await this.passwordResetTokenRepo.findOne({
      where: {
        tokenHash,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException(
        'This password reset link has already been used.',
      );
    }

    if (resetToken.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('This password reset link has expired.');
    }

    const user = await this.usersService.getById(resetToken.userId);

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const hashedPassword = await this.usersService.hashPassword(dto.password);

    await this.usersService.resetPassword(user.email, hashedPassword);

    /*
     * Mark token as consumed.
     */
    resetToken.usedAt = new Date();

    await this.passwordResetTokenRepo.save(resetToken);

    this.logger.log(`Password successfully reset for user ${user.id}`);

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  }

  /**
   * Validate a reset token without consuming it.
   *
   * Useful for the frontend reset-password page.
   */
  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; message: string }> {
    const tokenHash = this.hashToken(token);

    const resetToken = await this.passwordResetTokenRepo.findOne({
      where: {
        tokenHash,
      },
    });

    if (!resetToken) {
      return {
        valid: false,
        message: 'Invalid password reset link.',
      };
    }

    if (resetToken.usedAt) {
      return {
        valid: false,
        message: 'This password reset link has already been used.',
      };
    }

    if (resetToken.expiresAt.getTime() <= Date.now()) {
      return {
        valid: false,
        message: 'This password reset link has expired.',
      };
    }

    return {
      valid: true,
      message: 'Password reset link is valid.',
    };
  }

  /**
   * SHA-256 hash used to safely store reset tokens.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
