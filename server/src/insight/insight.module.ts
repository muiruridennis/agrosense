// insight/insight.module.ts

import { Module } from '@nestjs/common';
import { InsightService } from './insight.service';
import { InsightController } from './insight.controller';
import { BenchmarkService } from './benchmark.service';
import { FlockAnalyticsModule } from '../flock-analytics/flock-analytics.module';
import { FlockModule } from '../flock/flock.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';


@Module({
  imports: [
    FlockAnalyticsModule,
    FlockModule,
    FarmMembersModule,
  ],
  controllers: [InsightController],
  providers: [
    InsightService,
    BenchmarkService,
  ],
  exports: [InsightService, BenchmarkService],
})
export class InsightModule {}