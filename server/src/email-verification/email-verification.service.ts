// email-verification/email-verification.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import VerificationTokenPayload from './verificationTokenPayload.interface';
import { UsersService } from '../users/users.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { EmailService } from '../email/email.service';
import { EMAIL_CONFIRMATION } from './email-verification.constants';
import { formatTimeDuration } from '../../utils/time-utils';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly featureFlagsService: FeatureFlagsService,
  ) {}

  private async isEnabled(): Promise<boolean> {
    return this.featureFlagsService.isEnabled(EMAIL_CONFIRMATION.FEATURE_FLAG);
  }

  /**
   * Send verification link to user's email
   */
  public async sendVerificationLink(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log(`Sending verification link to: ${email}`);

    // Check feature flag
    if (!(await this.isEnabled())) {
      this.logger.warn('Email verification feature disabled');
      return {
        success: false,
        message: 'Email verification is currently disabled.',
      };
    }

    // Validate email
    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('Valid email is required');
    }

    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate verification token
    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_VERIFICATION_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    // Generate verification URL
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const url = `${frontendUrl}/auth/confirmEmail/${token}`;

    // Generate email content
    const emailContent = this.generateVerificationEmail(url, email);

    // Send email
    await this.emailService.send({
      to: email,
      subject: EMAIL_CONFIRMATION.SUBJECT,
      body: emailContent.text,
      html: emailContent.html,
    });

    this.logger.log(`Verification email sent to: ${email}`);
    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  }

  /**
   * Resend verification link
   */
  public async resendConfirmationLink(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!(await this.isEnabled())) {
      return {
        success: false,
        message: 'Email verification is currently disabled.',
      };
    }

    const user = await this.usersService.findByEmail(email);

    if (!user || user.isEmailVerified) {
      return {
        success: true,
        message:
          'If an unverified account exists for this email, a verification email has been sent.',
      };
    }

    await this.sendVerificationLink(user.email);

    return {
      success: true,
      message:
        'If an unverified account exists for this email, a verification email has been sent.',
    };
  }

  /**
   * Confirm email with token
   */
  public async confirmEmail(email: string): Promise<{
    message: string;
  }> {
    this.logger.log(`Confirming email: ${email}`);

    if (!(await this.isEnabled())) {
      return {
        message: 'Email verification is currently disabled.',
      };
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.usersService.markEmailAsVerified(email);

    return {
      message: 'Your AgroSense account has been successfully verified.',
    };
  }

  /**
   * Decode and validate confirmation token
   */
  public async decodeConfirmationToken(token: string): Promise<string> {
    this.logger.debug('Decoding confirmation token');

    if (!(await this.isEnabled())) {
      throw new BadRequestException(
        'Email verification is currently disabled.',
      );
    }

    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      });

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }

      throw new BadRequestException('Invalid token payload');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }
      throw new BadRequestException('Bad confirmation token');
    }
  }

  /**
   * Generate verification email content
   */
  private generateVerificationEmail(
    url: string,
    email: string,
  ): { text: string; html: string } {
    const expirySeconds = this.configService.get<number>(
      'JWT_VERIFICATION_TOKEN_EXPIRATION_TIME',
      3600, // default 1 hour
    );
    const expiryTime = formatTimeDuration(expirySeconds);

    const text = `Welcome to AgroSense! Please confirm your email by clicking this link: ${url}\n\nThis link expires in ${expiryTime}.`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a, #15803d); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0; }
            .footer { color: #6b7280; font-size: 12px; text-align: center; padding: 16px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0;">🌾 AgroSense</h1>
              <p style="margin:4px 0 0; opacity:0.9;">Smart Farm Management</p>
            </div>
            <div class="content">
              <h2>Welcome to AgroSense!</h2>
              <p>Thank you for joining AgroSense. Please confirm your email address to get started.</p>
              <p style="text-align:center;">
                <a href="${url}" class="button">Confirm Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p><a href="${url}" style="color: #16a34a;">${url}</a></p>
              <p class="expiry-info">⏰ This link expires in <strong>${expiryTime}</strong>.</p>
              <p>If you didn't create an account with AgroSense, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AgroSense. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return { text, html };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
