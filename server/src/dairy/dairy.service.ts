import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cow, CowStatus } from './entities/cow.entity';
import {
  LactationCycle,
  LactationCycleStatus,
} from './entities/lactation-cycle.entity';
import {
  LactationRecord,
  LactationRecordStatus,
} from './entities/lactation-record.entity';
import {
  BreedingRecord,
  BreedingStatus,
} from './entities/breeding-record.entity';
import {
  CreateCowDto,
  UpdateCowDto,
  CreateLactationRecordDto,
  UpdateLactationRecordDto,
  ReviewLactationRecordDto,
  CreateBreedingRecordDto,
  UpdateBreedingRecordDto,
  ConfirmPregnancyDto,
  ResolveHealthEventDto,
  CowSummaryDto,
  DairyFarmSummaryDto,
  BreedingCalendarDto,
} from './dto/dairy.dto';
import {
  AnimalType,
  HealthEventStatus,
} from '../health-event/entities/health-event.entity';
import { CreateHealthEventDto } from '../health-event/dto/create-health-event.dto';
import { HealthEventService } from '../health-event/services/health-event.service';
import { HealthCondition } from '../health-event/enums/health-condition.enum';
import { HealthOrchestratorService } from '../health-event/services/health-orchestrator.service';

/**
 * DairyService
 *
 * PURE BUSINESS LOGIC - NO AUTHORIZATION
 * Authorization handled by guards in controller
 *
 * Responsibilities:
 * - Cow management (create, update, remove)
 * - Lactation cycle management (start, end)
 * - Milk record tracking (daily yields, submission, review)
 * - Breeding management (record, confirm, unsuccessful)
 * - Health event management (record, resolve)
 * - Dashboards and reporting
 */
@Injectable()
export class DairyService {
  constructor(
    @InjectRepository(Cow)
    private readonly cowRepo: Repository<Cow>,

    @InjectRepository(LactationCycle)
    private readonly lactationCycleRepo: Repository<LactationCycle>,

    @InjectRepository(LactationRecord)
    private readonly lactationRecordRepo: Repository<LactationRecord>,

    @InjectRepository(BreedingRecord)
    private readonly breedingRecordRepo: Repository<BreedingRecord>,

    private readonly healthEventService: HealthEventService,
    private readonly healthOrchestrator: HealthOrchestratorService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // COW MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new cow on the farm
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async createCow(farmId: string, dto: CreateCowDto): Promise<Cow> {
    // Check if tagId is unique within farm (if provided)
    if (dto.tagId) {
      const existing = await this.cowRepo.findOne({
        where: { farmId, tagId: dto.tagId },
      });
      if (existing) {
        throw new ConflictException(
          `Cow with tag ${dto.tagId} already exists on this farm`,
        );
      }
    }

    const cow = this.cowRepo.create({
      ...dto,
      farmId,
    });
    return this.cowRepo.save(cow);
  }

  /**
   * Get all cows on a farm
   * Authorization: Controller guard ensures farm access
   */
  async getCows(farmId: string): Promise<Cow[]> {
    return this.cowRepo.find({
      where: { farmId },
      relations: ['lactationCycles', 'breedingRecords'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single cow with full details
   * Authorization: Controller guard ensures farm access
   */
  async getCow(cowId: string): Promise<Cow> {
    const cow = await this.cowRepo.findOne({
      where: { id: cowId },
      relations: ['farm', 'lactationCycles', 'breedingRecords'],
    });

    if (!cow) {
      throw new NotFoundException(`Cow ${cowId} not found`);
    }

    return cow;
  }

  /**
   * Update cow details (name, breed, weight, etc)
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async updateCow(cowId: string, dto: UpdateCowDto): Promise<Cow> {
    const cow = await this.cowRepo.findOne({
      where: { id: cowId },
    });

    if (!cow) {
      throw new NotFoundException(`Cow ${cowId} not found`);
    }

    Object.assign(cow, dto);
    return this.cowRepo.save(cow);
  }

  /**
   * Remove cow (soft delete via status change)
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async removeCow(cowId: string): Promise<Cow> {
    const cow = await this.cowRepo.findOne({
      where: { id: cowId },
    });

    if (!cow) {
      throw new NotFoundException(`Cow ${cowId} not found`);
    }

    cow.status = CowStatus.SOLD;
    cow.dateLeft = new Date();
    return this.cowRepo.save(cow);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LACTATION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start a new lactation cycle (cow freshened/gave birth)
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async startLactation(
    cowId: string,
    freshenDate: string,
  ): Promise<LactationCycle> {
    const cow = await this.cowRepo.findOne({ where: { id: cowId } });

    if (!cow) {
      throw new NotFoundException(`Cow ${cowId} not found`);
    }

    if (cow.isCurrentlyLactating) {
      throw new BadRequestException(
        `Cow is already in milk. Dry off before starting new lactation.`,
      );
    }

    // Increment lactation number
    const newLactationNumber = (cow.lactationNumber ?? 0) + 1;

    // Create cycle
    const cycle = this.lactationCycleRepo.create({
      cowId,
      freshenDate: new Date(freshenDate),
      lactationNumber: newLactationNumber,
      status: LactationCycleStatus.ACTIVE,
    });
    const savedCycle = await this.lactationCycleRepo.save(cycle);

    // Update cow state
    cow.lactationNumber = newLactationNumber;
    cow.isCurrentlyLactating = true;
    cow.daysInMilk = 0;
    cow.expectedNextHeatDate = null;
    await this.cowRepo.save(cow);

    return savedCycle;
  }

  /**
   * Record daily milk yield (worker entry)
   * Authorization: Controller guard ensures WORKER/MANAGER/OWNER
   */
  async recordMilk(
    cowId: string,
    userId: string,
    dto: CreateLactationRecordDto,
  ): Promise<LactationRecord> {
    const cow = await this.cowRepo.findOne({ where: { id: cowId } });

    if (!cow) {
      throw new NotFoundException(`Cow ${cowId} not found`);
    }

    if (!cow.isCurrentlyLactating) {
      throw new BadRequestException(
        `Cow ${cow.tagId} is not currently in milk`,
      );
    }

    // Get current (active) lactation cycle
    const cycle = await this.lactationCycleRepo.findOne({
      where: { cowId, status: LactationCycleStatus.ACTIVE },
    });
    if (!cycle) {
      throw new NotFoundException(
        `No active lactation cycle found for cow ${cow.tagId}`,
      );
    }

    // Check for duplicate record on same date
    const existing = await this.lactationRecordRepo.findOne({
      where: {
        lactationCycleId: cycle.id,
        recordDate: new Date(dto.recordDate),
      },
    });
    if (existing) {
      throw new ConflictException(
        `A milk record for ${dto.recordDate} already exists. Edit the existing record.`,
      );
    }

    const record = this.lactationRecordRepo.create({
      ...dto,
      lactationCycleId: cycle.id,
      recordDate: new Date(dto.recordDate),
      recordedById: userId,
      recordedAt: new Date(),
      status: LactationRecordStatus.DRAFT,
    });

    const saved = await this.lactationRecordRepo.save(record);

    // Update cow's daysInMilk (time since freshen)
    const daysSinceFresh = Math.floor(
      (new Date(dto.recordDate).getTime() - cycle.freshenDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    cow.daysInMilk = daysSinceFresh;
    await this.cowRepo.save(cow);

    return saved;
  }

  /**
   * Submit milk record for manager review
   * Authorization: Controller guard ensures it's the recorder's own record
   */
  async submitLactationRecord(
    recordId: string,
    userId: string,
  ): Promise<LactationRecord> {
    const record = await this.lactationRecordRepo.findOne({
      where: { id: recordId },
      relations: ['lactationCycle', 'lactationCycle.cow'],
    });

    if (!record) {
      throw new NotFoundException(`Lactation record ${recordId} not found`);
    }

    // Verify worker is the one who recorded it
    if (record.recordedById !== userId) {
      throw new BadRequestException('You can only submit your own records');
    }

    if (record.status !== LactationRecordStatus.DRAFT) {
      throw new BadRequestException('Only draft records can be submitted');
    }

    record.status = LactationRecordStatus.SUBMITTED;
    record.recordedAt = new Date();
    return this.lactationRecordRepo.save(record);
  }

  /**
   * Review milk record (manager approves or flags)
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async reviewLactationRecord(
    recordId: string,
    userId: string,
    dto: ReviewLactationRecordDto,
  ): Promise<LactationRecord> {
    const record = await this.lactationRecordRepo.findOne({
      where: { id: recordId },
      relations: ['lactationCycle', 'lactationCycle.cow'],
    });

    if (!record) {
      throw new NotFoundException(`Lactation record ${recordId} not found`);
    }

    if (record.status !== LactationRecordStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted records can be reviewed');
    }

    record.status = LactationRecordStatus.REVIEWED;
    record.reviewedById = userId;
    record.reviewedAt = new Date();
    record.reviewNote = dto.reviewNote ?? null;

    return this.lactationRecordRepo.save(record);
  }

  /**
   * Update milk record (worker edits draft/flagged)
   * Authorization: Controller guard ensures it's the recorder's own record
   */
  async updateLactationRecord(
    recordId: string,
    userId: string,
    dto: UpdateLactationRecordDto,
  ): Promise<LactationRecord> {
    const record = await this.lactationRecordRepo.findOne({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException(`Lactation record ${recordId} not found`);
    }

    if (record.recordedById !== userId) {
      throw new BadRequestException('You can only edit your own records');
    }

    if (record.status !== LactationRecordStatus.DRAFT) {
      throw new BadRequestException('Only draft records can be edited');
    }

    Object.assign(record, dto);
    return this.lactationRecordRepo.save(record);
  }

  /**
   * Get all milk records for a cow (paginated)
   * Authorization: Controller guard ensures farm access
   */
  async getLactationRecords(
    cowId: string,
    page = 1,
    limit = 30,
  ): Promise<{ records: LactationRecord[]; total: number }> {
    const [records, total] = await this.lactationRecordRepo.findAndCount({
      where: { lactationCycle: { cowId } },
      relations: ['lactationCycle', 'recordedBy', 'reviewedBy'],
      order: { recordDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { records, total };
  }

  /**
   * End lactation cycle (dry off)
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async endLactation(
    cycleId: string,
    dryOffDate: string,
  ): Promise<LactationCycle> {
    const cycle = await this.lactationCycleRepo.findOne({
      where: { id: cycleId },
      relations: ['cow'],
    });

    if (!cycle) {
      throw new NotFoundException(`Lactation cycle ${cycleId} not found`);
    }

    cycle.dryOffDate = new Date(dryOffDate);
    cycle.status = LactationCycleStatus.COMPLETED;
    const saved = await this.lactationCycleRepo.save(cycle);

    // Update cow state
    cycle.cow.isCurrentlyLactating = false;
    cycle.cow.daysInMilk = null;
    await this.cowRepo.save(cycle.cow);

    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BREEDING MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record a breeding event (insemination or mating)
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async recordBreeding(
    cowId: string,
    dto: CreateBreedingRecordDto,
  ): Promise<BreedingRecord> {
    const cow = await this.cowRepo.findOne({ where: { id: cowId } });

    if (!cow) {
      throw new NotFoundException(`Cow ${cowId} not found`);
    }

    const record = this.breedingRecordRepo.create({
      ...dto,
      cowId,
      serviceDate: new Date(dto.serviceDate),
      status: BreedingStatus.PENDING,
    });

    const saved = await this.breedingRecordRepo.save(record);

    // Update cow: next heat is ~21 days away from service
    const nextHeat = new Date(dto.serviceDate);
    nextHeat.setDate(nextHeat.getDate() + 21);
    cow.expectedNextHeatDate = nextHeat;
    await this.cowRepo.save(cow);

    return saved;
  }

  /**
   * Confirm pregnancy (after palpation or ultrasound)
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async confirmPregnancy(
    breedingId: string,
    dto: ConfirmPregnancyDto,
  ): Promise<BreedingRecord> {
    const record = await this.breedingRecordRepo.findOne({
      where: { id: breedingId },
      relations: ['cow'],
    });

    if (!record) {
      throw new NotFoundException(`Breeding record ${breedingId} not found`);
    }

    record.pregnancyConfirmedDate = new Date(dto.pregnancyConfirmedDate);
    record.isPregnant = true;
    record.status = BreedingStatus.CONFIRMED;

    // Calculate expected birth date (280 days gestation)
    const expectedBirth = new Date(record.serviceDate);
    expectedBirth.setDate(expectedBirth.getDate() + 280);
    record.expectedBirthDate = expectedBirth;

    const saved = await this.breedingRecordRepo.save(record);

    // Update cow: expected birth date
    record.cow.expectedNextHeatDate = expectedBirth;
    await this.cowRepo.save(record.cow);

    return saved;
  }

  /**
   * Update breeding record
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async updateBreeding(
    breedingId: string,
    dto: UpdateBreedingRecordDto,
  ): Promise<BreedingRecord> {
    const record = await this.breedingRecordRepo.findOne({
      where: { id: breedingId },
    });

    if (!record) {
      throw new NotFoundException(`Breeding record ${breedingId} not found`);
    }

    Object.assign(record, dto);
    if (dto.serviceDate) {
      record.serviceDate = new Date(dto.serviceDate);
    }

    return this.breedingRecordRepo.save(record);
  }

  /**
   * Mark breeding as unsuccessful (cow came back in heat)
   * Authorization: Controller guard ensures MANAGER/OWNER
   */
  async markBreedingUnsuccessful(breedingId: string): Promise<BreedingRecord> {
    const record = await this.breedingRecordRepo.findOne({
      where: { id: breedingId },
      relations: ['cow'],
    });

    if (!record) {
      throw new NotFoundException(`Breeding record ${breedingId} not found`);
    }

    record.status = BreedingStatus.UNSUCCESSFUL;
    record.isPregnant = false;
    record.pregnancyConfirmedDate = null;
    record.expectedBirthDate = null;

    const saved = await this.breedingRecordRepo.save(record);

    // Update cow: next heat is now
    record.cow.expectedNextHeatDate = new Date();
    await this.cowRepo.save(record.cow);

    return saved;
  }

  /**
   * Get breeding records for a cow
   * Authorization: Controller guard ensures farm access
   */
  async getBreedingRecords(cowId: string): Promise<BreedingRecord[]> {
    return this.breedingRecordRepo.find({
      where: { cowId },
      order: { serviceDate: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HEALTH MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record a health event (mastitis, lameness, injury, etc)
   * Authorization: Controller guard ensures WORKER/MANAGER/OWNER
   */
  async recordHealthEvent(
    farmId: string,
    cowId: string,
    userId: string,
    dto: CreateHealthEventDto,
  ): Promise<any> {
    // const healthEvent = await this.healthEventService.create(
    //   farmId,
    //   userId,
    //   dto,
    // );
      dto.animalType = AnimalType.COW;
      dto.animalId = cowId; 

     await this.getCow(cowId);
    return this.healthOrchestrator.recordHealthEventWithSideEffects(
      farmId,
      userId,
      dto,
    );
    // return cow;
  }

  /**
   * Resolve a health event
   * Authorization: Controller guard ensures WORKER/MANAGER/OWNER
   */
  async resolveHealthEvent(
    eventId: string,
    userId: string,
    dto: ResolveHealthEventDto,
  ): Promise<any> {
    const healthEvent = await this.healthEventService.resolveHealthEvent(
      eventId,
      userId,
      dto,
    );
    return healthEvent;
  }

  /**
   * Get health events for a cow
   * Authorization: Controller guard ensures farm access
   */
  async getHealthEvents(cowId: string): Promise<any[]> {
    return this.healthEventService.getAnimalHealthEvents(AnimalType.COW, cowId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARDS & SUMMARIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get comprehensive summary for a single cow
   * Authorization: Controller guard ensures farm access
   */
  async getCowSummary(cowId: string): Promise<CowSummaryDto> {
    const cow = await this.cowRepo.findOne({
      where: { id: cowId },
      relations: ['lactationCycles', 'breedingRecords', 'healthEvents'],
    });

    if (!cow) {
      throw new NotFoundException(`Cow ${cowId} not found`);
    }

    // Current lactation
    const currentLactation = cow.lactationCycles?.find(
      (c) => c.status === LactationCycleStatus.ACTIVE,
    );

    // Current breeding
    const currentBreeding = cow.breedingRecords?.find(
      (b) =>
        b.status === BreedingStatus.PENDING ||
        b.status === BreedingStatus.CONFIRMED,
    );

    // 7-day yield
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7DayRecords = await this.lactationRecordRepo.find({
      where: {
        lactationCycle: { cowId },
        recordDate: { $gte: sevenDaysAgo } as any,
      },
    });

    const last7DayYield = last7DayRecords.reduce(
      (sum, r) => sum + r.yieldLitres,
      0,
    );

    // Average yield (all time)
    const allRecords = await this.lactationRecordRepo.find({
      where: { lactationCycle: { cowId } },
    });

    const avgYield =
      allRecords.length > 0
        ? allRecords.reduce((sum, r) => sum + r.yieldLitres, 0) /
          allRecords.length
        : 0;

    // Age
    const ageMonths = Math.floor(
      (new Date().getTime() - new Date(cow.dateOfBirth).getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    );

    // Recent health events
    const healthEvents = await this.healthEventService.getAnimalHealthEvents(
      AnimalType.COW,
      cowId,
    );
    const recentHealthEvents = healthEvents
      .filter((e) => e.status !== HealthEventStatus.REPORTED)
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        condition: e.condition as HealthCondition,
        occurredDate: e.occurredDate,
        resolved:
          e.status === HealthEventStatus.RESOLVED ||
          e.status === HealthEventStatus.FATAL,
      }));

    return {
      id: cow.id,
      tagId: cow.tagId,
      name: cow.name,
      type: cow.type,
      breed: cow.breed,
      dateOfBirth: cow.dateOfBirth,
      dateAcquired: cow.dateAcquired,
      status: cow.status,
      currentWeightKg: cow.currentWeightKg,
      ageMonths,
      lactationNumber: cow.lactationNumber,
      isCurrentlyLactating: cow.isCurrentlyLactating,
      daysInMilk: cow.daysInMilk,
      expectedNextHeatDate: cow.expectedNextHeatDate,
      currentLactation: currentLactation
        ? {
            id: currentLactation.id,
            freshenDate: currentLactation.freshenDate,
            lactationNumber: currentLactation.lactationNumber,
            daysActive: Math.floor(
              (new Date().getTime() - currentLactation.freshenDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          }
        : null,
      currentBreeding: currentBreeding
        ? {
            id: currentBreeding.id,
            serviceDate: currentBreeding.serviceDate,
            status: currentBreeding.status,
            expectedBirthDate: currentBreeding.expectedBirthDate,
          }
        : null,
      recentHealthEvents,
      last7DayYield,
      avgYield,
    };
  }

  /**
   * Farm-wide dairy summary (dashboard overview)
   * Authorization: Controller guard ensures farm access
   */
  async getDairyFarmSummary(farmId: string): Promise<DairyFarmSummaryDto> {
    const cows = await this.cowRepo.find({ where: { farmId } });
    const activeCows = cows.filter((c) => c.status === 'active');
    const cowsInMilk = activeCows.filter((c) => c.isCurrentlyLactating);

    // Yesterday's yield
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayRecords = await this.lactationRecordRepo.find({
      where: {
        lactationCycle: { cow: { farmId } },
        recordDate: yesterday,
      },
    });

    const totalYesterdayLitres = yesterdayRecords.reduce(
      (sum, r) => sum + r.yieldLitres,
      0,
    );

    const avgYieldPerCow =
      cowsInMilk.length > 0 ? totalYesterdayLitres / cowsInMilk.length : 0;

    // Breeding pipeline
    const pregnantCows = await this.breedingRecordRepo.find({
      where: {
        cow: { farmId },
        isPregnant: true,
        status: BreedingStatus.CONFIRMED,
      },
    });

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);

    const nextMonthStart = new Date();
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
    nextMonthStart.setDate(1);

    const birthsThisMonth = pregnantCows.filter((br) => {
      const expected = br.expectedBirthDate;
      return (
        expected && expected >= thisMonthStart && expected < nextMonthStart
      );
    }).length;

    const birthsNextMonth = pregnantCows.filter((br) => {
      const expected = br.expectedBirthDate;
      const nextNext = new Date();
      nextNext.setMonth(nextNext.getMonth() + 2);
      nextNext.setDate(1);
      return expected && expected >= nextMonthStart && expected < nextNext;
    }).length;

    // Ready to breed (heat expected today)
    const readyToBreed = activeCows.filter(
      (c) => c.expectedNextHeatDate && c.expectedNextHeatDate <= new Date(),
    ).length;

    // Health events
    const allActiveHealthEvents =
      await this.healthEventService.getFarmActiveHealthEvents(farmId);
    const activeHealthEvents = allActiveHealthEvents.filter(
      (e) => e.animalType === AnimalType.COW,
    );

    const healthAlertsToday = activeHealthEvents
      .filter(
        (e) =>
          new Date(e.occurredDate).toDateString() === new Date().toDateString(),
      )
      .map((e) => e.condition as HealthCondition);

    const mastitusCases = activeHealthEvents.filter(
      (e) => e.condition === HealthCondition.MASTITIS,
    ).length;
    const lamenessCases = activeHealthEvents.filter(
      (e) => e.condition === HealthCondition.LAMENESS,
    ).length;

    // Top/bottom producers
    const allRecords = await this.lactationRecordRepo.find({
      where: { lactationCycle: { cow: { farmId } } },
      relations: ['lactationCycle', 'lactationCycle.cow'],
      order: { recordDate: 'DESC' },
    });

    const yieldByDay = new Map<
      string,
      { yieldLitres: number; cow: Cow; recordDate: Date }
    >();
    allRecords.forEach((r) => {
      if (!yieldByDay.has(r.lactationCycle.cow.id)) {
        yieldByDay.set(r.lactationCycle.cow.id, {
          yieldLitres: 0,
          cow: r.lactationCycle.cow,
          recordDate: r.recordDate,
        });
      }
      const entry = yieldByDay.get(r.lactationCycle.cow.id)!;
      entry.yieldLitres += r.yieldLitres;
    });

    const sorted = Array.from(yieldByDay.values()).sort(
      (a, b) => b.yieldLitres - a.yieldLitres,
    );

    return {
      totalCows: cows.length,
      activeCows: activeCows.length,
      soldThisYear: cows.filter((c) => c.status === 'sold' && c.dateLeft)
        .length,
      deceasedThisYear: cows.filter((c) => c.status === 'deceased').length,
      cowsInMilk: cowsInMilk.length,
      avgYieldPerCow,
      totalYesterdayLitres,
      cowsPregnant: pregnantCows.length,
      expectedBirthsThisMonth: birthsThisMonth,
      expectedBirthsNextMonth: birthsNextMonth,
      cowsReadyToBreed: readyToBreed,
      healthAlertsToday,
      activeMastitusCases: mastitusCases,
      activeLamenessCases: lamenessCases,
      highestProducers: sorted.slice(0, 5).map((entry) => ({
        cowTagId: entry.cow.tagId || entry.cow.name || entry.cow.id,
        yieldLitres: entry.yieldLitres,
        daysInMilk: entry.cow.daysInMilk ?? 0,
      })),
      lowestProducers: sorted
        .slice(-5)
        .reverse()
        .map((entry) => ({
          cowTagId: entry.cow.tagId || entry.cow.name || entry.cow.id,
          yieldLitres: entry.yieldLitres,
          daysInMilk: entry.cow.daysInMilk ?? 0,
        })),
    };
  }

  /**
   * Get breeding calendar (upcoming heats, expected births, pregnancy checks)
   * Authorization: Controller guard ensures farm access
   */
  async getBreedingCalendar(farmId: string): Promise<BreedingCalendarDto> {
    const cows = await this.cowRepo.find({
      where: { farmId },
      relations: ['breedingRecords'],
    });

    const today = new Date();

    // Due to breed soon (heat expected within 7 days)
    const dueToBreedSoon = cows
      .filter(
        (c) =>
          c.expectedNextHeatDate &&
          c.expectedNextHeatDate > today &&
          c.expectedNextHeatDate <=
            new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      )
      .map((c) => {
        const lastBreeding = c.breedingRecords?.[0];
        return {
          cowTagId: c.tagId || c.name || c.id,
          daysUntilHeat: Math.floor(
            (c.expectedNextHeatDate!.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
          lastServiceDate: lastBreeding?.serviceDate || new Date(),
          lastStatus: lastBreeding?.status || 'unknown',
        };
      });

    // Due to give birth (expected within 30 days)
    const dueToBirth = cows
      .filter(
        (c) =>
          c.expectedNextHeatDate &&
          c.expectedNextHeatDate > today &&
          c.expectedNextHeatDate <=
            new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      )
      .map((c) => ({
        cowTagId: c.tagId || c.name || c.id,
        daysUntilBirth: Math.floor(
          (c.expectedNextHeatDate!.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        expectedBirthDate: c.expectedNextHeatDate!,
        currentLactationNumber: c.lactationNumber || 0,
      }));

    // Pregnancy checks pending (21–35 days post service)
    const pendingChecks = await this.breedingRecordRepo.find({
      where: {
        cow: { farmId },
        status: BreedingStatus.PENDING,
      },
      relations: ['cow'],
    });

    const pregnancyChecksPending = pendingChecks
      .filter((b) => {
        const daysSinceService = Math.floor(
          (today.getTime() - b.serviceDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysSinceService >= 21 && daysSinceService <= 35;
      })
      .map((b) => ({
        cowTagId: b.cow.tagId || b.cow.name || b.cow.id,
        serviceDate: b.serviceDate,
        daysPostService: Math.floor(
          (today.getTime() - b.serviceDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      }));

    return {
      dueToBreedSoon,
      dueToBirth,
      pregnancyChecksPending,
    };
  }
}
