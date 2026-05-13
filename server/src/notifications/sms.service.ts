import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface SmsResult {
  messageId: string;
  status: 'sent' | 'failed';
  failureReason?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly username: string;
  private readonly senderId: string;
  private readonly baseUrl = 'https://api.africastalking.com/version1/messaging';

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.apiKey = this.config.get<string>('AT_API_KEY', '');
    this.username = this.config.get<string>('AT_USERNAME', 'sandbox');
    this.senderId = this.config.get<string>('AT_SENDER_ID', 'AgroSense');
  }

  async send(to: string, message: string): Promise<SmsResult> {
    // Truncate to 160 chars for single SMS — important for low-cost delivery
    const body = message.length > 160 ? message.slice(0, 157) + '...' : message;

    if (!this.apiKey || this.username === 'sandbox') {
      this.logger.debug(`[SMS SANDBOX] To: ${to} | Body: ${body}`);
      return { messageId: `sandbox-${Date.now()}`, status: 'sent' };
    }

    try {
      const params = new URLSearchParams({
        username: this.username,
        to,
        message: body,
        from: this.senderId,
      });

      const { data } = await firstValueFrom(
        this.http.post(this.baseUrl, params.toString(), {
          headers: {
            apiKey: this.apiKey,
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      const recipient = data?.SMSMessageData?.Recipients?.[0];
      const success = recipient?.status === 'Success';

      return {
        messageId: recipient?.messageId ?? '',
        status: success ? 'sent' : 'failed',
        failureReason: success ? undefined : recipient?.status,
      };
    } catch (err: any) {
      this.logger.error(`SMS send failed to ${to}`, err?.message);
      return {
        messageId: '',
        status: 'failed',
        failureReason: err?.message,
      };
    }
  }

  async sendBulk(
    recipients: { phone: string; message: string }[],
  ): Promise<SmsResult[]> {
    return Promise.all(recipients.map((r) => this.send(r.phone, r.message)));
  }
}