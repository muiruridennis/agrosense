// sms/providers/africas-talking.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './sms-provider.interface';

const africastalking = require('africastalking');

@Injectable()
export class AfricasTalkingProvider implements SmsProvider {
  private readonly logger = new Logger(AfricasTalkingProvider.name);
  private readonly client: any;
  private readonly senderId: string;
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('AFRICAS_TALKING_API_KEY');
    const username = this.configService.getOrThrow<string>('AFRICAS_TALKING_USERNAME');

    this.senderId = this.configService.get<string>('AFRICAS_TALKING_SENDER_ID', '');

    try {
      this.client = africastalking({ apiKey, username });
    } catch (error: any) {
      this.logger.error(`Failed to initialize SMS provider: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send single SMS with retry logic
   */
  async sendSms(data: { to: string; message: string }): Promise<{
    messageId: string;
    status: string;
  }> {
    // return this.sendWithRetry(data, 0);
    return this.sendOnce(data);
  }

  /**
   * Send SMS with automatic retry on failure
   */
  private async sendWithRetry(
  data: { to: string; message: string },
  attempt = 0,
): Promise<{ messageId: string; status: string }> {
  try {
    const payload: {
      to: string;
      message: string;
      from?: string;
    } = {
      to: data.to,
      message: data.message,
    };

    // Only include sender ID if configured
    if (this.senderId?.trim()) {
      payload.from = this.senderId;
    }

    const result = await this.client.SMS.send(payload);

    // Log full response during development
    this.logger.debug(
      `Africa's Talking Response: ${JSON.stringify(result, null, 2)}`,
    );

    const smsData = result?.SMSMessageData;

    if (!smsData) {
      throw new Error("Invalid response from Africa's Talking.");
    }

    const message = smsData.Message ?? '';
    const recipient = smsData.Recipients?.[0];

    // If there is no recipient, treat as failure
    if (!recipient) {
      throw new Error(message || 'No recipient returned.');
    }

    const status = recipient.status ?? 'Unknown';
    const statusCode = Number(recipient.statusCode);

    /**
     * Success
     *
     * Africa's Talking may return:
     * - "Success"
     * - "Queued"
     *
     * depending on route/provider.
     */
    if (
      status.toLowerCase() === 'success' ||
      status.toLowerCase() === 'queued'
    ) {
      this.logger.log(
        `SMS sent successfully to ${data.to} (${recipient.messageId})`,
      );

      return {
        messageId: recipient.messageId,
        status,
      };
    }

    // Permanent API errors
    const permanentErrors = [
      'InvalidSenderId',
      'InvalidPhoneNumber',
      'InsufficientBalance',
      'InvalidUsernameOrApiKey',
      'AuthenticationFailed',
    ];

    if (permanentErrors.some((e) => message.includes(e))) {
      throw new Error(message);
    }

    // If provider returned a failure status
    throw new Error(
      `${status} (${statusCode}) ${message}`.trim(),
    );
  } catch (error: any) {
    const errorMessage = error?.message ?? 'Unknown SMS error';

    /**
     * Don't retry permanent errors.
     */
    const permanentErrors = [
      'InvalidSenderId',
      'InvalidPhoneNumber',
      'InsufficientBalance',
      'InvalidUsernameOrApiKey',
      'AuthenticationFailed',
    ];

    const shouldRetry =
      !permanentErrors.some((e) => errorMessage.includes(e)) &&
      attempt < this.maxRetries;

    if (shouldRetry) {
      const delay = this.retryDelayMs * Math.pow(2, attempt);

      this.logger.warn(
        `SMS attempt ${attempt + 1} failed. Retrying in ${delay}ms... (${errorMessage})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.sendWithRetry(data, attempt + 1);
    }

    this.logger.error(
      `SMS failed after ${attempt + 1} attempt(s) to ${data.to}: ${errorMessage}`,
    );

    throw error;
  }
}

  /**
   * Send bulk SMS with batching and rate limiting
   */
  async sendBulk(data: { to: string[]; message: string }): Promise<{
    success: number;
    failed: number;
    results: Array<{
      recipient: string;
      messageId?: string;
      status?: string;
      error?: string;
    }>;
  }> {
    const results: Array<any> = [];
    const batchSize = 10;
    const delayBetweenBatches = 1000;

    for (let i = 0; i < data.to.length; i += batchSize) {
      const batch = data.to.slice(i, i + batchSize);

      // Send batch in parallel
      const batchPromises = batch.map((recipient) =>
        this.sendSms({ to: recipient, message: data.message })
          .then((result) => ({
            recipient,
            messageId: result.messageId,
            status: result.status,
            error: null,
          }))
          .catch((error: any) => ({
            recipient,
            messageId: null,
            status: null,
            error: error.message,
          })),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches to avoid rate limiting
      if (i + batchSize < data.to.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const success = results.filter((r) => !r.error).length;
    const failed = results.filter((r) => r.error).length;

    return { success, failed, results };
  }

  /**
   * Check account balance
   */
  async checkBalance(): Promise<{ balance: string; currency: string }> {
    try {
      const result = await this.client.Account.fetchBalance();
      return {
        balance: result.balance,
        currency: result.currency || 'KES',
      };
    } catch (error: any) {
      this.logger.error(`Failed to check balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user details
   */
  async getUserDetails(): Promise<any> {
    try {
      return await this.client?.Account.fetchUser();
    } catch (error: any) {
      this.logger.error(`Failed to fetch user details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map status codes to messages
   */
  private getStatusMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      100: 'Message queued',
      101: 'Network error',
      102: 'Invalid sender ID',
      201: 'Invalid phone number',
      202: 'Message too long',
      203: 'Invalid message format',
      401: 'Insufficient credit',
      403: 'Account suspended',
      500: 'Server error',
      501: 'Gateway unavailable',
    };
    return messages[statusCode] || 'Unknown error';
  }
  private async sendOnce(
  data: {
    to: string;
    message: string;
  },
): Promise<{
  messageId: string;
  status: string;
}> {
  try {
    const payload: {
      to: string;
      message: string;
      from?: string;
    } = {
      to: data.to,
      message: data.message,
    };

    if (this.senderId?.trim()) {
      payload.from = this.senderId;
    }

    const result = await this.client.SMS.send(payload);

    this.logger.debug(
      `Africa's Talking Response: ${JSON.stringify(result, null, 2)}`,
    );

    const smsData = result?.SMSMessageData;

    if (!smsData) {
      throw new Error("Invalid response from Africa's Talking.");
    }

    const recipient = smsData.Recipients?.[0];

    if (!recipient) {
      throw new Error(smsData.Message || 'No recipient returned.');
    }

    const status = recipient.status ?? 'Unknown';

    if (
      status.toLowerCase() === 'success' ||
      status.toLowerCase() === 'queued'
    ) {
      this.logger.log(
        `SMS sent successfully to ${data.to} (${recipient.messageId})`,
      );

      return {
        messageId: recipient.messageId,
        status,
      };
    }

    throw new Error(
      `${status} (${recipient.statusCode}) ${smsData.Message}`,
    );
  } catch (error: any) {
    this.logger.error(
      `Failed sending SMS to ${data.to}: ${error.message}`,
    );

    throw error;
  }
}
}