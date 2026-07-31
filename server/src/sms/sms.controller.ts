// sms/sms.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { AfricasTalkingProvider } from './providers/africas-talking.provider';

class SendSmsDto {
  to: string;
  message: string;
}

class SendBulkSmsDto {
  to: string[];
  message: string;
}

@Controller('sms')
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly provider: AfricasTalkingProvider,
  ) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * HEALTH & STATUS ENDPOINTS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Health check for SMS service
   * GET /sms/health
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{
    status: 'ok' | 'error';
    service: string;
    timestamp: Date;
  }> {
    try {
      // Try to fetch balance to verify connectivity
      await this.provider.checkBalance();

      return {
        status: 'ok',
        service: 'SMS',
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        service: 'SMS',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get account balance
   * GET /sms/balance
   */
  @Get('balance')
  @HttpCode(HttpStatus.OK)
  async getBalance(): Promise<{
    success: boolean;
    balance?: string;
    currency?: string;
    error?: string;
    timestamp: Date;
  }> {
    try {
      const result = await this.provider.checkBalance();
      return {
        success: true,
        balance: result.balance,
        currency: result.currency,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get account details
   * GET /sms/account
   */
  @Get('account')
  @HttpCode(HttpStatus.OK)
  async getAccountDetails(): Promise<{
    success: boolean;
    username?: string;
    email?: string;
    error?: string;
    timestamp: Date;
  }> {
    try {
      const result = await this.provider.getUserDetails();
      return {
        success: true,
        username: result.UserData?.username,
        email: result.UserData?.email,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * SMS OPERATIONS - SEND MESSAGES
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Send single SMS
   * POST /sms/send
   */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendSms(
    @Body() dto: SendSmsDto,
  ): Promise<{
    success: true;
    correlationId: string;
    messageId: string;
    status: string;
    recipient: string;
    timestamp: Date;
  }> {
    const result = await this.smsService.send({
      to: dto.to,
      message: dto.message,
    });

    return {
      success: true,
      correlationId: result.correlationId,
      messageId: result.messageId,
      status: result.status,
      recipient: dto.to,
      timestamp: new Date(),
    };
  }

  /**
   * Send bulk SMS
   * POST /sms/bulk
   */
  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  async sendBulkSms(
    @Body() dto: SendBulkSmsDto,
  ): Promise<{
    success: true;
    correlationId: string;
    total: number;
    sent: number;
    failed: number;
    results: Array<{
      recipient: string;
      messageId?: string;
      status?: string;
      error?: string;
    }>;
    timestamp: Date;
  }> {
    const result = await this.smsService.sendBulk({
      to: dto.to,
      message: dto.message,
    });

    return {
      success: true,
      correlationId: result.correlationId,
      total: result.total,
      sent: result.sent,
      failed: result.failed,
      results: result.results,
      timestamp: new Date(),
    };
  }

  /**
   * Send test SMS
   * POST /sms/test
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async sendTestSms(
    @Body() dto: { to: string; message: string },
  ): Promise<{
    success: true;
    correlationId: string;
    messageId: string;
    status: string;
    recipient: string;
    timestamp: Date;
  }> {
    const result = await this.smsService.send({
      to: dto.to,
      message: dto.message,
    });

    return {
      success: true,
      correlationId: result.correlationId,
      messageId: result.messageId,
      status: result.status,
      recipient: dto.to,
      timestamp: new Date(),
    };
  }
}