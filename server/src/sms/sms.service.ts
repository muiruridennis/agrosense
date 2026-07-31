// sms/sms.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { SmsProvider } from './providers/sms-provider.interface';
import { SMS_PROVIDER } from './sms.constants';
import { Inject } from '@nestjs/common';

interface SmsRequest {
  correlationId: string;
  to: string;
  message: string;
  sentAt: Date;
  result?: {
    messageId: string;
    status: string;
  };
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly sentSmsLog: Map<string, SmsRequest> = new Map();

  constructor(
    @Inject(SMS_PROVIDER)
    private readonly provider: SmsProvider,
  ) {}

  /**
   * Send single SMS
   * @throws BadRequestException on validation error
   * @throws Error on Africa's Talking failure
   */
  async send(data: {
    to: string;
    message: string;
  }): Promise<{
    correlationId: string;
    messageId: string;
    status: string;
  }> {
    const correlationId = uuidv4();

    try {
      // Validate phone number
      const phoneNumber = this.validateAndFormatPhoneNumber(data.to);

      // Validate message
      if (!data.message || data.message.trim().length === 0) {
        throw new BadRequestException('Message cannot be empty');
      }

      if (data.message.length > 160) {
        this.logger.warn(
          `Message for ${phoneNumber} exceeds 160 chars (${data.message.length}). Will be split into multiple SMS.`,
        );
      }

      // Truncate if too long for single SMS
      const message =
        data.message.length > 160 ? data.message.substring(0, 157) + '...' : data.message;

      // Send via provider (no sandbox fake success)
      const result = await this.provider.sendSms({
        to: phoneNumber,
        message,
      });

      // Log success
      this.sentSmsLog.set(correlationId, {
        correlationId,
        to: phoneNumber,
        message,
        sentAt: new Date(),
        result,
      });

      this.logger.log(
        `SMS sent [${correlationId}] to ${phoneNumber} - MessageID: ${result.messageId}`,
      );

      return {
        correlationId,
        messageId: result.messageId,
        status: result.status,
      };
    } catch (error: any) {
      // Log failure
      this.sentSmsLog.set(correlationId, {
        correlationId,
        to: data.to,
        message: data.message,
        sentAt: new Date(),
        error: error.message,
      });

      this.logger.error(`SMS failed [${correlationId}] to ${data.to}: ${error.message}`);

      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Send bulk SMS
   * @throws Error on validation failure
   */
  async sendBulk(data: {
    to: string[];
    message: string;
  }): Promise<{
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
  }> {
    const correlationId = uuidv4();

    if (!data.to || data.to.length === 0) {
      throw new BadRequestException('Recipients list cannot be empty');
    }

    if (!data.message || data.message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    this.logger.log(
      `Bulk SMS [${correlationId}] - Sending to ${data.to.length} recipients`,
    );

    const providerResult = await this.provider.sendBulk({
      to: data.to,
      message: data.message,
    });

    this.logger.log(
      `Bulk SMS [${correlationId}] - Complete: ${providerResult.success} sent, ${providerResult.failed} failed`,
    );

    return {
      correlationId,
      total: data.to.length,
      sent: providerResult.success,
      failed: providerResult.failed,
      results: providerResult.results,
    };
  }

  /**
   * Validate and format phone number
   * @throws BadRequestException on invalid format
   */
  private validateAndFormatPhoneNumber(phone: string): string {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    // Remove spaces and common separators
    let cleaned = phone.replace(/[\s\-()]/g, '');

    // Remove non-digit characters except leading +
    if (cleaned.startsWith('+')) {
      cleaned = '+' + cleaned.substring(1).replace(/\D/g, '');
    } else {
      cleaned = cleaned.replace(/\D/g, '');
    }

    // Kenya format: 254XXXXXXXXX or +254XXXXXXXXX
    if (cleaned.startsWith('0')) {
      // Convert 0XXXXXXXXX to 254XXXXXXXXX
      cleaned = '254' + cleaned.substring(1);
    } else if (!cleaned.startsWith('254') && !cleaned.startsWith('+254')) {
      // If just 10 digits, assume Kenya
      if (cleaned.length === 10) {
        cleaned = '254' + cleaned;
      }
    }

    // Remove + if present for validation
    const digitsOnly = cleaned.replace('+', '');

    // Validate length (Kenya: 12 digits including 254)
    if (digitsOnly.length !== 12) {
      throw new BadRequestException(
        `Invalid phone number format. Expected Kenya format: 254XXXXXXXXX or +254XXXXXXXXX. Got: ${phone}`,
      );
    }

    // Validate starts with 254
    if (!digitsOnly.startsWith('254')) {
      throw new BadRequestException(
        `Invalid phone number. Must be Kenya number (starting with 254). Got: ${phone}`,
      );
    }

    // Validate third digit is not 0 (Kenya numbers don't have leading zero after 254)
    if (digitsOnly[3] === '0') {
      throw new BadRequestException(
        `Invalid phone number format. Got: ${phone}`,
      );
    }

    return '+' + digitsOnly;
  }

  /**
   * Get SMS request history (for debugging)
   */
  getSmsHistory(correlationId?: string): SmsRequest[] {
    if (correlationId) {
      const request = this.sentSmsLog.get(correlationId);
      return request ? [request] : [];
    }

    return Array.from(this.sentSmsLog.values());
  }

  /**
   * Clear SMS history
   */
  clearHistory(): void {
    this.sentSmsLog.clear();
  }
}