// email/email.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';

@Controller('email')
@UseGuards(JwtAuthenticationGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('logs')
  async getLogs(
    @Query() query: {
      referenceId?: string;
      referenceType?: string;
      status?: 'pending' | 'sent' | 'failed';
      limit?: number;
      offset?: number;
    },
  ) {
    return this.emailService.getEmailLogs(query);
  }

  @Get('stats')
  async getStats(@Query('days') days?: number) {
    return this.emailService.getEmailStats(days || 7);
  }

  @Post('test')
  async testEmail(@Body() data: { to: string; subject: string; message: string }) {
    return this.emailService.send({
      to: data.to,
      subject: data.subject,
      body: data.message,
      saveLog: true,
    });
  }
}