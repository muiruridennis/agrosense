import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from '../farms/entities/farm.entity';
import { DailyAdvisoryProcessor } from './processors/daily-advisory.processor';
import { JobsScheduler } from './jobs.scheduler';
import { ADVISORY_QUEUE } from './processors/daily-advisory.processor';
import { DiseaseEngineModule } from '../disease-engine/disease-engine.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CropsModule } from '../crops/crops.module';
import { DairyModule } from '../dairy/dairy.module';
import { SmallRuminantsModule } from '../smallruminants/smallruminants.module';
import { PoultryModule } from '../poultry/poultry.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: ADVISORY_QUEUE }),
    TypeOrmModule.forFeature([Farm]),
    DiseaseEngineModule,
    RecommendationsModule,
    NotificationsModule,
    CropsModule,
    DairyModule,
    SmallRuminantsModule,
    PoultryModule
  ],
  providers: [DailyAdvisoryProcessor, JobsScheduler],
  exports: [JobsScheduler],
})
export class JobsModule {}