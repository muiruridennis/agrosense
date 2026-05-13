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
import { RecommendationsModule } from './recommendations/recommendations.module';
import { AlertsModule } from './alerts/alerts.module';
import { RecordsModule } from './records/records.module';
import { WeatherModule } from './weather/weather.module';
import { CropsModule } from './crops/crops.module';
import { DiseaseEngineModule } from './disease-engine/disease-engine.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { JobsModule } from './jobs/jobs.module';
import { CreditProfileModule } from './credit-profile/credit-profile.module';
import { CommonModule } from './common/common.module';
import { PlotsModule } from './plots/plots.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AdvisorModule } from './advisor/advisor.module';
import { PoultryModule } from './poultry/poultry.module';
import { FarmMembersModule } from './farm-members/farm-members.module';
import { DairyModule } from './dairy/dairy.module';
import { SmallRuminantsModule } from './smallruminants/smallruminants.module';
import { HealthEventModule } from './health-event/health-event.module';
import { InventoryModule } from './inventory/inventory.module';
import { FinanceModule } from './finance/finance.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
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
        AT_API_KEY: Joi.string().allow('').optional(),
        AT_USERNAME: Joi.string().default('sandbox'),
        FCM_SERVER_KEY: Joi.string().allow('').optional(),
        FCM_PROJECT_ID: Joi.string().allow('').optional(),

        // Groq AI
        GROQ_API_KEY: Joi.string().required(),

        WEATHER_API_URL: Joi.string().uri().required(),
      }),
    }),
    EventEmitterModule.forRoot({
      global: true, // optional, but recommended
    }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'redis'),
          port: config.get<number>('REDIS_PORT', 6379),
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 20,
          removeOnFail: 10,
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>('REDIS_HOST', 'redis'),
        port: config.get<number>('REDIS_PORT', 6379),
        ttl: 600,
        lazyConnect: true,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      }),
      inject: [ConfigService],
    }),

    // ── Bull queues ────────────────────────────────────────────────────────
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'redis'),
          port: config.get<number>('REDIS_PORT', 6379),
          lazyConnect: true,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 20,
          removeOnFail: 10,
        },
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    FarmsModule,
    AuthModule,
    RecommendationsModule,
    AlertsModule,
    RecordsModule,
    WeatherModule,
    CropsModule,
    DiseaseEngineModule,
    NotificationsModule,
    ReportsModule,
    JobsModule,
    CreditProfileModule,
    CommonModule,
    PlotsModule,
    DatabaseModule,
    HealthModule,
    AdvisorModule,
    PoultryModule,
    FarmMembersModule,
    DairyModule,
    SmallRuminantsModule,
    HealthEventModule,
    InventoryModule,
    FinanceModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
