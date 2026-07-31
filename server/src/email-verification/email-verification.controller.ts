import {
  Controller,
  ClassSerializerInterceptor,
  UseInterceptors,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import FeatureFlagGuard from '../feature-flags/featureFlag.guard';
import { EmailVerificationService } from './email-verification.service';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { EMAIL_CONFIRMATION } from './email-verification.constants';
import { ResendVerificationEmailDto } from './dtos/ResendVerificationEmailDto.dto';

@Controller('email-verification')
@UseInterceptors(ClassSerializerInterceptor)
export class EmailConfirmationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('confirm')
  @UseGuards(FeatureFlagGuard(EMAIL_CONFIRMATION.FEATURE_FLAG))
  async confirm(@Body() confirmationData: { token: string }) {

    const email = await this.emailVerificationService.decodeConfirmationToken(
      confirmationData.token,
    );
    await this.emailVerificationService.confirmEmail(email);
  }

  @Post('resend-confirmation-link')
  @UseGuards(FeatureFlagGuard(EMAIL_CONFIRMATION.FEATURE_FLAG))
  async resendConfirmationLink(@Body() dto: ResendVerificationEmailDto) {
    return this.emailVerificationService.resendConfirmationLink(dto.email);
  }
}
