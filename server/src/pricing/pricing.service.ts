// pricing/pricing.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull, MoreThan } from 'typeorm';
import { PricingTier, PricingStatus } from './entities/pricing-tier.entity';
import {
  PricingHistory,
  VersionEvent,
} from './entities/pricing-history.entity';
import { RecordPricingSnapshot } from './entities/record-pricing-snapshot.entity';
import {
  CreatePricingTierDto,
  PricingHistoryQueryDto,
} from './dto/pricing.dto';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    @InjectRepository(PricingTier)
    private readonly pricingRepo: Repository<PricingTier>,

    @InjectRepository(PricingHistory)
    private readonly historyRepo: Repository<PricingHistory>,

    @InjectRepository(RecordPricingSnapshot)
    private readonly snapshotRepo: Repository<RecordPricingSnapshot>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE NEW VERSION (Every price change creates a new version)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new pricing tier version.
   *
   * Flow:
   * 1. Get current ACTIVE version (if exists)
   * 2. Archive it (set status=ARCHIVED, archivedDate=now)
   * 3. Create new version with version = old_version + 1
   * 4. Log both the ARCHIVED and CREATED events
   *
   * Note: Even a "small typo fix" creates a new version.
   * This is the KEY difference from the mutable design.
   */
  async createPricingVersion(
    farmId: string,
    dto: CreatePricingTierDto,
    userId: string,
  ): Promise<PricingTier> {
    // Validate input
    this.validatePricingValues(dto);

    // Get current ACTIVE version
    const currentActive = await this.pricingRepo.findOne({
      where: { farmId, status: PricingStatus.ACTIVE },
      order: { version: 'DESC' },
    });

    const newVersion = (currentActive?.version ?? 0) + 1;

    // Archive current version (if exists)
    if (currentActive) {
      currentActive.status = PricingStatus.ARCHIVED;
      currentActive.archivedDate = new Date();
      await this.pricingRepo.save(currentActive);

      // Log the archival
      await this.historyRepo.save(
        this.historyRepo.create({
          pricingTierId: currentActive.id,
          farmId,
          event: VersionEvent.ARCHIVED,
          prices: {
            feedCostPerKg: currentActive.feedCostPerKg,
            eggPricePerTray: currentActive.eggPricePerTray,
            broilerPricePerKg: currentActive.broilerPricePerKg,
            mortalityCostPerBird: currentActive.mortalityCostPerBird,
          },
          eventReason: `Superseded by v${newVersion}`,
          actedBy: userId,
          eventDate: new Date(),
        }),
      );
    }

    // Create new version (IMMUTABLE from this point on)
    const newTier = this.pricingRepo.create({
      farmId,
      version: newVersion,
      status: PricingStatus.ACTIVE,
      effectiveDate: dto.effectiveDate ?? new Date(),
      archivedDate: null,
      feedCostPerKg: dto.feedCostPerKg,
      eggPricePerTray: dto.eggPricePerTray,
      broilerPricePerKg: dto.broilerPricePerKg,
      mortalityCostPerBird: dto.mortalityCostPerBird,
      dayOldChickWeightKg: dto.dayOldChickWeightKg,
      waterCostPerLitre: dto.waterCostPerLitre ?? null,
      electricityCostPerUnit: dto.electricityCostPerUnit ?? null,
      createdBy: userId,
      creationReason: dto.reason,
      notes: dto.notes,
    });

    const saved = await this.pricingRepo.save(newTier);

    // Log creation
    await this.historyRepo.save(
      this.historyRepo.create({
        pricingTierId: saved.id,
        farmId,
        event: VersionEvent.CREATED,
        prices: {
          feedCostPerKg: saved.feedCostPerKg,
          eggPricePerTray: saved.eggPricePerTray,
          broilerPricePerKg: saved.broilerPricePerKg,
          mortalityCostPerBird: saved.mortalityCostPerBird,
        },
        eventReason: dto.reason,
        actedBy: userId,
        eventDate: new Date(),
      }),
    );

    return saved;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET ACTIVE PRICING FOR A FARM
  // ═══════════════════════════════════════════════════════════════════════════

  async getActivePricingForFarm(farmId: string): Promise<PricingTier> {
    const tier = await this.pricingRepo.findOne({
      where: { farmId, status: PricingStatus.ACTIVE },
      relations: ['createdByUser'],
    });

    if (!tier) {
      throw new NotFoundException(
        `No active pricing set for farm ${farmId}. Admin must create initial pricing.`,
      );
    }

    return tier;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET PRICING AT A SPECIFIC DATE (for historical reconciliation)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get the pricing version that was active on a specific date.
   * Used when:
   * - Recalculating old record financials
   * - Auditing what pricing was used on a given day
   * - Financial reconciliation
   */

  async getPricingAtDate(farmId: string, date: Date): Promise<PricingTier> {
    // Find pricing that was active at this date
    // Either it's still active (archivedDate IS NULL)
    // OR it was archived after this date
    const tier = await this.pricingRepo
      .createQueryBuilder('pricing')
      .where('pricing.farmId = :farmId', { farmId })
      .andWhere('pricing.effectiveDate <= :date', { date })
      .andWhere(
        'pricing.archivedDate IS NULL OR pricing.archivedDate > :date',
        { date },
      )
      .andWhere('pricing.status IN (:...statuses)', {
        statuses: [PricingStatus.ACTIVE, PricingStatus.ARCHIVED],
      })
      .orderBy('pricing.version', 'DESC')
      .getOne();

    if (!tier) {
      throw new NotFoundException(
        `No pricing found for farm ${farmId} on ${date.toISOString()}`,
      );
    }

    return tier;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET VERSION HISTORY (Audit Trail)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get complete audit trail of all pricing versions.
   * Shows when versions were created, activated, archived.
   */
  async getPricingHistory(
    farmId: string,
    query: PricingHistoryQueryDto,
  ): Promise<{
    data: PricingHistory[];
    total: number;
    page: number;
    limit: number;
  }> {
    const take = query.limit ?? 50;
    const skip = ((query.page ?? 1) - 1) * take;

    const where: any = { farmId };

    if (query.pricingTierId) where.pricingTierId = query.pricingTierId;
    if (query.event) where.event = query.event;
    if (query.actedBy) where.actedBy = query.actedBy;

    if (query.startDate || query.endDate) {
      where.eventDate = {};
      if (query.startDate) where.eventDate.$gte = query.startDate;
      if (query.endDate) where.eventDate.$lte = query.endDate;
    }

    const [data, total] = await this.historyRepo.findAndCount({
      where,
      relations: ['actedByUser'],
      order: { eventDate: 'DESC' },
      take,
      skip,
    });

    return {
      data,
      total,
      page: query.page ?? 1,
      limit: take,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET ALL VERSIONS FOR A FARM (Version book)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all versions ever created for a farm.
   * Shows: v1 (archived), v2 (archived), v3 (active), etc.
   */
  async getAllVersionsForFarm(farmId: string): Promise<PricingTier[]> {
    return this.pricingRepo.find({
      where: { farmId },
      order: { version: 'DESC' },
      relations: ['createdByUser'],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPTURE SNAPSHOT (Called when record is created/submitted)
  // ═══════════════════════════════════════════════════════════════════════════

  async captureRecordPricingSnapshot(
    recordId: string,
    farmId: string,
    feedConsumedKg: number,
    mortality: number,
    saleableTrays: number,
  ): Promise<RecordPricingSnapshot> {
    const tier = await this.getActivePricingForFarm(farmId);

    const snapshot = this.snapshotRepo.create({
      recordId,
      pricingTierId: tier.id,
      feedCostPerKg: tier.feedCostPerKg,
      eggPricePerTray: tier.eggPricePerTray,
      broilerPricePerKg: tier.broilerPricePerKg,
      mortalityCostPerBird: tier.mortalityCostPerBird,

      calculatedFeedCost: feedConsumedKg * tier.feedCostPerKg,
      calculatedEggRevenue: saleableTrays * tier.eggPricePerTray,
      calculatedMortalityCost: mortality * tier.mortalityCostPerBird,

      capturedAt: new Date(),
    });

    return this.snapshotRepo.save(snapshot);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUSPEND / RESTORE (Rare admin operations)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Suspend a version temporarily (without creating new version).
   * Rare use case: emergency price freeze, system issue, etc.
   */
  // pricing/pricing.service.ts - Updated suspendPricing

  async suspendPricing(
    tierId: string,
    reason: string,
    userId: string,
  ): Promise<{ suspended: PricingTier; fallback: PricingTier | null }> {
    const tier = await this.pricingRepo.findOne({
      where: { id: tierId },
      relations: ['farm'],
    });

    if (!tier) {
      throw new NotFoundException(`Pricing tier ${tierId} not found`);
    }

    if (tier.status !== PricingStatus.ACTIVE) {
      throw new ConflictException(
        `Can only suspend ACTIVE pricing. Current status: ${tier.status}`,
      );
    }

    // Find the previous version (highest archived version)
    const previousVersion = await this.pricingRepo.findOne({
      where: {
        farmId: tier.farmId,
        status: PricingStatus.ARCHIVED,
      },
      order: { version: 'DESC' },
    });

    // Suspend current version
    tier.status = PricingStatus.SUSPENDED;
    await this.pricingRepo.save(tier);

    // Log suspension
    await this.historyRepo.save(
      this.historyRepo.create({
        pricingTierId: tier.id,
        farmId: tier.farmId,
        event: VersionEvent.SUSPENDED,
        prices: {
          feedCostPerKg: tier.feedCostPerKg,
          eggPricePerTray: tier.eggPricePerTray,
          broilerPricePerKg: tier.broilerPricePerKg,
          mortalityCostPerBird: tier.mortalityCostPerBird,
        },
        eventReason: reason,
        actedBy: userId,
        eventDate: new Date(),
      }),
    );

    let fallback;

    // Restore previous version if it exists
    if (previousVersion) {
      previousVersion.status = PricingStatus.ACTIVE;
      previousVersion.archivedDate = null;
      await this.pricingRepo.save(previousVersion);

      await this.historyRepo.save(
        this.historyRepo.create({
          pricingTierId: previousVersion.id,
          farmId: previousVersion.farmId,
          event: VersionEvent.RESTORED,
          prices: {
            feedCostPerKg: previousVersion.feedCostPerKg,
            eggPricePerTray: previousVersion.eggPricePerTray,
            broilerPricePerKg: previousVersion.broilerPricePerKg,
            mortalityCostPerBird: previousVersion.mortalityCostPerBird,
          },
          eventReason: `Auto-restored as fallback after suspension of v${tier.version}: ${reason}`,
          actedBy: userId,
          eventDate: new Date(),
        }),
      );

      fallback = previousVersion;

      this.logger.log(
        `Farm ${tier.farmId}: Suspended v${tier.version}, restored v${previousVersion.version} as fallback`,
      );
    } else {
      this.logger.warn(
        `Farm ${tier.farmId}: Suspended v${tier.version} but no fallback version exists!`,
      );
      // Option: Create a default emergency version
      // Or: Throw an error if you want to prevent suspension without fallback
    }

    return {
      suspended: tier,
      fallback,
    };
  }

  /**
   * Restore a suspended version.
   */
  // pricing/pricing.service.ts

  async restorePricing(
    tierId: string,
    reason: string,
    userId: string,
  ): Promise<void> {
    const tier = await this.pricingRepo.findOne({
      where: { id: tierId },
      relations: ['farm'],
    });

    if (!tier) throw new NotFoundException('Pricing tier not found');

    if (tier.status !== PricingStatus.SUSPENDED) {
      throw new ConflictException('Can only restore SUSPENDED pricing');
    }

    // ✅ NEW: Get current ACTIVE version for this farm
    const currentActive = await this.pricingRepo.findOne({
      where: {
        farmId: tier.farmId,
        status: PricingStatus.ACTIVE,
      },
    });

    // ✅ NEW: Archive the current active version (if it exists and is different)
    if (currentActive && currentActive.id !== tier.id) {
      currentActive.status = PricingStatus.ARCHIVED;
      currentActive.archivedDate = new Date();
      await this.pricingRepo.save(currentActive);

      // Log archival
      await this.historyRepo.save(
        this.historyRepo.create({
          pricingTierId: currentActive.id,
          farmId: tier.farmId,
          event: VersionEvent.ARCHIVED,
          prices: {
            feedCostPerKg: currentActive.feedCostPerKg,
            eggPricePerTray: currentActive.eggPricePerTray,
            broilerPricePerKg: currentActive.broilerPricePerKg,
            mortalityCostPerBird: currentActive.mortalityCostPerBird,
          },
          eventReason: `Superseded by restored v${tier.version}: ${reason}`,
          actedBy: userId,
          eventDate: new Date(),
        }),
      );
    }

    // Restore the suspended version
    tier.status = PricingStatus.ACTIVE;
    tier.archivedDate = null; // Ensure it's not archived
    await this.pricingRepo.save(tier);

    // Log restoration
    await this.historyRepo.save(
      this.historyRepo.create({
        pricingTierId: tier.id,
        farmId: tier.farmId,
        event: VersionEvent.RESTORED,
        prices: {
          feedCostPerKg: tier.feedCostPerKg,
          eggPricePerTray: tier.eggPricePerTray,
          broilerPricePerKg: tier.broilerPricePerKg,
          mortalityCostPerBird: tier.mortalityCostPerBird,
        },
        eventReason: reason,
        actedBy: userId,
        eventDate: new Date(),
      }),
    );

    this.logger.log(
      `Farm ${tier.farmId}: Restored v${tier.version} (archived v${currentActive?.version ?? 'none'})`,
    );
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  private validatePricingValues(dto: CreatePricingTierDto) {
    const errors: string[] = [];

    if (dto.feedCostPerKg <= 0 || dto.feedCostPerKg > 10000) {
      errors.push('feedCostPerKg must be between 0 and 10,000 KES');
    }

    if (dto.eggPricePerTray <= 0 || dto.eggPricePerTray > 10000) {
      errors.push(
        'eggPricePerTray must be between 0 and 10,000 KES (per tray of 30 eggs)',
      );
    }

    if (dto.broilerPricePerKg <= 0 || dto.broilerPricePerKg > 10000) {
      errors.push('broilerPricePerKg must be between 0 and 10,000 KES');
    }

    if (dto.mortalityCostPerBird <= 0 || dto.mortalityCostPerBird > 10000) {
      errors.push('mortalityCostPerBird must be between 0 and 10,000 KES');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }
  }

  async createScheduledVersion(
    farmId: string,
    dto: CreatePricingTierDto,
    userId: string,
    effectiveDate: Date,
  ): Promise<PricingTier> {
    // Validate effective date is in the future
    const now = new Date();
    if (effectiveDate <= now) {
      throw new BadRequestException('Effective date must be in the future');
    }

    // Validate values
    this.validatePricingValues(dto);

    // Get latest version number
    const latestVersion = await this.pricingRepo.findOne({
      where: { farmId },
      order: { version: 'DESC' },
    });

    const newVersion = (latestVersion?.version ?? 0) + 1;

    // Create scheduled version (doesn't affect current active version)
    const newTier = this.pricingRepo.create({
      farmId,
      version: newVersion,
      status: PricingStatus.SCHEDULED,
      effectiveDate,
      archivedDate: null,
      feedCostPerKg: dto.feedCostPerKg,
      eggPricePerTray: dto.eggPricePerTray,
      broilerPricePerKg: dto.broilerPricePerKg,
      mortalityCostPerBird: dto.mortalityCostPerBird,
      dayOldChickWeightKg: dto.dayOldChickWeightKg,
      waterCostPerLitre: dto.waterCostPerLitre ?? null,
      electricityCostPerUnit: dto.electricityCostPerUnit ?? null,
      createdBy: userId,
      creationReason: `Scheduled for ${effectiveDate.toISOString()}: ${dto.reason}`,
      notes: dto.notes,
    });

    const saved = await this.pricingRepo.save(newTier);

    // Log creation with scheduled note
    await this.historyRepo.save(
      this.historyRepo.create({
        pricingTierId: saved.id,
        farmId,
        event: VersionEvent.CREATED,
        prices: {
          feedCostPerKg: saved.feedCostPerKg,
          eggPricePerTray: saved.eggPricePerTray,
          broilerPricePerKg: saved.broilerPricePerKg,
          mortalityCostPerBird: saved.mortalityCostPerBird,
        },
        eventReason: `Scheduled for activation on ${effectiveDate.toISOString()}: ${dto.reason}`,
        actedBy: userId,
        eventDate: new Date(),
      }),
    );

    return saved;
  }

  async getPricingTierById(tierId: string): Promise<PricingTier> {
    const tier = await this.pricingRepo.findOne({ where: { id: tierId } });
    if (!tier) {
      throw new NotFoundException(`Pricing tier ${tierId} not found`);
    }
    return tier;
  }
  // ═══════════════════════════════════════════════════════════════════════════
  // MANUAL ACTIVATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Manually activate a specific pricing version.
   *
   * Use cases:
   * - Admin wants to activate a scheduled version early
   * - Testing/debugging
   * - Emergency override
   *
   * @param tierId - ID of the pricing tier to activate
   * @param userId - ID of the user performing the action
   * @param reason - Optional reason for manual activation
   */
  async activateVersionManually(
    tierId: string,
    userId: string,
    reason?: string,
  ): Promise<PricingTier> {
    const tier = await this.pricingRepo.findOne({
      where: { id: tierId },
      relations: ['farm'],
    });

    if (!tier) {
      throw new NotFoundException(`Pricing tier with ID ${tierId} not found`);
    }

    // Validate that the version can be activated
    if (tier.status === PricingStatus.ACTIVE) {
      throw new ConflictException(
        `Version ${tier.version} is already ACTIVE. No action needed.`,
      );
    }

    if (tier.status === PricingStatus.ARCHIVED) {
      throw new ConflictException(
        `Cannot activate an ARCHIVED version. Archive is permanent.`,
      );
    }

    if (tier.status === PricingStatus.SUSPENDED) {
      throw new ConflictException(
        `Cannot activate a SUSPENDED version directly. Use restorePricing() instead.`,
      );
    }

    // Only SCHEDULED versions can be manually activated
    if (tier.status !== PricingStatus.SCHEDULED) {
      throw new ConflictException(
        `Only SCHEDULED versions can be manually activated. Current status: ${tier.status}`,
      );
    }

    // Activate the version (this handles archiving current active)
    return this.activateVersion(
      tier,
      userId,
      reason ?? 'Manually activated by user',
    );
  }

  /**
   * Internal method to activate a version (used by both manual and automatic activation)
   *
   * @param tier - The pricing tier to activate (must be SCHEDULED)
   * @param userId - User performing the activation
   * @param reason - Reason for activation
   */
  private async activateVersion(
    tier: PricingTier,
    userId: string,
    reason: string,
  ): Promise<PricingTier> {
    const farmId = tier.farmId;

    // 1. Get current ACTIVE version for this farm
    const currentActive = await this.pricingRepo.findOne({
      where: {
        farmId,
        status: PricingStatus.ACTIVE,
      },
    });

    // 2. Archive current active version (if exists)
    if (currentActive) {
      // Only archive if the new version is different
      if (currentActive.id !== tier.id) {
        currentActive.status = PricingStatus.ARCHIVED;
        currentActive.archivedDate = new Date();
        await this.pricingRepo.save(currentActive);

        // Log archival
        await this.historyRepo.save(
          this.historyRepo.create({
            pricingTierId: currentActive.id,
            farmId,
            event: VersionEvent.ARCHIVED,
            prices: {
              feedCostPerKg: currentActive.feedCostPerKg,
              eggPricePerTray: currentActive.eggPricePerTray,
              broilerPricePerKg: currentActive.broilerPricePerKg,
              mortalityCostPerBird: currentActive.mortalityCostPerBird,
            },
            eventReason: `Superseded by version ${tier.version}: ${reason}`,
            actedBy: userId,
            eventDate: new Date(),
          }),
        );
      }
    }

    // 3. Activate the new version
    tier.status = PricingStatus.ACTIVE;
    tier.archivedDate = null; // Ensure it's not archived
    const saved = await this.pricingRepo.save(tier);

    // 4. Log activation
    await this.historyRepo.save(
      this.historyRepo.create({
        pricingTierId: tier.id,
        farmId,
        event: VersionEvent.ACTIVATED,
        prices: {
          feedCostPerKg: tier.feedCostPerKg,
          eggPricePerTray: tier.eggPricePerTray,
          broilerPricePerKg: tier.broilerPricePerKg,
          mortalityCostPerBird: tier.mortalityCostPerBird,
        },
        eventReason: reason,
        actedBy: userId,
        eventDate: new Date(),
      }),
    );

    return saved;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-ACTIVATE SCHEDULED VERSIONS (Called by job processor)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Find and activate all scheduled versions whose effective date has passed.
   * Called by the pricing activation cron job.
   *
   * @param farmId - Optional farm ID to process (if omitted, processes all farms)
   */
  async activateDueScheduledVersions(farmId?: string): Promise<{
    activated: number;
    skipped: number;
    errors: number;
    details: Array<{
      tierId: string;
      version: number;
      farmId: string;
      status: 'activated' | 'skipped' | 'error';
      error?: string;
    }>;
  }> {
    const now = new Date();
    const details: Array<{
      tierId: string;
      version: number;
      farmId: string;
      status: 'activated' | 'skipped' | 'error';
      error?: string;
    }> = [];

    // Build query for scheduled versions due for activation
    const where: any = {
      status: PricingStatus.SCHEDULED,
      effectiveDate: LessThanOrEqual(now),
    };
    if (farmId) where.farmId = farmId;

    const scheduledTiers = await this.pricingRepo.find({
      where,
      order: {
        farmId: 'ASC',
        effectiveDate: 'ASC', // Activate earliest first
        version: 'ASC',
      },
    });

    this.logger?.log(
      `Found ${scheduledTiers.length} scheduled version(s) due for activation`,
    );

    // Group by farm to handle activation properly
    const farmGroups = new Map<string, PricingTier[]>();
    for (const tier of scheduledTiers) {
      if (!farmGroups.has(tier.farmId)) {
        farmGroups.set(tier.farmId, []);
      }
      farmGroups.get(tier.farmId)!.push(tier);
    }

    for (const [farmId, tiers] of farmGroups) {
      try {
        // Sort by effective date and version
        tiers.sort((a, b) => {
          if (a.effectiveDate.getTime() !== b.effectiveDate.getTime()) {
            return a.effectiveDate.getTime() - b.effectiveDate.getTime();
          }
          return a.version - b.version;
        });

        // Get current ACTIVE version for this farm
        const currentActive = await this.pricingRepo.findOne({
          where: { farmId, status: PricingStatus.ACTIVE },
        });

        let activatedCount = 0;

        for (const tier of tiers) {
          try {
            // Check if this version is still scheduled (could have been activated by another job)
            if (tier.status !== PricingStatus.SCHEDULED) {
              details.push({
                tierId: tier.id,
                version: tier.version,
                farmId,
                status: 'skipped',
                error: `Version already ${tier.status}`,
              });
              continue;
            }

            // Check if the effective date is in the future (shouldn't happen, but safety check)
            if (tier.effectiveDate > new Date()) {
              details.push({
                tierId: tier.id,
                version: tier.version,
                farmId,
                status: 'skipped',
                error: 'Effective date not yet reached',
              });
              continue;
            }

            // If there are multiple scheduled versions for the same farm,
            // only activate the earliest one. The rest will be activated
            // in subsequent runs.
            if (activatedCount === 0) {
              // Activate this version using the internal method
              await this.activateVersion(
                tier,
                tier.createdBy, // Use the creator as the actor
                `Scheduled activation: Effective from ${tier.effectiveDate.toISOString()}`,
              );

              details.push({
                tierId: tier.id,
                version: tier.version,
                farmId,
                status: 'activated',
              });

              activatedCount++;
            } else {
              // This version will be activated in the next run after the first one is active
              details.push({
                tierId: tier.id,
                version: tier.version,
                farmId,
                status: 'skipped',
                error: 'Will be activated after previous scheduled version',
              });
            }
          } catch (err: any) {
            details.push({
              tierId: tier.id,
              version: tier.version,
              farmId,
              status: 'error',
              error: err?.message || 'Unknown error',
            });
          }
        }
      } catch (err: any) {
        // Farm-level error
        this.logger?.error(`Failed to process farm ${farmId}: ${err?.message}`);
      }
    }

    const activated = details.filter((d) => d.status === 'activated').length;
    const skipped = details.filter((d) => d.status === 'skipped').length;
    const errors = details.filter((d) => d.status === 'error').length;

    this.logger?.log(
      `Scheduled activation complete: ${activated} activated, ${skipped} skipped, ${errors} errors`,
    );

    return {
      activated,
      skipped,
      errors,
      details,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get upcoming scheduled versions for a farm
   */
  async getUpcomingScheduledVersions(farmId: string): Promise<PricingTier[]> {
    const now = new Date();

    return this.pricingRepo.find({
      where: {
        farmId,
        status: PricingStatus.SCHEDULED,
        effectiveDate: MoreThan(now),
      },
      order: { effectiveDate: 'ASC' },
    });
  }

  /**
   * Check if a farm has any scheduled versions pending
   */
  async hasPendingScheduledVersions(farmId: string): Promise<boolean> {
    const count = await this.pricingRepo.count({
      where: {
        farmId,
        status: PricingStatus.SCHEDULED,
      },
    });
    return count > 0;
  }

  /**
   * Cancel a scheduled version (soft delete)
   */
  async cancelScheduledVersion(
    tierId: string,
    userId: string,
    reason: string,
  ): Promise<void> {
    const tier = await this.pricingRepo.findOne({
      where: { id: tierId },
    });

    if (!tier) {
      throw new NotFoundException(`Pricing tier with ID ${tierId} not found`);
    }

    if (tier.status !== PricingStatus.SCHEDULED) {
      throw new ConflictException(
        `Only SCHEDULED versions can be cancelled. Current status: ${tier.status}`,
      );
    }

    // Instead of deleting, mark as archived with a special reason
    tier.status = PricingStatus.ARCHIVED;
    tier.archivedDate = new Date();
    await this.pricingRepo.save(tier);

    // Log cancellation
    await this.historyRepo.save(
      this.historyRepo.create({
        pricingTierId: tier.id,
        farmId: tier.farmId,
        event: VersionEvent.ARCHIVED,
        prices: {
          feedCostPerKg: tier.feedCostPerKg,
          eggPricePerTray: tier.eggPricePerTray,
          broilerPricePerKg: tier.broilerPricePerKg,
          mortalityCostPerBird: tier.mortalityCostPerBird,
        },
        eventReason: `Cancelled scheduled version: ${reason}`,
        actedBy: userId,
        eventDate: new Date(),
      }),
    );
  }
}
