import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  messageId: string;
  status: 'sent' | 'failed';
  failureReason?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly fcmUrl =
    'https://fcm.googleapis.com/v1/projects/{projectId}/messages:send';
  private readonly serverKey: string;
  private readonly projectId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.serverKey = this.config.get<string>('FCM_SERVER_KEY', '');
    this.projectId = this.config.get<string>('FCM_PROJECT_ID', '');
  }

  async sendToToken(
    fcmToken: string,
    payload: PushPayload,
  ): Promise<PushResult> {
    if (!this.serverKey) {
      this.logger.debug(`[PUSH SANDBOX] Token: ${fcmToken} | ${payload.title}`);
      return { messageId: `sandbox-${Date.now()}`, status: 'sent' };
    }

    try {
      const url = this.fcmUrl.replace('{projectId}', this.projectId);
      const body = {
        message: {
          token: fcmToken,
          notification: { title: payload.title, body: payload.body },
          data: payload.data ?? {},
          android: { priority: 'high' },
          apns: { headers: { 'apns-priority': '10' } },
          webpush: {
            notification: { icon: '/icon-192.png' },
          },
        },
      };

      const { data } = await firstValueFrom(
        this.http.post(url, body, {
          headers: {
            Authorization: `Bearer ${this.serverKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return { messageId: data.name ?? '', status: 'sent' };
    } catch (err: any) {
      this.logger.error(`Push send failed`, err?.message);
      return {
        messageId: '',
        status: 'failed',
        failureReason: err?.response?.data?.error?.message ?? err?.message,
      };
    }
  }

  async sendToTokens(
    tokens: string[],
    payload: PushPayload,
  ): Promise<PushResult[]> {
    return Promise.all(tokens.map((t) => this.sendToToken(t, payload)));
  }
}