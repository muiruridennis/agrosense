import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flock } from './entities/flock.entity';
import { FlockService } from './flock.service';
import { FlockController } from './flock.controller';
import { PoultryHousesModule } from '../poultry-houses/poultry-houses.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';
import { PricingModule } from '../pricing/pricing.module';

/**
 * FlockModule
 *
 * Owns the Flock aggregate: lifecycle (placed → closed), stage
 * transitions, economicAssumptions, and bird/egg sales (still jsonb
 * columns on Flock, not separate tables — revisit as its own module
 * if sales outgrow that).
 *
 * Deliberately does NOT depend on FlockRecordsModule. Anything that
 * needs cross-referenced record data (closeFlock, performance
 * benchmarking, forecasting) lives in FlockAnalyticsModule instead —
 * that's what keeps this module and FlockRecordsModule from needing
 * each other in both directions.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Flock]),
    PoultryHousesModule,
    FarmMembersModule,
    PricingModule,
  ],
  controllers: [FlockController],
  providers: [FlockService],
  exports: [FlockService],
})
export class FlockModule {}