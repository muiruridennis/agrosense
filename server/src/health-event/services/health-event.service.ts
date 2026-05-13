import { UpdateHealthEventStatusDto } from './../dto/health-event.dto';
// health-event/services/health-event.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { HealthEvent, AnimalType, HealthEventStatus } from '../entities/health-event.entity';
import { Treatment, TreatmentResponseStatus } from '../entities/treatment.entity';
import { Diagnostic } from '../entities/diagnostic.entity';
import { Withdrawal } from '../entities/withdrawal.entity';
import { Quarantine } from '../entities/quarantine.entity';
import { CreateHealthEventDto } from '../dto/create-health-event.dto';
import { UpdateHealthEventDto } from '../dto/update-health-event.dto';
import { MarkAsResolvedDto } from '../dto/health-event.dto';

@Injectable()
export class HealthEventService {
  private readonly logger = new Logger(HealthEventService.name);

  constructor(
    @InjectRepository(HealthEvent)
    private readonly healthEventRepo: Repository<HealthEvent>,
    @InjectRepository(Treatment)
    private readonly treatmentRepo: Repository<Treatment>,
    @InjectRepository(Diagnostic)
    private readonly diagnosticRepo: Repository<Diagnostic>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Quarantine)
    private readonly quarantineRepo: Repository<Quarantine>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // BASIC CRUD (Used by Orchestrator)
  // ─────────────────────────────────────────────────────────────────────────

  async create(farmId: string, userId: string, dto: CreateHealthEventDto): Promise<HealthEvent> {
    const event = await  this.healthEventRepo.create({
      ...dto,
      farmId,
      recordedBy: userId,
      occurredDate: new Date(dto.occurredDate),
      breedingLockUntil: dto.breedingLockUntil ? new Date(dto.breedingLockUntil) : null,
    });
    return await this.healthEventRepo.save(event);
  }

  async findById(id: string): Promise<HealthEvent> {
    const event = await this.healthEventRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['treatments', 'diagnostics', 'withdrawals', 'quarantines'],
    });
    if (!event) {
      throw new NotFoundException(`Health event ${id} not found`);
    }
    return event;
  }

  async update(id: string, dto: UpdateHealthEventDto): Promise<HealthEvent> {
    const event = await this.findById(id);
    Object.assign(event, dto);
    if (dto.resolvedDate) {
      event.status = HealthEventStatus.RESOLVED;
    }
    return this.healthEventRepo.save(event);
  }

  async softDelete(id: string): Promise<void> {
    await this.healthEventRepo.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUERY METHODS (Used by Dairy, Poultry, SmallRuminants)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all health events for a specific animal
   */
  async getAnimalHealthEvents(
    animalType: AnimalType,
    animalId: string,
    includeResolved: boolean = true,
  ): Promise<HealthEvent[]> {
    const where: any = {
      animalType,
      animalId,
      isDeleted: false,
    };
    
    if (!includeResolved) {
      where.status = In([HealthEventStatus.REPORTED, HealthEventStatus.UNDER_TREATMENT, HealthEventStatus.MONITORING]);
    }

    return this.healthEventRepo.find({
      where,
      relations: ['treatments', 'diagnostics', 'withdrawals', 'quarantines'],
      order: { occurredDate: 'DESC' },
    });
  }

  /**
   * Get active health events for a farm (dashboard)
   */
  async getFarmActiveHealthEvents(farmId: string): Promise<HealthEvent[]> {
    return this.healthEventRepo.find({
      where: {
        farmId,
        isDeleted: false,
        status: In([HealthEventStatus.REPORTED, HealthEventStatus.UNDER_TREATMENT, HealthEventStatus.MONITORING]),
      },
      relations: ['treatments', 'withdrawals'],
      order: { severity: 'DESC', occurredDate: 'ASC' },
    });
  }

  /**
   * Get health events by condition type
   */
  async getEventsByCondition(
    farmId: string,
    condition: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HealthEvent[]> {
    return this.healthEventRepo.find({
      where: {
        farmId,
        condition,
        occurredDate: Between(startDate, endDate),
        isDeleted: false,
      },
      relations: ['treatments'],
      order: { occurredDate: 'DESC' },
    });
  }

  /**
   * Get health events summary statistics for dashboard
   */
  async getHealthSummary(farmId: string): Promise<{
    totalActive: number;
    bySeverity: { low: number; medium: number; high: number; critical: number };
    byCondition: Record<string, number>;
    totalTreatmentCost: number;
    totalProductionLoss: number;
  }> {
    const activeEvents = await this.getFarmActiveHealthEvents(farmId);
    
    const bySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    
    const byCondition: Record<string, number> = {};
    let totalTreatmentCost = 0;
    let totalProductionLoss = 0;

    for (const event of activeEvents) {
      bySeverity[event.severity]++;
      byCondition[event.condition] = (byCondition[event.condition] || 0) + 1;
      totalTreatmentCost += event.totalTreatmentCost || 0;
      totalProductionLoss += event.totalProductionLossValue || 0;
    }

    return {
      totalActive: activeEvents.length,
      bySeverity,
      byCondition,
      totalTreatmentCost,
      totalProductionLoss,
    };
  }

  /**
   * Get all animals currently under withdrawal (milk/eggs/meat unsafe)
   */
  async getAnimalsUnderWithdrawal(farmId: string): Promise<{
    animalId: string;
    animalType: AnimalType;
    animalTag: string | null;
    productType: string;
    withdrawalEndsAt: Date;
  }[]> {
    const today = new Date();

    const withdrawals = await this.withdrawalRepo
      .createQueryBuilder('w')
      .innerJoinAndSelect('w.healthEvent', 'e')
      .where('e.farmId = :farmId', { farmId })
      .andWhere('e.isDeleted = :deleted', { deleted: false })
      .andWhere('w.endsAt >= :today', { today })
      .andWhere('w.isCompleted = :completed', { completed: false })
      .getMany();

    return withdrawals.map(w => ({
      animalId: w.healthEvent.animalId,
      animalType: w.healthEvent.animalType,
      animalTag: w.healthEvent.animalTag,
      productType: w.productType,
      withdrawalEndsAt: w.endsAt,
    }));
  }

  /**
   * Get animals locked from breeding due to health issues
   */
  async getAnimalsLockedFromBreeding(farmId: string): Promise<{
    animalId: string;
    animalType: AnimalType;
    animalTag: string | null;
    condition: string;
    lockUntil: Date;
  }[]> {
    const today = new Date();

    const events = await this.healthEventRepo.find({
      where: {
        farmId,
        isDeleted: false,
        affectsBreeding: true,
        breedingLockUntil: { $gte: today } as any,
      },
    });

    return events.map(e => ({
      animalId: e.animalId,
      animalType: e.animalType,
      animalTag: e.animalTag,
      condition: e.condition,
      lockUntil: e.breedingLockUntil!,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TREATMENT METHODS
  // ─────────────────────────────────────────────────────────────────────────

  async addTreatment(
    healthEventId: string,
    treatmentData: Partial<Treatment>,
  ): Promise<Treatment> {
    const treatment = this.treatmentRepo.create({
      ...treatmentData,
      healthEventId,
    });
    return this.treatmentRepo.save(treatment);
  }

  async getTreatmentsForEvent(healthEventId: string): Promise<Treatment[]> {
    return this.treatmentRepo.find({
      where: { healthEventId },
      order: { administeredAt: 'DESC' },
    });
  }

  async updateTreatmentResponse(
    treatmentId: string,
    responseStatus: TreatmentResponseStatus,
    responseNotes: string,
  ): Promise<Treatment> {
    const treatment = await this.treatmentRepo.findOne({ where: { id: treatmentId } });
    if (!treatment) {
      throw new NotFoundException(`Treatment ${treatmentId} not found`);
    }
    treatment.responseStatus = responseStatus;
    treatment.responseAssessedAt = new Date();
    treatment.responseNotes = responseNotes;
    return this.treatmentRepo.save(treatment);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DIAGNOSTIC METHODS
  // ─────────────────────────────────────────────────────────────────────────

  async addDiagnostic(
    healthEventId: string,
    diagnosticData: Partial<Diagnostic>,
  ): Promise<Diagnostic> {
    const diagnostic = this.diagnosticRepo.create({
      ...diagnosticData,
      healthEventId,
    });
    return this.diagnosticRepo.save(diagnostic);
  }

  async getDiagnosticsForEvent(healthEventId: string): Promise<Diagnostic[]> {
    return this.diagnosticRepo.find({
      where: { healthEventId },
      order: { performedDate: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WITHDRAWAL METHODS
  // ─────────────────────────────────────────────────────────────────────────

  async completeWithdrawal(withdrawalId: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id: withdrawalId } });
    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
    }
    withdrawal.isCompleted = true;
    withdrawal.completedAt = new Date();
    return this.withdrawalRepo.save(withdrawal);
  }

  async getActiveWithdrawalsForAnimal(
    animalType: AnimalType,
    animalId: string,
  ): Promise<Withdrawal[]> {
    const today = new Date();
    return this.withdrawalRepo
      .createQueryBuilder('w')
      .innerJoin('w.healthEvent', 'e')
      .where('e.animalType = :animalType', { animalType })
      .andWhere('e.animalId = :animalId', { animalId })
      .andWhere('w.endsAt >= :today', { today })
      .andWhere('w.isCompleted = :completed', { completed: false })
      .getMany();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUARANTINE METHODS
  // ─────────────────────────────────────────────────────────────────────────

  async liftQuarantine(quarantineId: string, notes: string): Promise<Quarantine> {
    const quarantine = await this.quarantineRepo.findOne({ where: { id: quarantineId } });
    if (!quarantine) {
      throw new NotFoundException(`Quarantine ${quarantineId} not found`);
    }
    quarantine.isActive = false;
    quarantine.liftedAt = new Date();
    quarantine.notes = notes;
    return this.quarantineRepo.save(quarantine);
  }

  async getActiveQuarantines(farmId: string): Promise<Quarantine[]> {
    return this.quarantineRepo
      .createQueryBuilder('q')
      .innerJoin('q.healthEvent', 'e')
      .where('e.farmId = :farmId', { farmId })
      .andWhere('q.isActive = :active', { active: true })
      .getMany();
  }
   /**
   * Get active (unresolved) health events for an animal
   */
  async getActiveHealthEventsForFarm(
    farmId: string,
    animalType: AnimalType,
  ): Promise<HealthEvent[]> {
    return this.healthEventRepo.find({
      where: {
        farmId,
        animalType,
        status: HealthEventStatus.REPORTED, // Only active issues
        isDeleted: false, // CRITICAL: Exclude soft-deleted records
      },
      order: { occurredDate: 'DESC' },
    });
  }
   /**
   * Mark an event as resolved
   */
  async resolveHealthEvent(
    eventId: string,
    userId: string,
    dto: MarkAsResolvedDto = {},
  ): Promise<HealthEvent> {
    return this.updateStatus(eventId, userId, {
      status: HealthEventStatus.RESOLVED,
      resolvedDate: dto.resolvedDate ?? undefined,
      notes: dto.notes,
    });
  }
   /**
   * Get farm health summary for dashboard
   *
   * Returns:
   * - Total active issues
   * - By severity (critical, high, medium, low)
   * - By animal type
   * - By condition (most common problems)
   */
  // async getFarmHealthSummary(
  //   farmId: string,
  //   userId: string,
  // ): Promise<{
  //   totalActive: number;
  //   bySeverity: Record<string, number>;
  //   byAnimalType: Record<string, number>;
  //   byCondition: Record<string, number>;
  //   critical: HealthEvent[];
  // }> {
  //   await this.farmMembersService.verifyAccess(userId, farmId);

  //   const activeEvents = await this.healthEventRepo.find({
  //     where: {
  //       farmId,
  //       isActive: true,
  //       isDeleted: false, // CRITICAL: Exclude soft-deleted records
  //     },
  //   });

  //   const bySeverity = {
  //     critical: 0,
  //     high: 0,
  //     medium: 0,
  //     low: 0,
  //   };

  //   const byAnimalType = {
  //     cow: 0,
  //     ruminant: 0,
  //     poultry: 0,
  //   };

  //   const byCondition: Record<string, number> = {};

  //   activeEvents.forEach((event) => {
  //     // Count by severity
  //     bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;

  //     // Count by animal type
  //     byAnimalType[event.animalType] =
  //       (byAnimalType[event.animalType] || 0) + 1;

  //     // Count by condition
  //     byCondition[event.condition] = (byCondition[event.condition] || 0) + 1;
  //   });

  //   // Get only critical issues for urgency
  //   const critical = activeEvents.filter(
  //     (e) => e.severity === HealthEventSeverity.CRITICAL,
  //   );

  //   return {
  //     totalActive: activeEvents.length,
  //     bySeverity,
  //     byAnimalType,
  //     byCondition,
  //     critical,
  //   };
  // }

  /**
   * Get health trend for a farm (last 30 days)
   *
   * Useful for: "Is health getting better or worse?"
   */
  // async getFarmHealthTrend(
  //   farmId: string,
  //   userId: string,
  //   days: number = 30,
  // ): Promise<{
  //   totalEvents: number;
  //   avgSeverity: string;
  //   mostCommonConditions: Array<{ condition: string; count: number }>;
  //   mortalityRate: number;
  //   averageResolutionDays: number | null;
  // }> {
  //   await this.farmMembersService.verifyAccess(userId, farmId);

  //   const sinceDate = new Date();
  //   sinceDate.setDate(sinceDate.getDate() - days);

  //   const events = await this.healthEventRepo.find({
  //     where: {
  //       farmId,
  //       occurredDate: { $gte: sinceDate } as any,
  //       isDeleted: false, // CRITICAL: Exclude soft-deleted records
  //     },
  //   });

  //   if (events.length === 0) {
  //     return {
  //       totalEvents: 0,
  //       avgSeverity: 'none',
  //       mostCommonConditions: [],
  //       mortalityRate: 0,
  //       averageResolutionDays: null,
  //     };
  //   }

  //   // Calculate metrics
  //   const severityScore = {
  //     low: 1,
  //     medium: 2,
  //     high: 3,
  //     critical: 4,
  //   };

  //   const avgScore =
  //     events.reduce((sum, e) => sum + severityScore[e.severity], 0) /
  //     events.length;

  //   const severityMap = {
  //     1: 'low',
  //     2: 'medium',
  //     3: 'high',
  //     4: 'critical',
  //   };

  //   const conditionCounts: Record<string, number> = {};
  //   events.forEach((e) => {
  //     conditionCounts[e.condition] = (conditionCounts[e.condition] || 0) + 1;
  //   });

  //   const mostCommonConditions = Object.entries(conditionCounts)
  //     .map(([condition, count]) => ({ condition, count }))
  //     .sort((a, b) => b.count - a.count)
  //     .slice(0, 5);

  //   const fatalCount = events.filter((e) => e.wasFatal()).length;
  //   const mortalityRate =
  //     events.length > 0 ? (fatalCount / events.length) * 100 : 0;

  //   const resolvedEvents = events.filter((e) => e.getDurationDays());
  //   const avgResolutionDays =
  //     resolvedEvents.length > 0
  //       ? resolvedEvents.reduce(
  //           (sum, e) => sum + (e.getDurationDays() || 0),
  //           0,
  //         ) / resolvedEvents.length
  //       : null;

  //   return {
  //     totalEvents: events.length,
  //     avgSeverity: severityMap[Math.round(avgScore)] || 'medium',
  //     mostCommonConditions,
  //     mortalityRate,
  //     averageResolutionDays: avgResolutionDays,
  //   };
  // }
  async updateStatus(
    eventId: string,
    userId: string,
    dto: UpdateHealthEventStatusDto,
  ): Promise<HealthEvent> {
    const event = await this.healthEventRepo.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Health event ${eventId} not found`);
    }


    event.status = dto.status;

    if (dto.status === HealthEventStatus.RESOLVED) {
      event.resolvedDate = dto.resolvedDate
        ? new Date(dto.resolvedDate)
        : new Date();
    } else if (dto.status === HealthEventStatus.FATAL) {
      event.resolvedDate = event.occurredDate;
    }

    if (dto.notes) {
      event.notes = dto.notes;
    }

    return this.healthEventRepo.save(event);
  }


}