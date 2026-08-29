// vaccination/vaccination.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { FlockService } from '../flock/flock.service';
import { Flock } from '../flock/entities/flock.entity';
import { FlockStatus } from '../flock/enums';

import { VaccinationRecord } from './entities/vaccination-record.entity';
import { VaccinationSchedule } from './entities/vaccination-schedule.entity';

import { CreateVaccinationRecordDto } from './dto/create-vaccination-record.dto';
import { UpdateVaccinationRecordDto } from './dto/update-vaccination-record.dto';
import { CreateVaccinationScheduleDto } from './dto/create-vaccination-schedule.dto';
import { UpdateVaccinationScheduleDto } from './dto/update-vaccination-schedule.dto';

import { VaccinationStatus } from './enums/vaccination-status.enum';
import {
  VaccinationNotificationType,
  VACCINATION_SCHEDULE_REFERENCE_TYPE,
} from './enums/vaccination-notification-type.enum';

import { NotificationService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/entities/notification-delivery.entity';
import { NotificationPriority } from '../notifications/enums';

import { FarmMembersService } from '../farm-members/farm-members.service';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';

@Injectable()
export class VaccinationService {
  private readonly logger = new Logger(VaccinationService.name);

  /** Max rows loaded into memory per batch by the scheduler sweeps. */
  private readonly SCHEDULER_BATCH_SIZE = 200;

  /**
   * Max distance (in either direction) between a record's vaccination
   * date and a pending schedule's date for auto-matching to link them.
   */
  private readonly AUTO_MATCH_WINDOW_DAYS = 7;

  /**
   * How many days past scheduledDate a still-PENDING schedule is left
   * alone before the daily sweep auto-marks it MISSED. Due-today and
   * just-overdue schedules are deliberately left untouched — a farmer
   * may still complete them that day or shortly after. Only genuinely
   * abandoned schedules get auto-transitioned; anything sooner should
   * stay a manual decision via the existing markScheduleMissed endpoint.
   */
  private readonly MISSED_GRACE_PERIOD_DAYS = 3;

  constructor(
    @InjectRepository(VaccinationRecord)
    private readonly recordRepository: Repository<VaccinationRecord>,

    @InjectRepository(VaccinationSchedule)
    private readonly scheduleRepository: Repository<VaccinationSchedule>,

    private readonly flockService: FlockService,

    private readonly notificationService: NotificationService,

    private readonly farmMembersService: FarmMembersService,

    private readonly dataSource: DataSource,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // VACCINATION RECORDS
  // ═══════════════════════════════════════════════════════════════════════

  async createRecord(
    flockId: string,
    farmId: string,
    dto: CreateVaccinationRecordDto,
  ): Promise<VaccinationRecord> {
    const flock = await this.flockService.getFlock(flockId, farmId);

    // ── 1. Validate basic inputs ──────────────────────────────────────

    this.assertFlockCanReceiveVaccinations(flock);
    this.validateBirdsVaccinated(flock, dto.birdsVaccinated);

    const vaccinationDate = new Date(dto.vaccinationDate);
    this.validateVaccinationDate(vaccinationDate);

    const expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    this.validateExpiryDate(vaccinationDate, expiryDate);

    // ── 2. Resolve schedule (fail-fast existence/ownership check only —
    //      coverage-critical validation happens inside the transaction
    //      below, against a row-locked read, not this snapshot) ─────────

    if (dto.scheduleId) {
      await this.findSchedule(flockId, farmId, dto.scheduleId);
    }

    // ── 3. Create record in transaction ───────────────────────────────

    return this.dataSource.transaction(async (manager) => {
      let schedule: VaccinationSchedule | null = null;

      if (dto.scheduleId) {
        // ── Schedule explicitly provided ──────────────────────────────

        schedule = await this.lockSchedule(manager, dto.scheduleId);

        if (!schedule) {
          throw new NotFoundException('Vaccination schedule not found');
        }

        this.validateScheduleCanReceiveVaccinations(schedule);
        this.validateRecordMatchesSchedule(schedule, dto);
        this.validateCoverageLimit(
          schedule,
          dto.birdsVaccinated,
          this.getEffectiveTarget(schedule, flock),
        );
      } else {
        // ── No schedule provided — try to auto-match within a bounded
        //    date window (never "nearest pending, regardless of distance")

        const candidate = await this.findMatchingPendingSchedule(
          flockId,
          dto.vaccineName,
          vaccinationDate,
        );

        if (candidate) {
          schedule = await this.lockSchedule(manager, candidate.id);
        }

        if (schedule) {
          this.validateScheduleCanReceiveVaccinations(schedule);
          this.validateRecordMatchesSchedule(schedule, dto);
          this.validateCoverageLimit(
            schedule,
            dto.birdsVaccinated,
            this.getEffectiveTarget(schedule, flock),
          );
        }
      }

      // ── 3a. Create schedule if none exists ─────────────────────────

      if (!schedule) {
        schedule = manager.create(VaccinationSchedule, {
          flockId,
          vaccineName: dto.vaccineName,
          targetDisease: dto.targetDisease ?? null,
          scheduledDate: vaccinationDate,
          targetBirds: flock.currentCount,
          vaccinatedBirds: 0,
          status: VaccinationStatus.PENDING,
          notes: 'Auto-created from vaccination record',
        });

        schedule = await manager.save(VaccinationSchedule, schedule);
      }

      // ── 3b. Create vaccination record ─────────────────────────────

      const record = manager.create(VaccinationRecord, {
        flockId,
        scheduleId: schedule.id,
        vaccineName: dto.vaccineName,
        targetDisease: dto.targetDisease ?? null,
        vaccinationDate,
        dose: dto.dose ?? null,
        route: dto.route,
        birdsVaccinated: dto.birdsVaccinated,
        batchNumber: dto.batchNumber ?? null,
        expiryDate,
        administeredBy: dto.administeredBy ?? null,
        notes: dto.notes ?? null,
      });

      const savedRecord = await manager.save(VaccinationRecord, record);

      // ── 3c. Recalculate schedule coverage against the live flock ───

      await this.recalculateScheduleCoverage(manager, schedule.id, flock);

      return savedRecord;
    });
  }

  async findRecords(
    flockId: string,
    farmId: string,
  ): Promise<VaccinationRecord[]> {
    await this.flockService.getFlock(flockId, farmId);

    return this.recordRepository.find({
      where: { flockId },
      order: {
        vaccinationDate: 'DESC',
        createdAt: 'DESC',
      },
      relations: ['schedule'],
    });
  }

  async findRecord(
    flockId: string,
    farmId: string,
    recordId: string,
  ): Promise<VaccinationRecord> {
    await this.flockService.getFlock(flockId, farmId);

    const record = await this.recordRepository.findOne({
      where: {
        id: recordId,
        flockId,
      },
      relations: ['schedule'],
    });

    if (!record) {
      throw new NotFoundException('Vaccination record not found');
    }

    return record;
  }

  async updateRecord(
    flockId: string,
    farmId: string,
    recordId: string,
    dto: UpdateVaccinationRecordDto,
  ): Promise<VaccinationRecord> {
    const record = await this.findRecord(flockId, farmId, recordId);
    const flock = await this.flockService.getFlock(flockId, farmId);

    // ── 1. Validate dates ─────────────────────────────────────────────

    const vaccinationDate = dto.vaccinationDate
      ? new Date(dto.vaccinationDate)
      : record.vaccinationDate;

    const expiryDate =
      dto.expiryDate !== undefined
        ? dto.expiryDate
          ? new Date(dto.expiryDate)
          : null
        : record.expiryDate;

    this.validateVaccinationDate(vaccinationDate);
    this.validateExpiryDate(vaccinationDate, expiryDate);

    // ── 2. Validate birds vaccinated ─────────────────────────────────

    if (dto.birdsVaccinated !== undefined) {
      this.validateBirdsVaccinated(flock, dto.birdsVaccinated);
    }

    // ── 3. Track schedule re-link and fail-fast on the new schedule ───

    const previousScheduleId = record.scheduleId;
    const scheduleIdChanging =
      dto.scheduleId !== undefined &&
      (dto.scheduleId ?? null) !== previousScheduleId;

    if (scheduleIdChanging && dto.scheduleId) {
      await this.findSchedule(flockId, farmId, dto.scheduleId);
    }

    return this.dataSource.transaction(async (manager) => {
      // ── 3a. Handle schedule re-linking ────────────────────────────

      if (scheduleIdChanging) {
        const newScheduleId = dto.scheduleId ?? null;

        if (newScheduleId) {
          const newSchedule = await this.lockSchedule(manager, newScheduleId);

          if (!newSchedule) {
            throw new NotFoundException('Vaccination schedule not found');
          }

          // ✅ Validate schedule can receive vaccinations
          this.validateScheduleCanReceiveVaccinations(newSchedule);

          // ✅ Validate vaccine/disease matches schedule
          this.validateRecordMatchesScheduleForUpdate(newSchedule, dto, record);

          // ✅ Validate coverage won't exceed target — the sum here
          //    correctly excludes this record, since it isn't linked to
          //    newSchedule yet at this point.
          const existingTotal = await this.getScheduleVaccinatedBirds(
            manager,
            newScheduleId,
          );

          const birdsVaccinated = dto.birdsVaccinated ?? record.birdsVaccinated;
          const effectiveTarget = this.getEffectiveTarget(newSchedule, flock);

          if (existingTotal + birdsVaccinated > effectiveTarget) {
            const remaining = effectiveTarget - existingTotal;
            throw new BadRequestException(
              `Vaccination would exceed the scheduled target of ${effectiveTarget} birds. ` +
                `Remaining coverage capacity: ${remaining} birds.`,
            );
          }
        }

        record.scheduleId = newScheduleId;
      }

      // ── 3b. Apply field updates ────────────────────────────────────

      if (dto.vaccineName !== undefined) {
        record.vaccineName = dto.vaccineName;
      }

      if (dto.targetDisease !== undefined) {
        record.targetDisease = dto.targetDisease ?? null;
      }

      if (dto.vaccinationDate !== undefined) {
        record.vaccinationDate = vaccinationDate;
      }

      if (dto.dose !== undefined) {
        record.dose = dto.dose ?? null;
      }

      if (dto.route !== undefined) {
        record.route = dto.route;
      }

      if (dto.birdsVaccinated !== undefined) {
        record.birdsVaccinated = dto.birdsVaccinated;
      }

      if (dto.batchNumber !== undefined) {
        record.batchNumber = dto.batchNumber ?? null;
      }

      if (dto.expiryDate !== undefined) {
        record.expiryDate = expiryDate;
      }

      if (dto.administeredBy !== undefined) {
        record.administeredBy = dto.administeredBy ?? null;
      }

      if (dto.notes !== undefined) {
        record.notes = dto.notes ?? null;
      }

      const savedRecord = await manager.save(VaccinationRecord, record);

      // ── 3c. Recalculate coverage for every schedule this update
      //        actually touched — the old one (birds just left it) and
      //        the current one (birds just entered, or a field changed).

      if (scheduleIdChanging && previousScheduleId) {
        await this.recalculateScheduleCoverage(
          manager,
          previousScheduleId,
          flock,
        );
      }

      if (record.scheduleId) {
        await this.recalculateScheduleCoverage(
          manager,
          record.scheduleId,
          flock,
        );
      }

      return savedRecord;
    });
  }

  async deleteRecord(
    flockId: string,
    farmId: string,
    recordId: string,
  ): Promise<void> {
    const record = await this.findRecord(flockId, farmId, recordId);
    const flock = await this.flockService.getFlock(flockId, farmId);

    const scheduleId = record.scheduleId;

    await this.dataSource.transaction(async (manager) => {
      // ── 1. Delete the record ────────────────────────────────────────

      await manager.remove(VaccinationRecord, record);

      // ── 2. Recalculate the linked schedule's coverage from scratch —
      //      not just flip its status, actually re-sum what's left ────

      if (scheduleId) {
        await this.recalculateScheduleCoverage(manager, scheduleId, flock);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VACCINATION SCHEDULES
  // ═══════════════════════════════════════════════════════════════════════

  async createSchedule(
    flockId: string,
    farmId: string,
    dto: CreateVaccinationScheduleDto,
  ): Promise<VaccinationSchedule> {
    const flock = await this.flockService.getFlock(flockId, farmId);

    this.assertFlockCanReceiveVaccinations(flock);

    const scheduledDate = new Date(dto.scheduledDate);
    this.validateDate(scheduledDate, 'Scheduled date');

    if (flock.currentCount <= 0) {
      throw new BadRequestException(
        'Cannot create a vaccination schedule for a flock with no birds',
      );
    }

    const schedule = this.scheduleRepository.create({
      flockId,
      vaccineName: dto.vaccineName,
      targetDisease: dto.targetDisease ?? null,
      scheduledDate,
      recommendedAgeWeeks: dto.recommendedAgeWeeks ?? null,
      targetBirds: flock.currentCount,
      vaccinatedBirds: 0,
      status: VaccinationStatus.PENDING,
      notes: dto.notes ?? null,
    });

    return this.scheduleRepository.save(schedule);
  }

  async findSchedules(
    flockId: string,
    farmId: string,
  ): Promise<VaccinationSchedule[]> {
    await this.flockService.getFlock(flockId, farmId);

    return this.scheduleRepository.find({
      where: { flockId },
      order: {
        scheduledDate: 'ASC',
      },
      relations: ['vaccinationRecords'],
    });
  }

  async findSchedule(
    flockId: string,
    farmId: string,
    scheduleId: string,
  ): Promise<VaccinationSchedule> {
    await this.flockService.getFlock(flockId, farmId);

    const schedule = await this.scheduleRepository.findOne({
      where: {
        id: scheduleId,
        flockId,
      },
      relations: ['vaccinationRecords'],
    });

    if (!schedule) {
      throw new NotFoundException('Vaccination schedule not found');
    }

    return schedule;
  }

  async updateSchedule(
    flockId: string,
    farmId: string,
    scheduleId: string,
    dto: UpdateVaccinationScheduleDto,
  ): Promise<VaccinationSchedule> {
    const schedule = await this.findSchedule(flockId, farmId, scheduleId);

    if (schedule.status !== VaccinationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending vaccination schedules can be edited',
      );
    }

    if (dto.vaccineName !== undefined) {
      schedule.vaccineName = dto.vaccineName;
    }

    if (dto.targetDisease !== undefined) {
      schedule.targetDisease = dto.targetDisease ?? null;
    }

    if (dto.scheduledDate !== undefined) {
      const scheduledDate = new Date(dto.scheduledDate);
      this.validateDate(scheduledDate, 'Scheduled date');
      schedule.scheduledDate = scheduledDate;
    }

    if (dto.recommendedAgeWeeks !== undefined) {
      schedule.recommendedAgeWeeks = dto.recommendedAgeWeeks ?? null;
    }

    if (dto.notes !== undefined) {
      schedule.notes = dto.notes ?? null;
    }

    return this.scheduleRepository.save(schedule);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCHEDULE LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════

  async markScheduleMissed(
    flockId: string,
    farmId: string,
    scheduleId: string,
  ): Promise<VaccinationSchedule> {
    const schedule = await this.findSchedule(flockId, farmId, scheduleId);

    if (schedule.status !== VaccinationStatus.PENDING) {
      throw new ConflictException(
        `Cannot mark a ${schedule.status.toLowerCase()} schedule as missed`,
      );
    }

    if (schedule.scheduledDate >= new Date()) {
      throw new BadRequestException(
        'A future vaccination cannot be marked as missed',
      );
    }

    schedule.status = VaccinationStatus.MISSED;

    return this.scheduleRepository.save(schedule);
  }

  async cancelSchedule(
    flockId: string,
    farmId: string,
    scheduleId: string,
  ): Promise<VaccinationSchedule> {
    const schedule = await this.findSchedule(flockId, farmId, scheduleId);

    if (schedule.status !== VaccinationStatus.PENDING) {
      throw new ConflictException(
        `Cannot cancel a ${schedule.status.toLowerCase()} schedule`,
      );
    }

    schedule.status = VaccinationStatus.CANCELLED;

    return this.scheduleRepository.save(schedule);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UPCOMING & OVERDUE
  // ═══════════════════════════════════════════════════════════════════════

  async getUpcomingSchedules(
    flockId: string,
    farmId: string,
    days = 7,
  ): Promise<VaccinationSchedule[]> {
    await this.flockService.getFlock(flockId, farmId);

    if (days < 0 || days > 365) {
      throw new BadRequestException('Days must be between 0 and 365');
    }

    const today = this.startOfDay(new Date());
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.flockId = :flockId', { flockId })
      .andWhere('schedule.status = :status', {
        status: VaccinationStatus.PENDING,
      })
      .andWhere('schedule.scheduledDate >= :today', { today })
      .andWhere('schedule.scheduledDate <= :endDate', { endDate })
      .orderBy('schedule.scheduledDate', 'ASC')
      .getMany();
  }

  async getOverdueSchedules(
    flockId: string,
    farmId: string,
  ): Promise<VaccinationSchedule[]> {
    await this.flockService.getFlock(flockId, farmId);

    const today = this.startOfDay(new Date());

    return this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.flockId = :flockId', { flockId })
      .andWhere('schedule.status = :status', {
        status: VaccinationStatus.PENDING,
      })
      .andWhere('schedule.scheduledDate < :today', { today })
      .orderBy('schedule.scheduledDate', 'ASC')
      .getMany();
  }

  /**
   * Entry point for the daily scheduler sweep. Scoped globally (not
   * per-flock/farm) since this is a system job, not a request handler.
   *
   * `checked` is a cheap COUNT of every due-or-overdue PENDING schedule,
   * for observability. The actual work only ever loads/locks schedules
   * that are past the grace period — a schedule that's merely due today
   * is never pulled into memory at all, since we already know tonight's
   * sweep won't act on it. Processed in bounded batches rather than one
   * unbounded query, since at scale "every overdue schedule across every
   * farm" can be a very large set.
   */
  async processScheduledVaccinations(): Promise<{
    checked: number;
    autoMissed: number;
    failed: number;
  }> {
    const now = new Date();

    const graceDeadline = new Date(now);
    graceDeadline.setDate(graceDeadline.getDate() - this.MISSED_GRACE_PERIOD_DAYS);

    const checked = await this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.status = :status', { status: VaccinationStatus.PENDING })
      .andWhere('schedule.scheduledDate <= :now', { now })
      .getCount();

    let autoMissed = 0;
    let failed = 0;
    const excludedIds = new Set<string>();

    // Repeatedly query "still-eligible" schedules with no OFFSET — a
    // successful transition removes a row from this WHERE clause, so a
    // fresh query each batch makes forward progress safely. A schedule
    // that keeps failing is excluded after its first failure so it can't
    // stall the sweep indefinitely.
    for (;;) {
      const qb = this.scheduleRepository
        .createQueryBuilder('schedule')
        .where('schedule.status = :status', { status: VaccinationStatus.PENDING })
        .andWhere('schedule.scheduledDate <= :graceDeadline', { graceDeadline })
        .orderBy('schedule.scheduledDate', 'ASC')
        .limit(this.SCHEDULER_BATCH_SIZE);

      if (excludedIds.size > 0) {
        qb.andWhere('schedule.id NOT IN (:...excludedIds)', {
          excludedIds: Array.from(excludedIds),
        });
      }

      const batch = await qb.getMany();
      if (batch.length === 0) {
        break;
      }

      for (const schedule of batch) {
        try {
          const wasMarkedMissed = await this.markScheduleMissedIfStillEligible(
            schedule.id,
            graceDeadline,
          );
          if (wasMarkedMissed) {
            autoMissed += 1;

            // Fired only after the transaction above has committed — the
            // lock is already released by this point, and a notification
            // failure here can't roll back a status change that already
            // happened. Isolated in its own try/catch: the transition
            // already succeeded, so a notify failure shouldn't count as
            // a processing failure or exclude this (already-terminal)
            // schedule from anything.
            try {
              await this.notifyScheduleMissed(schedule);
            } catch (notifyError) {
              this.logger.error(
                `Marked schedule ${schedule.id} missed but failed to notify: ${
                  notifyError instanceof Error ? notifyError.message : String(notifyError)
                }`,
              );
            }
          }
        } catch (error) {
          // One bad schedule should not prevent the remaining
          // schedules from being processed.
          failed += 1;
          excludedIds.add(schedule.id);

          this.logger.error(
            `Failed to process vaccination schedule ${schedule.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      if (batch.length < this.SCHEDULER_BATCH_SIZE) {
        break;
      }
    }

    return { checked, autoMissed, failed };
  }

  /**
   * Locks the schedule and re-verifies it's still PENDING and still past
   * the grace deadline before transitioning to MISSED. Both could have
   * changed since the batch query above ran — a farmer may have just
   * completed the vaccination (createRecord -> recalculateScheduleCoverage
   * sets COMPLETED) or rescheduled it forward. Re-checking under the lock,
   * rather than trusting the batch snapshot, is what makes this safe
   * against that race and safe to re-run: a second sweep against an
   * already-MISSED or now-COMPLETED schedule is a no-op.
   */
  private async markScheduleMissedIfStillEligible(
    scheduleId: string,
    graceDeadline: Date,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const schedule = await this.lockSchedule(manager, scheduleId);

      if (!schedule) {
        return false;
      }

      if (schedule.status !== VaccinationStatus.PENDING) {
        return false;
      }

      if (schedule.scheduledDate > graceDeadline) {
        return false;
      }

      schedule.status = VaccinationStatus.MISSED;
      await manager.save(VaccinationSchedule, schedule);

      return true;
    });
  }

  /**
   * Entry point for a due-reminder scheduler sweep — distinct from
   * processScheduledVaccinations (which handles the MISSED transition):
   * this fires *before* the grace period expires, once per schedule ever
   * (deduped via NotificationService.hasBeenNotified), so a farmer gets
   * one heads-up rather than a repeat every morning the cron runs.
   */
  async notifyDueSchedules(): Promise<{
    checked: number;
    notified: number;
    failed: number;
  }> {
    const now = new Date();
    let checked = 0;
    let notified = 0;
    let failed = 0;
    let lastId: string | null = null;

    for (;;) {
      const qb = this.scheduleRepository
        .createQueryBuilder('schedule')
        .where('schedule.status = :status', { status: VaccinationStatus.PENDING })
        .andWhere('schedule.scheduledDate <= :now', { now })
        .orderBy('schedule.id', 'ASC')
        .limit(this.SCHEDULER_BATCH_SIZE);

      if (lastId) {
        qb.andWhere('schedule.id > :lastId', { lastId });
      }

      const batch = await qb.getMany();
      if (batch.length === 0) {
        break;
      }

      for (const schedule of batch) {
        checked += 1;

        try {
          const wasNotified = await this.notifyScheduleDue(schedule);
          if (wasNotified) {
            notified += 1;
          }
        } catch (error) {
          failed += 1;

          this.logger.error(
            `Failed to send due-reminder for vaccination schedule ${schedule.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      lastId = batch[batch.length - 1].id;

      if (batch.length < this.SCHEDULER_BATCH_SIZE) {
        break;
      }
    }

    return { checked, notified, failed };
  }

  /**
   * Fired once, right after a schedule transitions to MISSED. Unlike
   * notifyScheduleDue, no hasBeenNotified dedup check is needed — the
   * transition itself is the dedup: a schedule can only become MISSED
   * once (it leaves PENDING for good), so this is naturally called at
   * most once per schedule.
   */
  private async notifyScheduleMissed(schedule: VaccinationSchedule): Promise<void> {
    const recipient = await this.resolveNotificationRecipient(schedule.flockId);

    if (!recipient) {
      return;
    }

    await this.notificationService.send(recipient.userId, {
      farmId: recipient.farmId,
      title: 'Vaccination missed',
      body: `${schedule.vaccineName} vaccination was not completed and is now marked missed.`,
      channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
      priority: NotificationPriority.HIGH,
      category: VaccinationNotificationType.MISSED,
      data: { scheduleId: schedule.id, flockId: schedule.flockId },
      reference: {
        id: schedule.id,
        type: VACCINATION_SCHEDULE_REFERENCE_TYPE,
      },
    });
  }

  /**
   * Returns true if a due-reminder was actually sent for this schedule.
   */
  private async notifyScheduleDue(schedule: VaccinationSchedule): Promise<boolean> {
    const recipient = await this.resolveNotificationRecipient(schedule.flockId);

    if (!recipient) {
      return false;
    }

    const alreadyNotified = await this.notificationService.hasBeenNotified(
      VaccinationNotificationType.DUE,
      schedule.id,
      recipient.userId,
    );

    if (alreadyNotified) {
      return false;
    }

    await this.notificationService.send(recipient.userId, {
      farmId: recipient.farmId,
      title: 'Vaccination due',
      body: `${schedule.vaccineName} vaccination is due.`,
      channels: [NotificationChannel.IN_APP, NotificationChannel.SMS],
      priority: NotificationPriority.HIGH,
      category: VaccinationNotificationType.DUE,
      data: { scheduleId: schedule.id, flockId: schedule.flockId },
      reference: {
        id: schedule.id,
        type: VACCINATION_SCHEDULE_REFERENCE_TYPE,
      },
    });

    return true;
  }

  /**
   * Resolves a flock to the farm + userId a vaccination notification
   * should go to. Currently resolves to the farm's OWNER — escalating to
   * MANAGER as well (NotificationPreference already models
   * escalationRules.escalateTo) is a reasonable next step, not built yet
   * since it wasn't asked for.
   *
   * getMembers(farmId, requestingUserId) enforces nothing on
   * requestingUserId itself (that's done by the controller-level
   * @RequiredRoles guard, per FarmMembersService's own comments) — it's
   * only used for a debug log line, which is what makes it safe to call
   * from a system job with no real requesting user. 'system' is a
   * placeholder for that log line, not a real user id.
   */
  private async resolveNotificationRecipient(
    flockId: string,
  ): Promise<{ userId: string; farmId: string; phoneNumber: string | null } | null> {
    const flock = await this.flockService.getFlock(flockId);
    const farmId = flock.house.farmId;

    const members = await this.farmMembersService.getMembers(farmId, 'system');
    const owner = members.find((member) => member.role === FarmMemberRole.OWNER);

    if (!owner) {
      this.logger.warn(
        `No active owner found for farm ${farmId} (flock ${flockId}) — ` +
        `skipping vaccination notification.`,
      );
      return null;
    }

    return {
      userId: owner.userId,
      farmId,
      phoneNumber: owner.user?.phoneNumber ?? null,
    };
  }
   /* every non-terminal (PENDING/COMPLETED) schedule from its actual
   * linked records, via the same recalculateScheduleCoverage used by
   * every request-time mutation. This is a defensive backstop — it
   * shouldn't find anything once the request-time paths are correct,
   * but it's cheap insurance against exactly the class of silent-drift
   * bug this module had before (stale vaccinatedBirds cache, frozen
   * target vs. live population). A schedule found to have drifted is
   * corrected in place and logged; MISSED/CANCELLED schedules are
   * excluded since their coverage is frozen by design once terminal.
   *
   * Paginated by id (not offset) in bounded batches: id is immutable, so
   * this makes guaranteed forward progress regardless of how many rows
   * flip between PENDING and COMPLETED mid-sweep — an offset-based page
   * would risk skipping or re-visiting rows as the underlying set shifts.
   */
  async reconcileScheduleCoverage(): Promise<{
    checked: number;
    corrected: number;
    failed: number;
  }> {
    let checked = 0;
    let corrected = 0;
    let failed = 0;
    let lastId: string | null = null;

    for (;;) {
      const qb = this.scheduleRepository
        .createQueryBuilder('schedule')
        .select(['schedule.id', 'schedule.flockId'])
        .where('schedule.status IN (:...statuses)', {
          statuses: [VaccinationStatus.PENDING, VaccinationStatus.COMPLETED],
        })
        .orderBy('schedule.id', 'ASC')
        .limit(this.SCHEDULER_BATCH_SIZE);

      if (lastId) {
        qb.andWhere('schedule.id > :lastId', { lastId });
      }

      const batch = await qb.getMany();
      if (batch.length === 0) {
        break;
      }

      for (const schedule of batch) {
        checked += 1;

        try {
          const wasCorrected = await this.reconcileSingleSchedule(
            schedule.id,
            schedule.flockId,
          );

          if (wasCorrected) {
            corrected += 1;
          }
        } catch (error) {
          failed += 1;

          this.logger.error(
            `Failed to reconcile vaccination schedule ${schedule.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      lastId = batch[batch.length - 1].id;

      if (batch.length < this.SCHEDULER_BATCH_SIZE) {
        break;
      }
    }

    return { checked, corrected, failed };
  }

  /**
   * Returns true if reconciliation actually changed vaccinatedBirds or
   * status for this schedule (i.e. it had drifted from the truth).
   *
   * Locks once and reuses that locked read for the before/after
   * comparison — recalculateScheduleCoverage re-locks internally too
   * (harmless within the same transaction, just an extra round trip),
   * so this avoids taking an *unlocked* read for the "before" snapshot
   * the way an earlier version of this method did.
   */
  private async reconcileSingleSchedule(
    scheduleId: string,
    flockId: string,
  ): Promise<boolean> {
    // farmId omitted deliberately — this runs as a system job, not on
    // behalf of a specific farm's request, so there's no farm-ownership
    // boundary to enforce here (getFlock's farmId check is optional).
    const flock = await this.flockService.getFlock(flockId);

    return this.dataSource.transaction(async (manager) => {
      const before = await this.lockSchedule(manager, scheduleId);

      if (!before) {
        return false;
      }

      const beforeVaccinatedBirds = before.vaccinatedBirds;
      const beforeStatus = before.status;

      const after = await this.recalculateScheduleCoverage(
        manager,
        scheduleId,
        flock,
      );

      if (!after) {
        return false;
      }

      const corrected =
        after.vaccinatedBirds !== beforeVaccinatedBirds ||
        after.status !== beforeStatus;

      if (corrected) {
        this.logger.warn(
          `Reconciled vaccination schedule ${scheduleId}: vaccinatedBirds ` +
          `${beforeVaccinatedBirds} -> ${after.vaccinatedBirds}, status ` +
          `${beforeStatus} -> ${after.status}`,
        );
      }

      return corrected;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VALIDATION METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Validate that a schedule can receive vaccinations
   *
   * - COMPLETED: Already fully vaccinated
   * - CANCELLED: Was cancelled
   * - MISSED: Was missed
   */
  private validateScheduleCanReceiveVaccinations(
    schedule: VaccinationSchedule,
  ): void {
    if (schedule.status === VaccinationStatus.COMPLETED) {
      throw new BadRequestException(
        `Vaccination schedule is already completed ` +
          `(${schedule.vaccinatedBirds}/${schedule.targetBirds} birds vaccinated)`,
      );
    }

    if (schedule.status === VaccinationStatus.CANCELLED) {
      throw new BadRequestException('Vaccination schedule has been cancelled');
    }

    if (schedule.status === VaccinationStatus.MISSED) {
      throw new BadRequestException(
        'Vaccination schedule has been marked as missed',
      );
    }
  }

  /**
   * Validate that the vaccination record matches the scheduled vaccine
   *
   * Prevents:
   * - Recording Gumboro against a Newcastle schedule
   * - Recording any vaccine against the wrong schedule
   */
  private validateRecordMatchesSchedule(
    schedule: VaccinationSchedule,
    dto: CreateVaccinationRecordDto,
  ): void {
    const scheduleVaccine = schedule.vaccineName.trim().toLowerCase();
    const recordVaccine = dto.vaccineName.trim().toLowerCase();

    if (recordVaccine !== scheduleVaccine) {
      throw new BadRequestException(
        `Vaccine "${dto.vaccineName}" does not match the scheduled vaccine "${schedule.vaccineName}"`,
      );
    }

    if (schedule.targetDisease && dto.targetDisease) {
      const scheduleDisease = schedule.targetDisease.trim().toLowerCase();
      const recordDisease = dto.targetDisease.trim().toLowerCase();

      if (recordDisease !== scheduleDisease) {
        throw new BadRequestException(
          `Target disease "${dto.targetDisease}" does not match the scheduled disease "${schedule.targetDisease}"`,
        );
      }
    }
  }

  /**
   * Validate that the vaccination record matches the schedule (for updates)
   *
   * Same as above but uses record data as fallback for missing DTO values
   */
  private validateRecordMatchesScheduleForUpdate(
    schedule: VaccinationSchedule,
    dto: UpdateVaccinationRecordDto,
    record: VaccinationRecord,
  ): void {
    const scheduleVaccine = schedule.vaccineName.trim().toLowerCase();
    const recordVaccine = (dto.vaccineName ?? record.vaccineName)
      .trim()
      .toLowerCase();

    if (recordVaccine !== scheduleVaccine) {
      throw new BadRequestException(
        `Vaccine "${recordVaccine}" does not match the scheduled vaccine "${schedule.vaccineName}"`,
      );
    }

    if (schedule.targetDisease) {
      const scheduleDisease = schedule.targetDisease.trim().toLowerCase();
      const recordDisease = (dto.targetDisease ?? record.targetDisease ?? '')
        .trim()
        .toLowerCase();

      if (recordDisease && recordDisease !== scheduleDisease) {
        throw new BadRequestException(
          `Target disease "${recordDisease}" does not match the scheduled disease "${schedule.targetDisease}"`,
        );
      }
    }
  }

  /**
   * Validate that adding this record won't exceed the schedule's
   * effective target (see getEffectiveTarget — this is the live flock
   * population, not necessarily the frozen targetBirds snapshot).
   */
  private validateCoverageLimit(
    schedule: VaccinationSchedule,
    birdsVaccinated: number,
    effectiveTarget: number,
  ): void {
    const newTotal = schedule.vaccinatedBirds + birdsVaccinated;

    if (newTotal > effectiveTarget) {
      const remaining = effectiveTarget - schedule.vaccinatedBirds;
      throw new BadRequestException(
        `Vaccination would exceed the scheduled target of ${effectiveTarget} birds. ` +
          `Remaining coverage capacity: ${remaining} birds. ` +
          `You are attempting to vaccinate ${birdsVaccinated} birds.`,
      );
    }
  }

  /**
   * Validate the flock can receive new vaccination activity.
   *
   * Only CLOSED blocks vaccination — matches FlockService's own
   * convention (assertEditable, updateStage, suspendFlock all treat
   * CLOSED as the sole blocking status). SUSPENDED flocks must remain
   * vaccinable: suspension is commonly a reactive response to a health
   * event, and reactive/emergency vaccination is exactly what's likely
   * needed while a flock is suspended.
   */
  private assertFlockCanReceiveVaccinations(flock: Flock): void {
    if (flock.status === FlockStatus.CLOSED) {
      throw new BadRequestException(
        `Cannot record or schedule vaccinations for a closed flock ` +
          `(closed${flock.closureReason ? `: ${flock.closureReason}` : ''})`,
      );
    }
  }

  /**
   * Validate birds vaccinated doesn't exceed flock population
   */
  private validateBirdsVaccinated(flock: Flock, birdsVaccinated: number): void {
    if (birdsVaccinated > flock.currentCount) {
      throw new BadRequestException(
        `birdsVaccinated (${birdsVaccinated}) cannot exceed the flock's current population (${flock.currentCount})`,
      );
    }
  }

  /**
   * Validate vaccination date is valid
   */
  private validateVaccinationDate(vaccinationDate: Date): void {
    this.validateDate(vaccinationDate, 'Vaccination date');
  }

  /**
   * Validate expiry date (if provided) is after vaccination date
   */
  private validateExpiryDate(
    vaccinationDate: Date,
    expiryDate: Date | null,
  ): void {
    if (!expiryDate) {
      return;
    }

    this.validateDate(expiryDate, 'Expiry date');

    if (vaccinationDate > expiryDate) {
      throw new BadRequestException(
        'Vaccine expiry date cannot be before vaccination date',
      );
    }
  }

  /**
   * Generic date validator
   */
  private validateDate(date: Date | string, label: string): Date {
    const parsedDate = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${label} is invalid`);
    }

    return parsedDate;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Find a matching pending schedule for auto-assignment.
   *
   * Requires the record's vaccination date to fall within
   * AUTO_MATCH_WINDOW_DAYS of the schedule's date — matching on vaccine
   * name alone (regardless of how far away the schedule is) would let a
   * record silently auto-link to and complete an unrelated schedule
   * months away. Picks the closest date within the window, not simply
   * the earliest pending one.
   */
  private async findMatchingPendingSchedule(
    flockId: string,
    vaccineName: string,
    vaccinationDate: Date,
  ): Promise<VaccinationSchedule | null> {
    const windowStart = new Date(vaccinationDate);
    windowStart.setDate(windowStart.getDate() - this.AUTO_MATCH_WINDOW_DAYS);

    const windowEnd = new Date(vaccinationDate);
    windowEnd.setDate(windowEnd.getDate() + this.AUTO_MATCH_WINDOW_DAYS);

    return this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.flockId = :flockId', { flockId })
      .andWhere('schedule.vaccineName = :vaccineName', { vaccineName })
      .andWhere('schedule.status = :status', {
        status: VaccinationStatus.PENDING,
      })
      .andWhere('schedule.scheduledDate BETWEEN :windowStart AND :windowEnd', {
        windowStart,
        windowEnd,
      })
      .orderBy(
        'ABS(EXTRACT(EPOCH FROM (schedule.scheduledDate - :vaccinationDate)))',
        'ASC',
      )
      .setParameter('vaccinationDate', vaccinationDate)
      .getOne();
  }

  /**
   * Get total vaccinated birds for a schedule
   */
  private async getScheduleVaccinatedBirds(
    manager: EntityManager,
    scheduleId: string,
  ): Promise<number> {
    const result = await manager
      .getRepository(VaccinationRecord)
      .createQueryBuilder('record')
      .select('COALESCE(SUM(record.birdsVaccinated), 0)', 'total')
      .where('record.scheduleId = :scheduleId', {
        scheduleId,
      })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  /**
   * Fetch a schedule row with a pessimistic write lock, for use inside a
   * transaction wherever vaccinatedBirds/status will be read-then-written.
   * Without this, concurrent requests against the same schedule can both
   * read the same stale coverage count and both pass a limit check that,
   * combined, overshoots the target (TOCTOU race).
   */
  private async lockSchedule(
    manager: EntityManager,
    scheduleId: string,
  ): Promise<VaccinationSchedule | null> {
    return manager
      .getRepository(VaccinationSchedule)
      .createQueryBuilder('schedule')
      .setLock('pessimistic_write')
      .where('schedule.id = :scheduleId', { scheduleId })
      .getOne();
  }

  /**
   * The number of birds a schedule should actually be judged against.
   *
   * schedule.targetBirds is a snapshot of the flock's population taken
   * when the schedule was created/auto-created. Mortality/culls/sales
   * between then and vaccination day are normal and shrink the flock's
   * live currentCount — if we kept comparing against the frozen
   * targetBirds, a schedule could never reach COMPLETED once the flock
   * shrank below it. Comparing against min(targetBirds, currentCount)
   * means "vaccinate everyone currently alive" completes the schedule,
   * while never silently expanding scope if the population grew instead.
   */
  private getEffectiveTarget(
    schedule: VaccinationSchedule,
    flock: Flock,
  ): number {
    return Math.min(schedule.targetBirds, flock.currentCount);
  }

  /**
   * Single source of truth for a schedule's vaccinatedBirds/status.
   *
   * Always re-sums from the actual linked records (never trusts a prior
   * increment/decrement) and always re-reads the target against the live
   * flock population. Used by every code path that changes which records
   * are linked to a schedule (create, update/relink, delete) so coverage
   * can never go stale the way the old per-call ad-hoc logic did.
   *
   * Only moves a schedule between PENDING and COMPLETED — MISSED and
   * CANCELLED are terminal states reached only via their own explicit
   * endpoints and are left untouched here.
   */
  private async recalculateScheduleCoverage(
    manager: EntityManager,
    scheduleId: string,
    flock: Flock,
  ): Promise<VaccinationSchedule | null> {
    const schedule = await this.lockSchedule(manager, scheduleId);

    if (!schedule) {
      return null;
    }

    const totalVaccinated = await this.getScheduleVaccinatedBirds(
      manager,
      scheduleId,
    );

    const effectiveTarget = this.getEffectiveTarget(schedule, flock);

    schedule.vaccinatedBirds = totalVaccinated;

    if (totalVaccinated >= effectiveTarget) {
      schedule.status = VaccinationStatus.COMPLETED;
    } else if (schedule.status === VaccinationStatus.COMPLETED) {
      schedule.status = VaccinationStatus.PENDING;
    }

    return manager.save(VaccinationSchedule, schedule);
  }

  /**
   * Get start of day for date comparisons
   */
  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }
}