import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlockRecord } from './entities/flock-record.entity';
import { FlockRecordsService } from './flock-records.service';
import { FlockRecordsController } from './flock-records.controller';
import { FlockModule } from '../flock/flock.module';
import { PricingModule } from '../pricing/pricing.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';
import { EggCollection } from './entities/egg-collection.entity';
import { GrowthRecord } from './entities/growth-record.entity';

/**
 * FlockRecordsModule
 *
 * Owns the FlockRecord entity and all daily create/submit/review flow,
 * plus per-record KPI derivation (production rate, uniformity %,
 * per-record FCR, health risk score).
 *
 * Depends on FlockModule ONE WAY ONLY: reads flock context
 * (currentCount, type, economicAssumptions) via FlockService, and
 * writes cumulative totals back the same way (feedCostTotal,
 * revenueTotal, currentCount) — never via a raw Repository<Flock>,
 * to keep Flock's invariants inside FlockService where they belong.
 *
 * Does NOT import FlockModule's dependents and must never import
 * FlockAnalyticsModule — that module depends on this one, not the
 * other way round.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([FlockRecord, EggCollection, GrowthRecord]),
    FlockModule,
    PricingModule,
    FarmMembersModule,
  ],
  controllers: [FlockRecordsController],
  providers: [FlockRecordsService],
  exports: [FlockRecordsService],
})
export class FlockRecordsModule {}
