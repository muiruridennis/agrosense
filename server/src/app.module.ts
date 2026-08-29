import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import * as Joi from 'joi';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthModule } from './auth/auth.module';
import { FarmsModule } from './farms/farms.module';
import { UsersModule } from './users/users.module';
import { RecordsModule } from './records/records.module';
import { NotificationModule } from './notifications/notifications.module';
import { QueueModule } from './queues/queues.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AdvisorModule } from './advisor/advisor.module';
import { FarmMembersModule } from './farm-members/farm-members.module';
import { InventoryModule } from './inventory/inventory.module';
import { FinanceModule } from './finance/finance.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { PricingModule } from './pricing/pricing.module';
import { SmsModule } from './sms/sms.module';
import { EmailModule } from './email/email.module';
import { InAppModule } from './inapp/inapp.module';
import { PushModule } from './push/push.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { EmailVerificationModule } from './email-verification/email-verification.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { PoultryHousesModule } from './poultry-houses/poultry-houses.module';
import { FlockModule } from './flock/flock.module';
import { FlockRecordsModule } from './flock-records/flock-records.module';
import { FlockAnalyticsModule } from './flock-analytics/flock-analytics.module';
import { InsightModule } from './insight/insight.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { MedicationModule } from './medication/medication.module';
import { VaccinationModule } from './vaccination/vaccination.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { parseRedisUrl } from './common/redis-url.util';

@Module({
  imports: [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. INFRASTRUCTURE / CORE MODULES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),

        // Database
        DATABASE_URL: Joi.string().required(),

        // Redis
        REDIS_HOST: Joi.string().default('redis'),
        REDIS_PORT: Joi.number().default(6379),

        // Auth
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRY: Joi.string().default('30d'),

        // Optional — SMS and push
        // AT_API_KEY: Joi.string().allow('').optional(),
        // AT_USERNAME: Joi.string().default('sandbox'),
        // FCM_SERVER_KEY: Joi.string().allow('').optional(),
        // FCM_PROJECT_ID: Joi.string().allow('').optional(),

        // Groq AI
        GROQ_API_KEY: Joi.string().required(),

        WEATHER_API_URL: Joi.string().uri().required(),

        AFRICAS_TALKING_USERNAME: Joi.string().required(),
        AFRICAS_TALKING_API_KEY: Joi.string().required(),

        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_SECURE: Joi.boolean().required(),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        MAIL_FROM_EMAIL: Joi.string().email().required(),
        MAIL_FROM_NAME: Joi.string().required(),

        FCM_PROJECT_ID: Joi.string().required(),
        FCM_CLIENT_EMAIL: Joi.string().email().required(),
        FCM_PRIVATE_KEY: Joi.string().required(),

        JWT_VERIFICATION_TOKEN_SECRET: Joi.string().required(),
        JWT_VERIFICATION_TOKEN_EXPIRATION_TIME: Joi.number().required(),
        PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES: Joi.number(),
      }),
    }),

    EventEmitterModule.forRoot({
      global: true,
    }),

    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return {
          redis: {
            ...(redisUrl
              ? parseRedisUrl(redisUrl)
              : {
                  host: config.get<string>('REDIS_HOST', 'redis'),
                  port: config.get<number>('REDIS_PORT', 6379),
                }),
            maxRetriesPerRequest: null,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 20,
            removeOnFail: 10,
          },
        };
      },
      inject: [ConfigService],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return {
          store: redisStore,
          ...(redisUrl
            ? parseRedisUrl(redisUrl)
            : {
                host: config.get<string>('REDIS_HOST', 'redis'),
                port: config.get<number>('REDIS_PORT', 6379),
              }),
          ttl: 600,
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        };
      },
      inject: [ConfigService],
    }),

    DatabaseModule,

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. FEATURE MODULES (Dependencies for QueueModule)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Core feature modules
    UsersModule,
    FarmsModule,
    AuthModule,

    // Channel modules (QueueModule depends on these)
    SmsModule, // ✅ Moved UP
    EmailModule, // ✅ Moved UP
    InAppModule, // ✅ Moved UP
    PushModule, // ✅ Moved UP

    // Domain modules
    InventoryModule,
    FinanceModule,
    FarmMembersModule,
    IntegrationsModule,
    PricingModule,

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. MODULES THAT QueueModule DEPENDS ON
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    RecordsModule,
    NotificationModule,

    QueueModule,

    CommonModule,
    HealthModule,
    AdvisorModule,
    FeatureFlagsModule,
    EmailVerificationModule,
    PasswordResetModule,
    PoultryHousesModule,
    FlockModule,
    FlockRecordsModule,
    FlockAnalyticsModule,
    InsightModule,
    RecommendationModule,
    MedicationModule,
    VaccinationModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
