import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PoultryHouse } from './entities/poultry-house.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  Flock,
  FlockStatus,
  FlockType,
  FlockStage,
} from './entities/flock.entity';
import { FlockRecord, RecordStatus } from './entities/flock-record.entity';
import {
  CreatePoultryHouseDto,
  UpdatePoultryHouseDto,
  CreateFlockDto,
  UpdateFlockDto,
  CreateFlockRecordDto,
  UpdateFlockRecordDto,
  ReviewFlockRecordDto,
} from './dto/poultry.dto';
import { RevenueCategory } from '../finance/enums/revenue-category.enum';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * POULTRY SERVICE — AGRIBUSINESS INTELLIGENCE ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * ONE SERVICE, MANY CAPABILITIES:
 * ├── House Operations Management
 * ├── Flock Lifecycle Intelligence
 * ├── Daily Record Processing & Analytics
 * ├── Financial Engine (feeds, revenue, profit)
 * ├── Health & Risk Detection
 * ├── KPI & Benchmarking
 * ├── Alert Generation
 * ├── Strategic Reporting
 * └── Forecasting & Decision Support
 *
 * This service functions as a poultry farm's operational brain.
 * Every operation is augmented with business intelligence.
 */

@Injectable()
export class PoultryService {
  constructor(
    @InjectRepository(PoultryHouse)
    private readonly houseRepo: Repository<PoultryHouse>,

    @InjectRepository(Flock)
    private readonly flockRepo: Repository<Flock>,

    @InjectRepository(FlockRecord)
    private readonly recordRepo: Repository<FlockRecord>,

    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // HOUSE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════════

  async createHouse(
    farmId: string,
    dto: CreatePoultryHouseDto,
  ): Promise<PoultryHouse> {
    const house = this.houseRepo.create({ ...dto, farmId });
    return this.houseRepo.save(house);
  }

  async getHouses(farmId: string): Promise<PoultryHouse[]> {
    return this.houseRepo.find({
      where: { farmId },
      relations: ['flocks'],
      order: { createdAt: 'ASC' },
    });
  }

  async getHouse(houseId: string): Promise<PoultryHouse> {
    const house = await this.houseRepo.findOne({
      where: { id: houseId },
      relations: ['farm', 'flocks'],
    });

    if (!house) {
      throw new NotFoundException(`House ${houseId} not found`);
    }

    return house;
  }

  async updateHouse(
    houseId: string,
    dto: UpdatePoultryHouseDto,
  ): Promise<PoultryHouse> {
    const house = await this.getHouse(houseId);
    Object.assign(house, dto);
    return this.houseRepo.save(house);
  }

  async deleteHouse(houseId: string): Promise<void> {
    const house = await this.houseRepo.findOne({
      where: { id: houseId },
      relations: ['flocks'],
    });

    if (!house) throw new NotFoundException('House not found');

    if (house.flocks && house.flocks.length > 0) {
      throw new BadRequestException(
        `Cannot delete house while it has ${house.flocks.length} flock(s). Delete flocks first.`,
      );
    }

    await this.houseRepo.delete(houseId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // FLOCK LIFECYCLE INTELLIGENCE ENGINE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * CREATE FLOCK — Smart initialization with full business setup
   * ✓ Validates breed & flock type
   * ✓ Initializes benchmarks & targets
   * ✓ Forecasts feed demand & break-even
   * ✓ Sets production expectations
   */
  async createFlock(houseId: string, dto: CreateFlockDto): Promise<Flock> {
    const house = await this.getHouse(houseId);

    // ── 1. One active flock per house (existing check) ───────────────────────
    // const activeFlock = await this.flockRepo.findOne({
    //   where: { houseId, status: FlockStatus.ACTIVE },
    // });
    // if (activeFlock) {
    //   throw new ConflictException(
    //     `House "${house.name}" already has an active flock. ` +
    //       `Close "${activeFlock.breed}" before starting a new batch.`,
    //   );
    // }

    // ── 1. Capacity validation (NEW) ─────────────────────────────────────────
    // Count birds currently occupying space: only active flocks consume capacity.
    const occupiedResult = await this.flockRepo
      .createQueryBuilder('flock')
      .select('COALESCE(SUM(flock.currentCount), 0)', 'occupied')
      .where('flock.houseId = :houseId', { houseId })
      .andWhere('flock.status = :status', { status: FlockStatus.ACTIVE })
      .getRawOne<{ occupied: string }>();

    const currentlyOccupied = parseInt(occupiedResult?.occupied ?? '0', 10);
    const availableSpace = house.capacity - currentlyOccupied;

    // Early return: if no space at all
    if (availableSpace <= 0) {
      throw new BadRequestException(
        `House "${house.name}" is at full capacity (${house.capacity}/${house.capacity} birds). ` +
          `No space available for new flock.`,
      );
    }

    if (dto.initialCount > availableSpace) {
      throw new BadRequestException(
        `House "${house.name}" cannot accommodate ${dto.initialCount.toLocaleString()} birds. ` +
          `Capacity: ${house.capacity.toLocaleString()} · ` +
          `Currently occupied: ${currentlyOccupied.toLocaleString()} · ` +
          `Available: ${availableSpace.toLocaleString()}. ` +
          `Try reducing flock size by ${(dto.initialCount - availableSpace).toLocaleString()} birds.`,
      );
    }

    // ── 3. Flock type requirements (existing checks) ─────────────────────────
    if (dto.type === FlockType.BROILERS && !dto.targetWeightKg) {
      throw new BadRequestException('targetWeightKg is required for broilers');
    }
    if (
      dto.type === FlockType.LAYERS &&
      dto.productionStartWeek === undefined
    ) {
      throw new BadRequestException(
        'productionStartWeek is required for layers',
      );
    }
    if (!dto.name) {
      const flockCount = await this.flockRepo.count({ where: { houseId } });
      dto.name = `Batch ${flockCount + 1}`;
    }

    // Create flock with initialization
    const flock = this.flockRepo.create({
      ...dto,
      houseId,
      currentCount: dto.initialCount,
      status: FlockStatus.ACTIVE,
      currentStage: this.assignInitialStage(dto.type),
    });

    // Initialize business metrics
    flock.feedCostTotal = 0;
    flock.revenueTotal = 0;
    flock.netProfit = 0;
    flock.roiPercent = 0;

    const saved = await this.flockRepo.save(flock);

    // Auto-generate initial benchmarks & forecasts
    await this.initializeFlockBenchmarks(saved);

    return saved;
  }

  /**
   * Assign initial stage based on flock type and age at placement
   */
  private assignInitialStage(type: FlockType): FlockStage {
    if (type === FlockType.BROILERS) {
      return FlockStage.BROODING;
    }
    return FlockStage.PLACED; // Layers also start brooding
  }

  /**
   * Initialize flock benchmarks — AI-driven target setting
   */
  private async initializeFlockBenchmarks(flock: Flock): Promise<void> {
    // Industry benchmarks (configurable per breed/type)
    const benchmarks = this.getBreedBenchmarks(flock.breed, flock.type);

    // Auto-set expectations
    flock.expectedMortalityPercent = benchmarks.expectedMortalityPercent;
    flock.expectedDailyFeedPerBirdGrams =
      benchmarks.expectedDailyFeedPerBirdGrams;
    flock.breakEvenTarget = benchmarks.breakEvenTarget;

    await this.flockRepo.save(flock);
  }

  /**
   * Return breed-specific benchmarks
   */
  private getBreedBenchmarks(
    breed: string,
    type: FlockType,
  ): {
    expectedMortalityPercent: number;
    expectedDailyFeedPerBirdGrams: number;
    breakEvenTarget: number;
  } {
    // Real-world benchmarks by breed
    const benchmarkMap: Record<
      string,
      {
        expectedMortalityPercent: number;
        expectedDailyFeedPerBirdGrams: number;
        breakEvenTarget: number;
      }
    > = {
      'Ross 308': {
        expectedMortalityPercent: 4,
        expectedDailyFeedPerBirdGrams: 95,
        breakEvenTarget: 2000, // 2000 KES profit threshold
      },
      'Kenbro Broiler': {
        expectedMortalityPercent: 5,
        expectedDailyFeedPerBirdGrams: 90,
        breakEvenTarget: 1800,
      },
      'ISA Brown': {
        expectedMortalityPercent: 3,
        expectedDailyFeedPerBirdGrams: 110,
        breakEvenTarget: 3000,
      },
      Sasso: {
        expectedMortalityPercent: 6,
        expectedDailyFeedPerBirdGrams: 85,
        breakEvenTarget: 1500,
      },
    };

    return (
      benchmarkMap[breed] || {
        expectedMortalityPercent: 5,
        expectedDailyFeedPerBirdGrams: 95,
        breakEvenTarget: 2000,
      }
    );
  }

  /**
   * Auto-update flock stage based on age and type
   */
  private async updateFlockStage(flock: Flock): Promise<void> {
    const ageInDays = this.getFlockAgeInDays(flock.placementDate);

    let newStage = flock.currentStage;

    if (flock.type === FlockType.BROILERS) {
      if (ageInDays < 10) newStage = FlockStage.BROODING;
      else if (ageInDays < 21) newStage = FlockStage.GROWING;
      else if (ageInDays < 35) newStage = FlockStage.GROWING;
      else newStage = FlockStage.HARVEST_READY;
    } else if (flock.type === FlockType.LAYERS) {
      if (ageInDays < 8) newStage = FlockStage.BROODING;
      else if (ageInDays < 16) newStage = FlockStage.GROWING;
      else if (ageInDays < (flock.productionStartWeek ?? 16) * 7)
        newStage = FlockStage.GROWING;
      else if (ageInDays < (flock.productionStartWeek ?? 16) * 7 + 30)
        newStage = FlockStage.LAYING_PEAK;
      else newStage = FlockStage.LAYING_DECLINE;
    }

    if (newStage !== flock.currentStage) {
      flock.currentStage = newStage;
      await this.flockRepo.save(flock);
    }
  }

  /**
   * Get flock age in days
   */
  private getFlockAgeInDays(placementDate: Date): number {
    const today = new Date();
    const placement = new Date(placementDate);
    const diffMs = today.getTime() - placement.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  async getFlocks(houseId: string): Promise<Flock[]> {
    await this.getHouse(houseId);
    return this.flockRepo.find({
      where: { houseId },
      order: { placementDate: 'DESC' },
    });
  }

  /**
   * CLOSE FLOCK — Full closure workflow with final analytics
   * ✓ Validates closure eligibility
   * ✓ Calculates mortality, FCR, ROI
   * ✓ Generates closure report
   * ✓ Triggers sanitation downtime
   */
  async closeFlock(flockId: string): Promise<{
    flock: Flock;
    closureReport: any;
  }> {
    const flock = await this.flockRepo.findOne({
      where: { id: flockId },
      relations: ['records'],
    });

    if (!flock) throw new NotFoundException();
    if (flock.status === FlockStatus.CLOSED) {
      return { flock, closureReport: { message: 'Already closed' } };
    }

    // ✅ VALIDATE: All birds accounted for
    const totalSoldOrDead = flock.initialCount - flock.currentCount;
    if (totalSoldOrDead < flock.initialCount) {
      throw new BadRequestException(
        `Cannot close. ${flock.currentCount} birds still alive. Record sales or mortality first.`,
      );
    }

    // ✅ USE EXISTING DATA - NO ESTIMATES!
    const totalMortality = flock.initialCount - flock.currentCount;
    const mortalityPercent = (totalMortality / flock.initialCount) * 100;

    // Calculate FCR if broilers
    let fcr: number | null = null;
    if (flock.type === FlockType.BROILERS && flock.records?.length) {
      const totalFeed = flock.records.reduce(
        (sum, r) => sum + r.feedConsumedKg,
        0,
      );
      const totalWeightGain = flock.records.reduce(
        (sum, r) => sum + (r.avgBodyWeightKg || 0) * (r.sampleSize || 1),
        0,
      );
      fcr = totalWeightGain > 0 ? totalFeed / totalWeightGain : null;
    }

    // ✅ UPDATE FLOCK - JUST MARK AS CLOSED
    flock.status = FlockStatus.CLOSED;
    flock.currentStage = FlockStage.CLOSED;
    flock.closedAt = new Date();
    flock.depletionReason = 'Harvest completed';
    flock.finalMortalityPercent = mortalityPercent;
    flock.feedConversionRatio = fcr;

    // Net profit already calculated from daily updates!
    // No need to recalculate!

    await this.flockRepo.save(flock);
    return {
      flock,
      closureReport: {
        message: 'Flock closed successfully',
        netProfit: flock.netProfit,
        roi: flock.roiPercent,
      },
    };
  }

  async getFlock(flockId: string): Promise<Flock> {
    const flock = await this.flockRepo.findOne({ where: { id: flockId } });
    if (!flock) throw new NotFoundException();
    return flock;
  }

  async updateFlock(flockId: string, dto: UpdateFlockDto): Promise<Flock> {
    const flock = await this.flockRepo.findOne({
      where: { id: flockId },
      relations: ['house'],
    });
    if (!flock) throw new NotFoundException(`Flock ${flockId} not found`);

    // Prevent shrinking initialCount below current live count
    if (
      dto.initialCount !== undefined &&
      dto.initialCount < (flock.currentCount ?? 0)
    ) {
      throw new BadRequestException(
        'initialCount cannot be less than currentCount',
      );
    }

    // Normalize date fields if provided
    if (dto.placementDate) {
      // Allow either Date or ISO string
      flock.placementDate = new Date(dto.placementDate as any);
    }

    Object.assign(flock, dto);

    const saved = await this.flockRepo.save(flock);

    // Re-evaluate flock stage after updates
    await this.updateFlockStage(saved);

    return saved;
  }

  async deleteFlock(flockId: string, farmId: string): Promise<void> {
    const flock = await this.flockRepo.findOne({ where: { id: flockId } });
    if (!flock) throw new NotFoundException();

    // Check if flock has records
    const recordCount = await this.recordRepo.count({ where: { flockId } });
    if (recordCount > 0) {
      throw new BadRequestException(
        `Cannot delete flock with ${recordCount} records. Delete records first.`,
      );
    }

    if (flock.status === FlockStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot delete an active flock. Close it first.',
      );
    }

    await this.flockRepo.delete(flockId);
  }
  // In poultry.service.ts

  async recordBirdSale(
    flockId: string,
    saleDetails: {
      buyer: string;
      quantity: number;
      pricePerBird: number;
      saleDate: Date;
      receiptNumber?: string;
      paymentStatus?: 'pending' | 'paid' | 'partial';
      notes?: string;
    },
  ): Promise<Flock> {
    const flock = await this.flockRepo.findOne({
      where: { id: flockId },
      relations: ['house'],
    });

    if (!flock) throw new NotFoundException(`Flock ${flockId} not found`);
    if (flock.status === FlockStatus.CLOSED) {
      throw new BadRequestException('Cannot record sale for a closed flock');
    }
    if (saleDetails.quantity > flock.currentCount) {
      throw new BadRequestException(
        `Only ${flock.currentCount} birds available`,
      );
    }

    const totalAmount = saleDetails.quantity * saleDetails.pricePerBird;
    if (!flock.sales) {
      flock.sales = [];
    }

    flock.sales.push({
      buyer: saleDetails.buyer,
      quantity: saleDetails.quantity,
      pricePerBird: saleDetails.pricePerBird,
      totalAmount,
      saleDate: saleDetails.saleDate,
      receiptNumber: saleDetails.receiptNumber,
      paymentStatus: saleDetails.paymentStatus || 'pending',
      notes: saleDetails.notes,
    });

    // ✅ ONLY update these two fields
    flock.revenueTotal += totalAmount;
    flock.currentCount -= saleDetails.quantity;

    flock.netProfit = flock.revenueTotal - flock.feedCostTotal;
    flock.roiPercent =
      flock.feedCostTotal > 0
        ? (flock.netProfit / flock.feedCostTotal) * 100
        : 0;

    const saved = await this.flockRepo.save(flock);

    // Emit event for finance
    this.eventEmitter.emit('poultry.bird_sale.recorded', {
      // Required for CreateRevenueEntryDto
      category:
        flock.type === 'layers'
          ? RevenueCategory.LIVE_BIRDS
          : RevenueCategory.MEAT,
      description: `${saleDetails.quantity} ${flock.breed} ${flock.type === 'layers' ? 'spent layers' : 'broilers'} sold to ${saleDetails.buyer}`,
      soldDate: saleDetails.saleDate.toISOString().split('T')[0],
      quantity: saleDetails.quantity,
      unit: 'bird',
      unitPrice: saleDetails.pricePerBird,
      farmId: flock.house.farmId,

      // Optional fields
      buyer: saleDetails.buyer,
      relatedProductionLogId: flockId,
      receiptNumber: saleDetails.receiptNumber,
      notes: `Flock type: ${flock.type}. Breed: ${flock.breed}. Sale completed.`,
    });

    return saved;
  }
  /**
   * Generate comprehensive closure report
   */
  private async generateClosureReport(flock: Flock): Promise<{
    reason: string;
    totalMortality: number;
    mortalityPercent: number;
    feedUsedKg: number;
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    roi: number;
    feedConversionRatio: number;
  }> {
    const records = await this.recordRepo.find({
      where: { flockId: flock.id },
    });

    const totalMortality = records.reduce(
      (sum, r) => sum + r.mortality + r.culls,
      0,
    );
    const mortalityPercent =
      flock.initialCount > 0 ? (totalMortality / flock.initialCount) * 100 : 0;

    const feedUsedKg = records.reduce((sum, r) => sum + r.feedConsumedKg, 0);

    // Calculate revenue (simplified — based on eggs or broiler weight)
    let totalRevenue = 0;
    if (flock.type === FlockType.LAYERS) {
      const totalEggs = records.reduce(
        (sum, r) =>
          sum +
          (r.morningEggs ?? 0) +
          (r.eveningEggs ?? 0) -
          (r.brokenEggs ?? 0) -
          (r.dirtyEggs ?? 0),
        0,
      );
      totalRevenue = totalEggs * 4; // Assume 4 KES per egg
    } else {
      // Broilers: estimate based on final weight
      const finalWeightEgg = records[records.length - 1]?.avgBodyWeightKg ?? 0;
      const survivors = flock.currentCount;
      const totalWeightKg = survivors * finalWeightEgg;
      totalRevenue = totalWeightKg * 250; // Assume 250 KES per kg
    }

    // Estimate costs (simplified)
    const feedCostPerKg = 35; // KES per kg
    const feedCost = feedUsedKg * feedCostPerKg;
    const mortalityCost = totalMortality * 800; // Assume 800 KES per bird loss
    const totalCost = feedCost + mortalityCost;

    const netProfit = totalRevenue - totalCost;
    const roi =
      totalCost > 0 ? ((netProfit / totalCost) * 100).toFixed(2) : 'N/A';

    const feedConversionRatio =
      flock.type === FlockType.BROILERS && flock.currentCount > 0
        ? feedUsedKg / (flock.currentCount * 2.5) // Assume avg 2.5kg final weight
        : 0;

    return {
      reason: 'Harvest completed',
      totalMortality,
      mortalityPercent: parseFloat(mortalityPercent.toFixed(2)),
      feedUsedKg: parseFloat(feedUsedKg.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      roi: typeof roi === 'number' ? roi : parseFloat(roi),
      feedConversionRatio: parseFloat(feedConversionRatio.toFixed(3)),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DAILY RECORD INTELLIGENCE ENGINE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * CREATE RECORD — The operational heart
   * ✓ Validates record completeness
   * ✓ Calculates KPIs
   * ✓ Detects anomalies
   * ✓ Updates cumulative flock metrics
   * ✓ Generates alerts
   */
  async createRecord(
    flockId: string,
    userId: string,
    dto: CreateFlockRecordDto,
  ): Promise<{
    record: FlockRecord;
    alerts: any[];
    kpis: any;
  }> {
    const flock = await this.flockRepo.findOne({
      where: { id: flockId },
      relations: ['house', 'house.farm'],
    });
    if (!flock) throw new NotFoundException(`Flock ${flockId} not found`);
    if (flock.status !== FlockStatus.ACTIVE) {
      throw new BadRequestException('Cannot add records to a closed flock');
    }

    // Check for duplicate record
    const existing = await this.recordRepo.findOne({
      where: { flockId, recordDate: new Date(dto.recordDate) },
    });
    if (existing) {
      throw new ConflictException(
        `A record for ${dto.recordDate} already exists. Edit the existing one.`,
      );
    }

    // Validate record completeness
    this.validateRecordCompleteness(flock, dto);

    // Calculate mortality impact
    const mortality = dto.mortality ?? 0;
    const culls = dto.culls ?? 0;
    const liveBirdsAfterRecord = Math.max(
      0,
      flock.currentCount - mortality - culls,
    );

    if (liveBirdsAfterRecord < 0) {
      throw new BadRequestException(
        `Mortality + culls (${mortality + culls}) exceeds current live count (${flock.currentCount})`,
      );
    }

    // Calculate KPIs
    const kpis = this.calculateRecordKPIs(flock, dto, liveBirdsAfterRecord);

    // Create record
    const record = this.recordRepo.create({
      ...dto,
      flockId,
      submittedById: userId,
      recordDate: new Date(dto.recordDate),
      status: RecordStatus.DRAFT,
      liveBirdsAfterRecord,
      productionRatePercent: kpis.productionRatePercent,
      feedConversionRatio: kpis.feedConversionRatio,
      feedCost: kpis.feedCost,
      eggRevenue: kpis.eggRevenue,
      mortalityCost: kpis.mortalityCost,
      healthRiskScore: kpis.healthRiskScore,
    });

    const saved = await this.recordRepo.save(record);

    // Update flock cumulative metrics
    flock.currentCount = liveBirdsAfterRecord;
    flock.feedCostTotal += kpis.feedCost;
    flock.revenueTotal += kpis.eggRevenue;
    flock.netProfit = flock.revenueTotal - flock.feedCostTotal;
    flock.roiPercent =
      flock.feedCostTotal > 0
        ? (flock.netProfit / flock.feedCostTotal) * 100
        : 0;

    await this.flockRepo.save(flock);

    // Auto-update stage
    await this.updateFlockStage(flock);

    // Detect anomalies and generate alerts
    const alerts = await this.detectAndGenerateAlerts(saved, flock);
    // After saving the record, emit event
    this.eventEmitter.emit('poultry.flock_record.created', {
      flockRecordId: saved.id,
      flockId: flock.id,
      farmId: flock.house.farmId,
      feedItemId: dto.feedItemId,
      feedConsumedKg: dto.feedConsumedKg,
      eggsProduced: (dto.morningEggs || 0) + (dto.eveningEggs || 0),
      recordDate: saved.recordDate,
      mortalityCount: (dto.mortality || 0) + (dto.culls || 0),
      supplier: dto.feedType || 'unknown',
      flockType: flock.type,
      breed: flock.breed,
      liveBirds: saved.liveBirdsAfterRecord,
    });

    return {
      record: saved,
      alerts,
      kpis,
    };
  }

  /**
   * Validate record has all required fields for flock type
   */
  private validateRecordCompleteness(
    flock: Flock,
    dto: CreateFlockRecordDto,
  ): void {
    if (flock.type === FlockType.LAYERS) {
      if (dto.morningEggs === undefined && dto.eveningEggs === undefined) {
        throw new BadRequestException(
          'At least morningEggs or eveningEggs is required for layers',
        );
      }
    }

    if (flock.type === FlockType.BROILERS) {
      if (dto.avgBodyWeightKg === undefined) {
        throw new BadRequestException(
          'avgBodyWeightKg is required for broilers',
        );
      }
    }
  }

  /**
   * Calculate all KPIs for the record
   */
  private calculateRecordKPIs(
    flock: Flock,
    dto: CreateFlockRecordDto,
    liveBirdsAfterRecord: number,
  ): {
    productionRatePercent: number | null;
    feedConversionRatio: number | null;
    feedCost: number;
    eggRevenue: number;
    mortalityCost: number;
    healthRiskScore: number;
  } {
    let productionRatePercent: number | null = null;
    let feedConversionRatio: number | null = null;
    let eggRevenue = 0;
    let feedCost = 0;
    let mortalityCost = 0;

    // Feed cost (assume 35 KES/kg)
    feedCost = dto.feedConsumedKg * 35;

    // Mortality cost (assume 800 KES/bird)
    mortalityCost = (dto.mortality ?? 0) * 800;

    if (flock.type === FlockType.LAYERS) {
      const totalEggs = (dto.morningEggs ?? 0) + (dto.eveningEggs ?? 0);
      const netEggs = totalEggs - (dto.brokenEggs ?? 0) - (dto.dirtyEggs ?? 0);

      if (liveBirdsAfterRecord > 0) {
        productionRatePercent = parseFloat(
          ((totalEggs / liveBirdsAfterRecord) * 100).toFixed(2),
        );
      }

      // Revenue (assume 4 KES per egg)
      eggRevenue = netEggs * 4;
    }

    if (flock.type === FlockType.BROILERS && dto.avgBodyWeightKg) {
      const weightGain = dto.avgBodyWeightKg * (dto.sampleSize ?? 1);
      if (weightGain > 0) {
        feedConversionRatio = parseFloat(
          (dto.feedConsumedKg / weightGain).toFixed(3),
        );
      }
    }

    // Health risk score (0-100)
    const healthRiskScore = this.calculateHealthRiskScore(
      dto.sickBirds ?? 0,
      dto.mortality ?? 0,
      liveBirdsAfterRecord,
      dto.temperatureCelsius ?? 24,
    );

    return {
      productionRatePercent,
      feedConversionRatio,
      feedCost,
      eggRevenue,
      mortalityCost,
      healthRiskScore,
    };
  }

  /**
   * Health risk assessment (0-100 scale)
   */
  private calculateHealthRiskScore(
    sickBirds: number,
    mortality: number,
    liveBirds: number,
    tempCelsius: number,
  ): number {
    let score = 0;

    // Sick bird percentage (max 40 points)
    if (liveBirds > 0) {
      const sickPercent = (sickBirds / liveBirds) * 100;
      score += Math.min(40, sickPercent * 2);
    }

    // Mortality spike (max 30 points)
    if (liveBirds > 0) {
      const mortalityPercent = (mortality / liveBirds) * 100;
      score += Math.min(30, mortalityPercent * 1.5);
    }

    // Temperature deviation (max 20 points)
    // Optimal: 24°C for adults
    const tempDeviation = Math.abs(tempCelsius - 24);
    score += Math.min(20, tempDeviation * 2);

    // Overcrowding risk (max 10 points) — if available
    // score += overcrowdingRisk;

    return Math.min(100, parseFloat(score.toFixed(2)));
  }

  /**
   * Detect anomalies and generate alerts
   */
  private async detectAndGenerateAlerts(
    record: FlockRecord,
    flock: Flock,
  ): Promise<any[]> {
    const alerts: any[] = [];

    // High mortality alert
    if ((record.mortality ?? 0) > 5 || (record.culls ?? 0) > 5) {
      alerts.push({
        type: 'HIGH_MORTALITY',
        severity: 'HIGH',
        message: `Unusual mortality detected: ${record.mortality} deaths, ${record.culls} culls`,
        estimatedLoss: ((record.mortality ?? 0) + (record.culls ?? 0)) * 800,
        action: 'Investigate disease, water quality, or feed issues',
      });
    }

    // Production drop (layers)
    if (flock.type === FlockType.LAYERS && record.productionRatePercent) {
      if (record.productionRatePercent < 60) {
        alerts.push({
          type: 'PRODUCTION_DECLINE',
          severity: 'MEDIUM',
          message: `Egg production drop: ${record.productionRatePercent}% (expected >80%)`,
          action: 'Review feed quality, stress factors, and health status',
        });
      }
    }

    // Feed inefficiency (broilers)
    if (flock.type === FlockType.BROILERS && record.feedConversionRatio) {
      if (record.feedConversionRatio > 2.2) {
        alerts.push({
          type: 'POOR_FCR',
          severity: 'MEDIUM',
          message: `Feed conversion ratio high: ${record.feedConversionRatio} (target <2.0)`,
          estimatedLoss: record.feedCost * 0.15,
          action: 'Optimize feeding strategy or investigate intestinal health',
        });
      }
    }

    // Health risk
    if (record.healthRiskScore > 50) {
      alerts.push({
        type: 'HEALTH_RISK',
        severity: record.healthRiskScore > 75 ? 'HIGH' : 'MEDIUM',
        message: `Health risk score: ${record.healthRiskScore}/100`,
        action: 'Quarantine affected birds and isolate house',
      });
    }

    // Profitability decline
    if (flock.netProfit < 0) {
      alerts.push({
        type: 'PROFITABILITY_DECLINE',
        severity: 'HIGH',
        message: `Flock net profit is negative: ${flock.netProfit} KES`,
        action: 'Review pricing, feed costs, and consider early harvest',
      });
    }

    return alerts;
  }

  /**
   * UPDATE RECORD
   */
  async updateRecord(
    recordId: string,
    userId: string,
    dto: UpdateFlockRecordDto,
  ): Promise<FlockRecord> {
    const record = await this.recordRepo.findOne({ where: { id: recordId } });
    if (!record) throw new NotFoundException();
    if (record.submittedById !== userId) throw new ForbiddenException();
    if (
      record.status !== RecordStatus.DRAFT &&
      record.status !== RecordStatus.FLAGGED
    ) {
      throw new BadRequestException(
        'Only draft or flagged records can be edited',
      );
    }

    if (record.status === RecordStatus.FLAGGED) {
      record.status = RecordStatus.DRAFT;
      record.reviewNote = null;
    }

    Object.assign(record, dto);
    return this.recordRepo.save(record);
  }

  /**
   * SUBMIT RECORD
   */
  async submitRecord(recordId: string, userId: string): Promise<FlockRecord> {
    const record = await this.recordRepo.findOne({ where: { id: recordId } });
    if (!record) throw new NotFoundException();
    if (record.submittedById !== userId) throw new ForbiddenException();
    if (record.status !== RecordStatus.DRAFT) {
      throw new BadRequestException('Only draft records can be submitted');
    }

    record.status = RecordStatus.SUBMITTED;
    record.submittedAt = new Date();
    return this.recordRepo.save(record);
  }

  /**
   * REVIEW RECORD — Manager review with decision support
   */
  async reviewRecord(
    recordId: string,
    userId: string,
    dto: ReviewFlockRecordDto,
  ): Promise<{
    record: FlockRecord;
    analysis: any;
  }> {
    const record = await this.recordRepo.findOne({
      where: { id: recordId },
      relations: ['flock', 'flock.house', 'flock.house.farm'],
    });
    if (!record) throw new NotFoundException();
    if (record.status !== RecordStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted records can be reviewed');
    }

    if (dto.status === 'flagged' && !dto.reviewNote) {
      throw new BadRequestException(
        'reviewNote is required when flagging a record',
      );
    }

    record.status =
      dto.status === 'reviewed' ? RecordStatus.REVIEWED : RecordStatus.FLAGGED;
    record.reviewedById = userId;
    record.reviewedAt = new Date();
    record.reviewNote = dto.reviewNote ?? null;

    const saved = await this.recordRepo.save(record);

    // Generate review analysis
    const analysis = await this.analyzeRecord(saved);

    return { record: saved, analysis };
  }

  /**
   * Analyze record for decision support
   */
  private async analyzeRecord(record: FlockRecord): Promise<any> {
    const flock = await this.flockRepo.findOne({
      where: { id: record.flockId },
    });

    if (!flock) {
      throw new NotFoundException();
    }

    const analysis: any = {
      recordDate: record.recordDate,
      flockStage: flock.currentStage,
      metrics: {
        liveCount: record.liveBirdsAfterRecord,
        mortalityCount: record.mortality + record.culls,
        feedConsumed: record.feedConsumedKg,
        feedCost: record.feedCost,
      },
    };

    if (flock.type === FlockType.LAYERS) {
      analysis.metrics.productionRate = record.productionRatePercent;
      analysis.metrics.eggRevenue = record.eggRevenue;
    } else {
      analysis.metrics.fcr = record.feedConversionRatio;
      analysis.metrics.avgWeight = record.avgBodyWeightKg;
    }

    analysis.healthRiskScore = record.healthRiskScore;

    // Performance vs benchmark
    if (flock.expectedMortalityPercent) {
      const recordMortalityPercent =
        flock.currentCount > 0
          ? (record.mortality / flock.currentCount) * 100
          : 0;
      analysis.mortalityVsBenchmark = {
        actual: recordMortalityPercent.toFixed(2),
        expected: flock.expectedMortalityPercent,
        status:
          recordMortalityPercent <= flock.expectedMortalityPercent
            ? 'GOOD'
            : 'CONCERNING',
      };
    }

    return analysis;
  }
  async deleteRecord(recordId: string): Promise<void> {
    const record = await this.recordRepo.findOne({
      where: { id: recordId },
      relations: ['flock', 'flock.house'],
    });

    if (!record) throw new NotFoundException('Record not found');

    await this.recordRepo.delete(recordId);
  }

  async getRecord(recordId: string, farmId: string): Promise<FlockRecord> {
    const record = await this.recordRepo.findOne({
      where: { id: recordId },
      relations: ['flock', 'flock.house', 'submittedBy', 'reviewedBy'],
    });

    if (!record) throw new NotFoundException('Record not found');
    if (record.flock.house.farmId !== farmId) {
      throw new ForbiddenException('Record does not belong to this farm');
    }

    return record;
  }

  async getRecords(
    flockId: string,
    page = 1,
    limit = 30,
  ): Promise<{ records: FlockRecord[]; total: number }> {
    const flock = await this.flockRepo.findOne({
      where: { id: flockId },
      relations: ['house'],
    });
    if (!flock) throw new NotFoundException();

    const [records, total] = await this.recordRepo.findAndCount({
      where: { flockId },
      relations: ['submittedBy', 'reviewedBy'],
      order: { recordDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { records, total };
  }

  /**
   * Get records awaiting review (status = SUBMITTED) for a flock
   * Ordered oldest first to present a review queue.
   */
  async getPendingReviewRecords(
    flockId: string,
    page = 1,
    limit = 30,
  ): Promise<{ records: FlockRecord[]; total: number }> {
    const flock = await this.flockRepo.findOne({
      where: { id: flockId },
      relations: ['house'],
    });
    if (!flock) throw new NotFoundException();

    const [records, total] = await this.recordRepo.findAndCount({
      where: { flockId, status: RecordStatus.SUBMITTED },
      relations: ['submittedBy', 'reviewedBy'],
      order: { recordDate: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { records, total };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // KPI & PERFORMANCE ENGINE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Calculate mortality rate for flock
   */
  async calculateMortalityRate(flockId: string): Promise<number> {
    const flock = await this.flockRepo.findOne({ where: { id: flockId } });
    if (!flock) throw new NotFoundException();

    const records = await this.recordRepo.find({ where: { flockId } });
    const totalMortality = records.reduce(
      (sum, r) => sum + r.mortality + r.culls,
      0,
    );

    return flock.initialCount > 0
      ? parseFloat(((totalMortality / flock.initialCount) * 100).toFixed(2))
      : 0;
  }

  /**
   * Calculate production rate (layers only)
   */
  async calculateProductionRate(flockId: string): Promise<number | null> {
    const flock = await this.flockRepo.findOne({ where: { id: flockId } });
    if (!flock || flock.type !== FlockType.LAYERS) return null;

    const records = await this.recordRepo.find({
      where: { flockId },
      order: { recordDate: 'DESC' },
      take: 7,
    });

    const ratesWithValue = records
      .filter((r) => r.productionRatePercent !== null)
      .map((r) => r.productionRatePercent as number);

    return ratesWithValue.length
      ? parseFloat(
          (
            ratesWithValue.reduce((a, b) => a + b, 0) / ratesWithValue.length
          ).toFixed(2),
        )
      : 0;
  }

  /**
   * Calculate feed conversion ratio (broilers only)
   */
  async calculateFCR(flockId: string): Promise<number | null> {
    const flock = await this.flockRepo.findOne({ where: { id: flockId } });
    if (!flock || flock.type !== FlockType.BROILERS) return null;

    const records = await this.recordRepo.find({
      where: { flockId },
      order: { recordDate: 'DESC' },
      take: 7,
    });

    const fcrWithValue = records
      .filter((r) => r.feedConversionRatio !== null)
      .map((r) => r.feedConversionRatio as number);

    return fcrWithValue.length
      ? parseFloat(
          (
            fcrWithValue.reduce((a, b) => a + b, 0) / fcrWithValue.length
          ).toFixed(3),
        )
      : 0;
  }

  /**
   * Calculate profitability
   */
  async calculateProfitability(flockId: string): Promise<{
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    roi: number;
  }> {
    const flock = await this.flockRepo.findOne({ where: { id: flockId } });
    if (!flock) throw new NotFoundException();

    return {
      totalRevenue: flock.revenueTotal,
      totalCost: flock.feedCostTotal,
      netProfit: flock.netProfit,
      roi: flock.roiPercent,
    };
  }

  /**
   * Benchmark flock performance
   */
  async benchmarkFlockPerformance(flockId: string): Promise<any> {
    const flock = await this.flockRepo.findOne({ where: { id: flockId } });
    if (!flock) throw new NotFoundException();

    const benchmarks = this.getBreedBenchmarks(flock.breed, flock.type);
    const mortalityRate = await this.calculateMortalityRate(flockId);
    const productionRate = await this.calculateProductionRate(flockId);
    const fcr = await this.calculateFCR(flockId);

    return {
      flock: { breed: flock.breed, type: flock.type },
      mortality: {
        actual: mortalityRate,
        expected: benchmarks.expectedMortalityPercent,
        status:
          mortalityRate <= benchmarks.expectedMortalityPercent
            ? 'GOOD'
            : 'POOR',
      },
      production: productionRate
        ? {
            actual: productionRate,
            status: productionRate > 75 ? 'GOOD' : 'POOR',
          }
        : null,
      fcr: fcr ? { actual: fcr, status: fcr < 2.0 ? 'GOOD' : 'POOR' } : null,
    };
  }

  /**
   * Forecast flock performance
   */
  async forecastFlockPerformance(flockId: string): Promise<any> {
    const flock = await this.flockRepo.findOne({
      where: { id: flockId },
      relations: ['records'],
    });
    if (!flock) throw new NotFoundException();

    const ageInDays = this.getFlockAgeInDays(flock.placementDate);
    const records = await this.recordRepo.find({
      where: { flockId },
      order: { recordDate: 'ASC' },
    });

    if (records.length === 0) {
      return { message: 'Insufficient data for forecast' };
    }

    // Simple linear forecast based on recent trend
    const recentRecords = records.slice(-7);
    const avgMortality =
      recentRecords.reduce((sum, r) => sum + r.mortality, 0) /
      recentRecords.length;
    const avgFeedCost =
      recentRecords.reduce((sum, r) => sum + r.feedCost, 0) /
      recentRecords.length;

    const projectedDaysToHarvest =
      flock.type === FlockType.BROILERS
        ? (flock.targetDays ?? 42 - ageInDays)
        : Math.max(0, (flock.productionStartWeek ?? 16) * 7 - ageInDays);

    const projectedFeedCost = avgFeedCost * projectedDaysToHarvest;
    const projectedMortality = Math.round(
      avgMortality * projectedDaysToHarvest,
    );

    return {
      ageInDays,
      projectedDaysToHarvest: Math.max(0, projectedDaysToHarvest),
      projectedFeedCost: parseFloat(projectedFeedCost.toFixed(2)),
      projectedMortality,
      projectedRemainingBirds: Math.max(
        0,
        flock.currentCount - projectedMortality,
      ),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STRATEGIC REPORTING ENGINE
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * GET FLOCK SUMMARY — Executive intelligence dashboard
   * Returns: Biological, Financial, Operational, Predictive metrics
   */
  async getFlockSummary(flockId: string): Promise<any> {
    const flock = await this.flockRepo.findOne({
      where: { id: flockId },
      relations: ['house', 'house.farm'],
    });
    if (!flock) throw new NotFoundException();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7Days = await this.recordRepo
      .createQueryBuilder('r')
      .where('r.flockId = :flockId', { flockId })
      .andWhere('r.recordDate >= :sevenDaysAgo', { sevenDaysAgo })
      .orderBy('r.recordDate', 'DESC')
      .getMany();

    const allRecords = await this.recordRepo.find({ where: { flockId } });

    // BIOLOGICAL
    const totalMortality = allRecords.reduce(
      (sum, r) => sum + r.mortality + r.culls,
      0,
    );
    const mortalityRate =
      flock.initialCount > 0
        ? parseFloat(((totalMortality / flock.initialCount) * 100).toFixed(2))
        : 0;

    // PRODUCTION (Layers)
    const ratesWithValue = last7Days
      .filter((r) => r.productionRatePercent !== null)
      .map((r) => r.productionRatePercent as number);
    const avgProductionRate = ratesWithValue.length
      ? parseFloat(
          (
            ratesWithValue.reduce((a, b) => a + b, 0) / ratesWithValue.length
          ).toFixed(2),
        )
      : null;

    // FINANCIAL
    const profitability = await this.calculateProfitability(flockId);

    // ALERTS (last 7 days)
    const pendingReview = await this.recordRepo.count({
      where: { flockId, status: RecordStatus.SUBMITTED },
    });

    // HEALTH RISK (last 7 days)
    const avgHealthRisk = last7Days.length
      ? parseFloat(
          (
            last7Days.reduce((sum, r) => sum + r.healthRiskScore, 0) /
            last7Days.length
          ).toFixed(2),
        )
      : 0;

    // FORECAST
    const forecast = await this.forecastFlockPerformance(flockId);

    return {
      // Header
      flock: {
        id: flock.id,
        breed: flock.breed,
        type: flock.type,
        stage: flock.currentStage,
        status: flock.status,
        ageInDays: this.getFlockAgeInDays(flock.placementDate),
        placementDate: flock.placementDate,
        initialCount: flock.initialCount,
        currentCount: flock.currentCount,
        survivedCount: flock.currentCount,
      },

      // BIOLOGICAL METRICS
      biology: {
        totalMortality,
        mortalityRate,
        healthRiskScore: avgHealthRisk,
        sickBirdsLast7Days: last7Days.reduce(
          (sum, r) => sum + (r.sickBirds ?? 0),
          0,
        ),
      },

      // PRODUCTION METRICS (Layers)
      production: avgProductionRate
        ? {
            avgProductionRate,
            totalEggsLast7Days: last7Days.reduce(
              (sum, r) => sum + (r.morningEggs ?? 0) + (r.eveningEggs ?? 0),
              0,
            ),
            status: avgProductionRate > 75 ? 'OPTIMAL' : 'DECLINING',
          }
        : null,

      // FINANCIAL METRICS
      finance: {
        totalRevenue: profitability.totalRevenue,
        totalCost: profitability.totalCost,
        netProfit: profitability.netProfit,
        roi: profitability.roi,
        feedCostPerBirdPerDay: (
          flock.feedCostTotal /
          allRecords.length /
          flock.currentCount
        ).toFixed(2),
      },

      // OPERATIONAL
      operations: {
        pendingRecordReviews: pendingReview,
        recordsSubmittedLast7Days: last7Days.filter(
          (r) => r.status === RecordStatus.REVIEWED,
        ).length,
        avgFeedPerDay: last7Days.length
          ? (
              last7Days.reduce((sum, r) => sum + r.feedConsumedKg, 0) /
              last7Days.length
            ).toFixed(2)
          : 0,
      },

      // PREDICTIVE
      forecast,

      // SUMMARY
      summary: {
        healthStatus:
          avgHealthRisk < 30
            ? 'HEALTHY'
            : avgHealthRisk < 60
              ? 'AT_RISK'
              : 'CRITICAL',
        profitabilityStatus:
          profitability.netProfit > 0 ? 'PROFITABLE' : 'UNPROFITABLE',
        actionRequired: pendingReview > 0 || avgHealthRisk > 60,
      },
    };
  }

  /**
   * Get flocks by farm
   */
  async getFlocksByFarm(farmId: string): Promise<Flock[]> {
    return this.flockRepo.find({
      where: { house: { farmId }, status: FlockStatus.ACTIVE },
      relations: ['house'],
    });
  }
}
