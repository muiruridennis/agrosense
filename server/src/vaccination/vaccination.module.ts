import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VaccinationController } from './vaccination.controller';
import { VaccinationService } from './vaccination.service';

import { VaccinationRecord } from './entities/vaccination-record.entity';
import { VaccinationSchedule } from './entities/vaccination-schedule.entity';

import { FlockModule } from '../flock/flock.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';
import { NotificationModule } from '../notifications/notifications.module';

/**
 * FarmMembersModule added — required by FarmRoleGuard, now used on the
 * deleteRecord route. Wasn't previously imported because no guard in this
 * module used it at all.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([VaccinationRecord, VaccinationSchedule]),
    FlockModule,
    FarmMembersModule,
    NotificationModule
  ],
  controllers: [VaccinationController],
  providers: [VaccinationService],
  exports: [VaccinationService],
})
export class VaccinationModule {}
