import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicationRecord } from './entities/medication-record.entity';
import { MedicationService } from './medication.service';
import { MedicationController } from './medication.controller';
import { FlockModule } from '../flock/flock.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';

/**
 * MedicationModule
 *
 * Owns treatment courses as their own lifecycle — sibling to
 * FlockRecordsModule, not nested inside it. A MedicationRecord spans
 * multiple days and has its own state machine (active -> completed/
 * cancelled -> withdrawal -> withdrawal complete), fundamentally
 * different from a daily operational measurement.
 *
 * Deliberately NOT capability-gated by FlockType (unlike egg/growth data
 * in FlockRecordsModule) — every flock type can be medicated. No
 * exclusivity constraint either — concurrent treatment courses are
 * legitimate.
 *
 * No medication catalog in V1 — records are free-text per the actual
 * treatment given, not references into a reusable drug database. Revisit
 * that abstraction once real usage data shows whether it's needed.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MedicationRecord]),
    FlockModule,
    FarmMembersModule,
  ],
  controllers: [MedicationController],
  providers: [MedicationService],
  exports: [MedicationService],
})
export class MedicationModule {}