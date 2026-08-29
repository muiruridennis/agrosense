import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SchedulerService } from './scheduler.service';
import { SchedulerLockService } from './scheduler-lock.service';
import { JobRunLog } from './entities/job-run-log.entity';

import { VaccinationScheduler } from './tasks/vaccination.scheduler';
import { NotificationScheduler } from './tasks/notification.scheduler';
import { SystemScheduler } from './tasks/system.scheduler';

import { VaccinationModule } from '../vaccination/vaccination.module';
// NotificationScheduler is still a stub (see tasks/notification.scheduler.ts)
// — wire in the real NotificationModule here once that TODO is implemented,
// the same way VaccinationModule is wired in below.

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([JobRunLog]),
    VaccinationModule,
  ],
  providers: [
    SchedulerService,
    SchedulerLockService,
    VaccinationScheduler,
    NotificationScheduler,
    SystemScheduler,
  ],
  exports: [SchedulerService],
})
export class SchedulerModule {}
