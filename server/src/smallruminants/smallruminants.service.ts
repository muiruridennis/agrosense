import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ruminant, RuminantStatus } from './entities/ruminant.entity';
import { GrowthRecord } from './entities/growth-record.entity';
import {
  BreedingRecord,
  RuminantBreedingStatus,
} from './entities/breeding-record.entity';
import {
  CreateRuminantDto,
  UpdateRuminantDto,
  CreateGrowthRecordDto,
  UpdateGrowthRecordDto,
  CreateBreedingRecordDto,
  UpdateBreedingRecordDto,
  ConfirmBreedingPregnancyDto,
  ResolveHealthEventDto,
  RuminantSummaryDto,
  RuminantFarmSummaryDto,
  RuminantBreedingCalendarDto,
  GrowthTrendDto,
} from './dto/smallruminants.dto';
import { FarmMembersService } from '../farm-members/farm-members.service';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';
import { HealthEventService } from '../health-event/services/health-event.service';
import {
  AnimalType,
  HealthEvent,
  HealthEventStatus,
} from '../health-event/entities/health-event.entity';
import { CreateHealthEventDto } from '../health-event/dto/create-health-event.dto';
import { HealthCondition } from '../health-event/enums/health-condition.enum';

@Injectable()
export class SmallRuminantsService {
  constructor(
    @InjectRepository(Ruminant)
    private readonly ruminantRepo: Repository<Ruminant>,

    @InjectRepository(GrowthRecord)
    private readonly growthRecordRepo: Repository<GrowthRecord>,

    @InjectRepository(BreedingRecord)
    private readonly breedingRecordRepo: Repository<BreedingRecord>,

    private readonly farmMembersService: FarmMembersService,
    private readonly healthEventService: HealthEventService,
  ) {}

  // ── Permission helpers ─────────────────────────────────────────────────────

  private async verifyFarmAccess(
    farmId: string,
    userId: string,
    requiredRole?: FarmMemberRole | FarmMemberRole[],
  ) {
    return this.farmMembersService.verifyAccess(userId, farmId, requiredRole);
  }

  private async verifyRuminantAccess(
    ruminantId: string,
    userId: string,
  ): Promise<{ ruminant: Ruminant; member }> {
    const ruminant = await this.ruminantRepo.findOne({
      where: { id: ruminantId },
      relations: ['farm'],
    });
    if (!ruminant)
      throw new NotFoundException(`Ruminant ${ruminantId} not found`);

    const member = await this.verifyFarmAccess(ruminant.farm.id, userId);
    return { ruminant, member };
  }

  // ── RUMINANT MANAGEMENT ────────────────────────────────────────────────────

  async createRuminant(
    farmId: string,
    dto: CreateRuminantDto,
  ): Promise<Ruminant> {
    // Check unique tagId within farm
    if (dto.tagId) {
      const existing = await this.ruminantRepo.findOne({
        where: { farmId, tagId: dto.tagId },
      });
      if (existing) {
        throw new ConflictException(
          `Ruminant with tag ${dto.tagId} already exists on this farm`,
        );
      }
    }

    const ruminant = this.ruminantRepo.create({
      ...dto,
      farmId,
    });
    return this.ruminantRepo.save(ruminant);
  }

  async getRuminants(farmId: string): Promise<Ruminant[]> {
    return this.ruminantRepo.find({
      where: { farmId },
      relations: ['growthRecords', 'breedingRecords', 'healthEvents'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRuminant(ruminantId: string, userId: string): Promise<Ruminant> {
    const ruminant = await this.ruminantRepo.findOne({
      where: { id: ruminantId },
      relations: ['farm', 'growthRecords', 'breedingRecords', 'healthEvents'],
    });

    if (!ruminant) {
      throw new NotFoundException();
    }

    return ruminant;
  }

  async updateRuminant(
    ruminantId: string,
    userId: string,
    dto: UpdateRuminantDto,
  ): Promise<Ruminant> {
    const { ruminant } = await this.verifyRuminantAccess(ruminantId, userId);

    await this.verifyFarmAccess(ruminant.farm.id, userId, [
      FarmMemberRole.MANAGER,
      FarmMemberRole.OWNER,
    ]);

    Object.assign(ruminant, dto);
    return this.ruminantRepo.save(ruminant);
  }

  async removeRuminant(ruminantId: string, userId: string): Promise<Ruminant> {
    const { ruminant } = await this.verifyRuminantAccess(ruminantId, userId);

    await this.verifyFarmAccess(ruminant.farm.id, userId, [
      FarmMemberRole.MANAGER,
      FarmMemberRole.OWNER,
    ]);

    ruminant.status = RuminantStatus.SOLD;
    ruminant.dateLeft = new Date();
    return this.ruminantRepo.save(ruminant);
  }

  // ── GROWTH RECORDS ─────────────────────────────────────────────────────────

  async recordGrowth(
    ruminantId: string,
    userId: string,
    dto: CreateGrowthRecordDto,
  ): Promise<GrowthRecord> {
    const { ruminant } = await this.verifyRuminantAccess(ruminantId, userId);

    // Get previous record for weight gain calculation
    const previousRecord = await this.growthRecordRepo.findOne({
      where: { ruminantId },
      order: { recordDate: 'DESC' },
    });

    const record = this.growthRecordRepo.create({
      ...dto,
      ruminantId,
      recordDate: new Date(dto.recordDate),
      recordedById: userId,
      recordedAt: new Date(),
    });

    // Compute weight gain
    if (previousRecord) {
      record.weightGainKg = dto.weightKg - previousRecord.weightKg;
      const daysDiff = Math.floor(
        (new Date(dto.recordDate).getTime() -
          previousRecord.recordDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      record.daysSinceLastRecord = daysDiff;
    }

    const saved = await this.growthRecordRepo.save(record);

    // Update ruminant weight
    ruminant.currentWeightKg = dto.weightKg;
    ruminant.lastWeighedAt = new Date();

    // Auto-update expectedMarketDate if target weight set
    if (ruminant.targetWeightKg && dto.weightKg < ruminant.targetWeightKg) {
      const weightGainPerDay = record.daysSinceLastRecord
        ? record.weightGainKg! / record.daysSinceLastRecord
        : 0.15; // default: 150g/day for goats
      const daysToTarget = Math.ceil(
        (ruminant.targetWeightKg - dto.weightKg) / weightGainPerDay,
      );
      const marketDate = new Date(dto.recordDate);
      marketDate.setDate(marketDate.getDate() + daysToTarget);
      ruminant.expectedMarketDate = marketDate;
    }

    await this.ruminantRepo.save(ruminant);
    return saved;
  }

  async getGrowthRecords(
    ruminantId: string,
    userId: string,
  ): Promise<GrowthRecord[]> {
    await this.verifyRuminantAccess(ruminantId, userId);

    return this.growthRecordRepo.find({
      where: { ruminantId },
      relations: ['recordedBy'],
      order: { recordDate: 'ASC' },
    });
  }

  async getGrowthTrend(
    ruminantId: string,
    userId: string,
    days: number = 30,
  ): Promise<GrowthTrendDto> {
    const { ruminant } = await this.verifyRuminantAccess(ruminantId, userId);

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const records = await this.growthRecordRepo.find({
      where: {
        ruminantId,
        recordDate: { $gte: sinceDate } as any,
      },
      order: { recordDate: 'ASC' },
    });

    if (records.length < 2) {
      throw new BadRequestException(
        'Need at least 2 records to calculate growth trend',
      );
    }

    const startRecord = records[0];
    const endRecord = records[records.length - 1];

    const daysDiff = Math.floor(
      (endRecord.recordDate.getTime() - startRecord.recordDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const weightGainKg = endRecord.weightKg - startRecord.weightKg;
    const growthRateKgPerDay = daysDiff > 0 ? weightGainKg / daysDiff : 0;
    const growthRateKgPerWeek = growthRateKgPerDay * 7;

    const avgBCS =
      records.filter((r) => r.bodyConditionScore).length > 0
        ? records
            .filter((r) => r.bodyConditionScore)
            .reduce((sum, r) => sum + r.bodyConditionScore!, 0) /
          records.filter((r) => r.bodyConditionScore).length
        : 0;

    let estimatedMarketDate: Date | undefined;
    let daysToTarget: number | undefined;

    if (ruminant.targetWeightKg && growthRateKgPerDay > 0) {
      const remainingKg = ruminant.targetWeightKg - endRecord.weightKg;
      if (remainingKg > 0) {
        daysToTarget = Math.ceil(remainingKg / growthRateKgPerDay);
        estimatedMarketDate = new Date();
        estimatedMarketDate.setDate(
          estimatedMarketDate.getDate() + daysToTarget,
        );
      }
    }

    return {
      ruminantTagId: ruminant.tagId || ruminant.name || ruminant.id,
      period: days <= 7 ? 'week' : 'month',
      startDate: startRecord.recordDate,
      endDate: endRecord.recordDate,
      currentWeightKg: endRecord.weightKg,
      startWeightKg: startRecord.weightKg,
      weightGainKg,
      growthRateKgPerDay,
      growthRateKgPerWeek,
      avgBodyConditionScore: avgBCS,
      estimatedMarketDate,
      daysToTarget,
    };
  }

  // ── BREEDING RECORDS ───────────────────────────────────────────────────────

  async recordBreeding(
    ruminantId: string,
    userId: string,
    dto: CreateBreedingRecordDto,
  ): Promise<BreedingRecord> {
    const { ruminant } = await this.verifyRuminantAccess(ruminantId, userId);

    if (!ruminant.isBreedable) {
      throw new BadRequestException(
        `Ruminant ${ruminant.tagId} is not marked as breedable`,
      );
    }

    const record = this.breedingRecordRepo.create({
      ...dto,
      ruminantId,
      serviceDate: new Date(dto.serviceDate),
      status: RuminantBreedingStatus.PENDING,
    });

    const saved = await this.breedingRecordRepo.save(record);

    // Update ruminant: next heat ~21 days away (goats/sheep cycle)
    const nextHeat = new Date(dto.serviceDate);
    nextHeat.setDate(nextHeat.getDate() + 21);
    ruminant.expectedNextHeatDate = nextHeat;
    await this.ruminantRepo.save(ruminant);

    return saved;
  }

  async confirmBreedingPregnancy(
    breedingId: string,
    userId: string,
    dto: ConfirmBreedingPregnancyDto,
  ): Promise<BreedingRecord> {
    const record = await this.breedingRecordRepo.findOne({
      where: { id: breedingId },
      relations: ['ruminant', 'ruminant.farm'],
    });
    if (!record) throw new NotFoundException();

    await this.verifyFarmAccess(record.ruminant.farm.id, userId, [
      FarmMemberRole.MANAGER,
      FarmMemberRole.OWNER,
    ]);

    record.pregnancyConfirmedDate = new Date(dto.pregnancyConfirmedDate);
    record.isPregnant = true;
    record.status = RuminantBreedingStatus.CONFIRMED;
    record.expectedOffspring = dto.expectedOffspring ?? null;

    // Calculate expected birth date (150 days for goats/sheep)
    const expectedBirth = new Date(record.serviceDate);
    expectedBirth.setDate(expectedBirth.getDate() + 150);
    record.expectedBirthDate = expectedBirth;

    const saved = await this.breedingRecordRepo.save(record);

    // Update ruminant
    record.ruminant.isPregnant = true;
    record.ruminant.expectedBirthDate = expectedBirth;
    await this.ruminantRepo.save(record.ruminant);

    return saved;
  }

  async markBreedingUnsuccessful(
    breedingId: string,
    userId: string,
  ): Promise<BreedingRecord> {
    const record = await this.breedingRecordRepo.findOne({
      where: { id: breedingId },
      relations: ['ruminant', 'ruminant.farm'],
    });
    if (!record) throw new NotFoundException();

    await this.verifyFarmAccess(record.ruminant.farm.id, userId, [
      FarmMemberRole.MANAGER,
      FarmMemberRole.OWNER,
    ]);

    record.status = RuminantBreedingStatus.UNSUCCESSFUL;
    record.isPregnant = false;
    record.pregnancyConfirmedDate = null;
    record.expectedBirthDate = null;

    const saved = await this.breedingRecordRepo.save(record);

    // Update ruminant: next heat is now (came back into heat)
    record.ruminant.expectedNextHeatDate = new Date();
    record.ruminant.isPregnant = false;
    await this.ruminantRepo.save(record.ruminant);

    return saved;
  }

  async getBreedingRecords(
    ruminantId: string,
    userId: string,
  ): Promise<BreedingRecord[]> {
    await this.verifyRuminantAccess(ruminantId, userId);

    return this.breedingRecordRepo.find({
      where: { ruminantId },
      order: { serviceDate: 'DESC' },
    });
  }

  // ── HEALTH EVENTS ──────────────────────────────────────────────────────────

  async recordHealthEvent(
    farmId: string,
    userId: string,
    dto: CreateHealthEventDto,
  ): Promise<HealthEvent> {
    await this.verifyFarmAccess(farmId, userId);

    const healthEvent = await this.healthEventService.create(
      farmId,
      userId,
      dto,
    );

    return healthEvent;
  }

  async resolveHealthEvent(
    eventId: string,
    userId: string,
    dto: ResolveHealthEventDto,
  ): Promise<HealthEvent> {
    const healthEvent = await this.healthEventService.resolveHealthEvent(
      eventId,
      userId,
      dto,
    );
    return healthEvent;
  }

  async getHealthEvents(
    animalType: AnimalType,
    animalId: string,
  ): Promise<HealthEvent[]> {
    return this.healthEventService.getAnimalHealthEvents(animalType, animalId);
  }

  // ── DASHBOARDS & SUMMARIES ────────────────────────────────────────────────

  async getRuminantSummary(
    ruminantId: string,
    userId: string,
  ): Promise<RuminantSummaryDto> {
    const { ruminant } = await this.verifyRuminantAccess(ruminantId, userId);

    const fullRuminant = await this.ruminantRepo.findOne({
      where: { id: ruminantId },
      relations: ['growthRecords', 'breedingRecords', 'healthEvents'],
    });

    // Age
    const ageMs =
      new Date().getTime() - new Date(fullRuminant!.dateOfBirth).getTime();
    const ageWeeks = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 7));
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30));

    // Latest weight
    const latestWeight = fullRuminant!.growthRecords?.sort(
      (a, b) => b.recordDate.getTime() - a.recordDate.getTime(),
    )[0];

    // Total weight gain
    const allGrowthRecords = fullRuminant!.growthRecords || [];
    let totalWeightGain: number | undefined;
    if (allGrowthRecords.length > 1) {
      const first = allGrowthRecords.sort(
        (a, b) => a.recordDate.getTime() - b.recordDate.getTime(),
      )[0];
      const last = allGrowthRecords[allGrowthRecords.length - 1];
      totalWeightGain = last.weightKg - first.weightKg;
    }

    // Growth rate (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysRecords = allGrowthRecords.filter(
      (r) => r.recordDate >= sevenDaysAgo,
    );
    let growthRateKgPerWeek: number | undefined;
    if (last7DaysRecords.length > 1) {
      const weekGain =
        last7DaysRecords[last7DaysRecords.length - 1].weightKg -
        last7DaysRecords[0].weightKg;
      growthRateKgPerWeek = weekGain;
    }

    // Days to market
    let daysToMarket: number | undefined;
    if (fullRuminant!.expectedMarketDate) {
      daysToMarket = Math.floor(
        (fullRuminant!.expectedMarketDate.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    // Current breeding
    const currentBreeding = (fullRuminant!.breedingRecords || []).find(
      (b) =>
        b.status === RuminantBreedingStatus.PENDING ||
        b.status === RuminantBreedingStatus.CONFIRMED,
    );

    // Replace the commented code with:
    const recentHealthEvents = await this.healthEventService
      .getAnimalHealthEvents(AnimalType.RUMINANT, fullRuminant!.id)
      .then((events) =>
        events
          .filter((e) => e.status !== HealthEventStatus.REPORTED)
          .slice(0, 5)
          .map((e) => ({
            id: e.id,
            condition: e.condition as HealthCondition,
            occurredDate: e.occurredDate,
            resolved:
              e.status === HealthEventStatus.RESOLVED ||
              e.status === HealthEventStatus.FATAL,
          })),
      );

    return {
      id: fullRuminant!.id,
      tagId: fullRuminant!.tagId,
      name: fullRuminant!.name,
      species: fullRuminant!.species,
      breed: fullRuminant!.breed,
      sex: fullRuminant!.sex,
      purpose: fullRuminant!.purpose,
      dateOfBirth: fullRuminant!.dateOfBirth,
      status: fullRuminant!.status,
      currentWeightKg: fullRuminant!.currentWeightKg,
      targetWeightKg: fullRuminant!.targetWeightKg,
      ageWeeks,
      ageMonths,
      expectedMarketDate: fullRuminant!.expectedMarketDate,
      daysToMarket,
      growthRateKgPerWeek,
      latestWeight: latestWeight?.weightKg,
      latestWeightDate: latestWeight?.recordDate,
      totalWeightGain,
      isPregnant: fullRuminant!.isPregnant,
      expectedBirthDate: fullRuminant!.expectedBirthDate,
      recentHealthEvents,
    };
  }

  async getFarmSmallRuminantsSummary(
    farmId: string,
    userId: string,
  ): Promise<RuminantFarmSummaryDto> {
    await this.verifyFarmAccess(farmId, userId);

    const ruminants = await this.ruminantRepo.find({
      where: { farmId },
      relations: ['growthRecords', 'breedingRecords', 'healthEvents'],
    });

    const activeRuminants = ruminants.filter((r) => r.status === 'active');
    const goats = ruminants.filter((r) => r.species === 'goat').length;
    const sheep = ruminants.filter((r) => r.species === 'sheep').length;

    const meatAnimals = ruminants.filter(
      (r) => r.purpose === 'meat' || r.purpose === 'dual',
    ).length;
    const breedingAnimals = ruminants.filter(
      (r) => r.purpose === 'breeding' || r.purpose === 'dual',
    ).length;
    const dairyAnimals = ruminants.filter((r) => r.purpose === 'dairy').length;

    // Ready for market (within 30 days)
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    const readyForMarket = ruminants.filter(
      (r) =>
        r.expectedMarketDate &&
        r.expectedMarketDate <= thirtyDaysOut &&
        r.expectedMarketDate >= new Date(),
    ).length;

    const daysAwayFromMarket = ruminants
      .filter((r) => r.expectedMarketDate)
      .map((r) =>
        Math.floor(
          (r.expectedMarketDate!.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
      .sort((a, b) => a - b);

    // Average weight & BCS
    const weights = activeRuminants
      .filter((r) => r.currentWeightKg)
      .map((r) => r.currentWeightKg!);
    const avgWeightKg =
      weights.length > 0
        ? weights.reduce((a, b) => a + b, 0) / weights.length
        : 0;

    const allBCS = (
      ruminants
        .flatMap((r) => r.growthRecords)
        .filter((r) => r.bodyConditionScore) as any[]
    ).map((r) => r.bodyConditionScore);
    const avgBodyConditionScore =
      allBCS.length > 0 ? allBCS.reduce((a, b) => a + b, 0) / allBCS.length : 0;

    // Breeding
    const pregnant = ruminants.filter((r) => r.isPregnant).length;
    const thisMonth = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const birthsThisMonth = ruminants.filter(
      (r) =>
        r.expectedBirthDate &&
        r.expectedBirthDate >= thisMonth &&
        r.expectedBirthDate < nextMonth,
    ).length;

    const birthsNextMonth = ruminants.filter((r) => {
      const nextMonthEnd = new Date();
      nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 2);
      return (
        r.expectedBirthDate &&
        r.expectedBirthDate >= nextMonth &&
        r.expectedBirthDate < nextMonthEnd
      );
    }).length;

    // Health

    const activeHealthIssues = (
      await this.healthEventService.getActiveHealthEventsForFarm(
        farmId,
        AnimalType.RUMINANT,
      )
    ).length;

    const healthIssuesByCondition: Record<string, number> = {};
    const allHealthEvents = await this.healthEventService.getAnimalHealthEvents(
      AnimalType.RUMINANT,
      farmId,
    );
    allHealthEvents.forEach((e) => {
      healthIssuesByCondition[e.condition] =
        (healthIssuesByCondition[e.condition] || 0) + 1;
    });

    return {
      totalRuminants: ruminants.length,
      activeRuminants: activeRuminants.length,
      goats,
      sheep,
      meatAnimals,
      breedingAnimals,
      dairyAnimals,
      readyForMarket,
      daysAwayFromMarket,
      avgWeightKg,
      avgBodyConditionScore,
      animalsPregnant: pregnant,
      expectedBirthsThisMonth: birthsThisMonth,
      expectedBirthsNextMonth: birthsNextMonth,
      activeHealthIssues,
      healthIssuesByCondition,
      fastestGrowing: [], // TODO: compute from growth records
      slowestGrowing: [], // TODO: compute from growth records
    };
  }

  async getBreedingCalendar(
    farmId: string,
    userId: string,
  ): Promise<RuminantBreedingCalendarDto> {
    await this.verifyFarmAccess(farmId, userId);

    const ruminants = await this.ruminantRepo.find({
      where: { farmId },
      relations: ['breedingRecords'],
    });

    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const twoMonthsFromNow = new Date(
      today.getFullYear(),
      today.getMonth() + 2,
      1,
    );

    return {
      matingsDueThisMonth: ruminants
        .filter(
          (r) =>
            r.expectedNextHeatDate &&
            r.expectedNextHeatDate >= today &&
            r.expectedNextHeatDate <
              new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        )
        .map((r) => ({
          ruminantTagId: r.tagId || r.name || r.id,
          daysUntilHeat: Math.floor(
            (r.expectedNextHeatDate!.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          lastBreedingDate: (r.breedingRecords?.[0] as any)?.serviceDate,
        })),

      birthsDueThisMonth: ruminants
        .filter(
          (r) =>
            r.expectedBirthDate &&
            r.expectedBirthDate >= thisMonth &&
            r.expectedBirthDate < nextMonth,
        )
        .map((r) => ({
          ruminantTagId: r.tagId || r.name || r.id,
          daysUntilBirth: Math.floor(
            (r.expectedBirthDate!.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          expectedBirthDate: r.expectedBirthDate!,
          expectedOffspring: 1, // TODO: from latest breeding record
        })),

      birthsDueNextMonth: ruminants
        .filter(
          (r) =>
            r.expectedBirthDate &&
            r.expectedBirthDate >= nextMonth &&
            r.expectedBirthDate < twoMonthsFromNow,
        )
        .map((r) => ({
          ruminantTagId: r.tagId || r.name || r.id,
          daysUntilBirth: Math.floor(
            (r.expectedBirthDate!.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          expectedBirthDate: r.expectedBirthDate!,
        })),

      pregnancyChecksPending: [], // TODO: from breeding records status="pending" at day 35
    };
  }
}
