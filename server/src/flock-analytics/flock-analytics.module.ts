import { Module } from '@nestjs/common';
import { FlockAnalyticsService } from './flock-analytics.service';
import { FlockAnalyticsController } from './flock-analytics.controller';
import { FlockModule } from '../flock/flock.module';
import { FlockRecordsModule } from '../flock-records/flock-records.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';

/**
 * FlockAnalyticsModule
 *
 * Owns NO entity — it's a read/compose layer over Flock + FlockRecord
 * data. Home for getFlockSummary, forecastFlockPerformance,
 * benchmarkFlockPerformance, and closeFlock.
 *
 * closeFlock lives here rather than in FlockModule specifically
 * because closure needs aggregate record stats (finalMortalityPercent,
 * finalCullingPercent, feedConversionRatio, feedPerDozenEggs) — putting
 * it in FlockModule would force FlockModule to depend on
 * FlockRecordsModule, which already depends on FlockModule. This
 * module is what breaks that cycle: it's the only place allowed to
 * depend on both.
 */
@Module({
  imports: [FlockModule, FlockRecordsModule, FarmMembersModule],
  controllers: [FlockAnalyticsController],
  providers: [FlockAnalyticsService],
  exports: [FlockAnalyticsService],
})
export class FlockAnalyticsModule {}