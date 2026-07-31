import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';

import { PushToken } from './entities/push-token.entity';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { FIREBASE_ADMIN } from './push.constants';

@Module({
  imports: [TypeOrmModule.forFeature([PushToken])],
  controllers: [PushController],
  providers: [
    PushService,
    {
      provide: FIREBASE_ADMIN,
      inject: [ConfigService],
      useFactory: (config: ConfigService): App => {
        if (getApps().length > 0) {
          return getApp();
        }

        return initializeApp({
          credential: cert({
            projectId: config.getOrThrow<string>('FCM_PROJECT_ID'),
            clientEmail: config.getOrThrow<string>('FCM_CLIENT_EMAIL'),
            privateKey: config
              .getOrThrow<string>('FCM_PRIVATE_KEY')
              .replace(/\\n/g, '\n'),
          }),
        });
      },
    },
  ],
  exports: [PushService],
})
export class PushModule {}