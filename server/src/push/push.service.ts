import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { App } from 'firebase-admin/app';
import {
  getMessaging,
  type MulticastMessage,
  type BatchResponse,
} from 'firebase-admin/messaging';

import { PushToken } from './entities/push-token.entity';
import { FIREBASE_ADMIN } from './push.constants';
import { RegisterPushTokenDto } from './dtos/register-push-token.dto';

export interface SendPushParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
}

export interface SendPushResult {
  messageId: string;
  status: 'sent' | 'partial' | 'failed';
  successCount: number;
  failureCount: number;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @Inject(FIREBASE_ADMIN)
    private readonly firebaseApp: App,
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
  ) {}

  async send(params: SendPushParams): Promise<SendPushResult> {
    const tokens = await this.getTokensForUser(params.userId);

    if (tokens.length === 0) {
      this.logger.debug(`No active push tokens for user ${params.userId}`);
      return {
        messageId: '',
        status: 'failed',
        successCount: 0,
        failureCount: 0,
      };
    }

    const isHighPriority = params.priority === 'high';

    const message: MulticastMessage = {
      tokens: tokens.map((t) => t.token),
      notification: {
        title: params.title,
        body: params.body,
      },
      data: this.stringifyData(params.data ?? {}),
      android: {
        priority: isHighPriority ? 'high' : 'normal',
      },
      apns: {
        headers: {
          'apns-priority': isHighPriority ? '10' : '5',
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192.png',
        },
      },
    };

    let response: BatchResponse;

    try {
      response = await getMessaging(this.firebaseApp).sendEachForMulticast(
        message,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`FCM multicast send failed: ${message}`);
      throw error;
    }

    await Promise.all(
      response.responses.map((res, i) => {
        if (!res.success && this.isInvalidTokenError(res.error?.code)) {
          return this.deactivateToken(tokens[i].token);
        }
        return Promise.resolve();
      }),
    );

    const status: SendPushResult['status'] =
      response.successCount === 0
        ? 'failed'
        : response.failureCount > 0
          ? 'partial'
          : 'sent';

    this.logger.log(
      `Push to user ${params.userId}: ${response.successCount} sent, ${response.failureCount} failed`,
    );

    if (status === 'failed') {
      throw new Error(
        response.responses[0]?.error?.message ??
          'All device push deliveries failed',
      );
    }

    return {
      messageId: response.responses.find((r) => r.success)?.messageId ?? '',
      status,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  }

  async registerToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<PushToken> {
    let record = await this.pushTokenRepo.findOne({
      where: { token: dto.token },
    });

    if (record) {
      record.userId = userId;
      record.deviceType = dto.deviceType;
      record.deviceName = dto.deviceName ?? record.deviceName;
      record.deviceModel = dto.deviceModel ?? record.deviceModel;
      record.osVersion = dto.osVersion ?? record.osVersion;
      record.appVersion = dto.appVersion ?? record.appVersion;
      record.active = true;
      record.lastUsedAt = new Date();
    } else {
      record = this.pushTokenRepo.create({
        userId,
        token: dto.token,
        deviceType: dto.deviceType,
        deviceName: dto.deviceName ?? null,
        deviceModel: dto.deviceModel ?? null,
        osVersion: dto.osVersion ?? null,
        appVersion: dto.appVersion ?? null,
        active: true,
        lastUsedAt: new Date(),
      });
    }

    return this.pushTokenRepo.save(record);
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.pushTokenRepo.delete({ userId, token });
  }

  async getTokensForUser(userId: string): Promise<PushToken[]> {
    return this.pushTokenRepo.find({ where: { userId, active: true } });
  }

  private async deactivateToken(token: string): Promise<void> {
    await this.pushTokenRepo.update({ token }, { active: false });
    this.logger.warn(`Deactivated invalid push token: ${token}`);
  }

  private isInvalidTokenError(code?: string): boolean {
    if (!code) return false;

    return [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
    ].includes(code);
  }

  private stringifyData(data: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)]),
    );
  }
}