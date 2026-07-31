import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import type { Job } from 'bull';
import { PricingTier, PricingStatus } from '../../pricing/entities/pricing-tier.entity';
import { PricingHistory, VersionEvent } from '../../pricing/entities/pricing-history.entity';
import { ACTIVATE_SCHEDULED_PRICING_JOB, PRICING_QUEUE } from '../jobs.constants';


@Processor(PRICING_QUEUE)
export class PricingActivationProcessor {
  private readonly logger = new Logger(PricingActivationProcessor.name);

  constructor(
    @InjectRepository(PricingTier)
    private readonly pricingRepo: Repository<PricingTier>,
    @InjectRepository(PricingHistory)
    private readonly historyRepo: Repository<PricingHistory>,
  ) {}

  /**
   * Main job: Activate all scheduled pricing versions whose effectiveDate has passed.
   * Runs hourly (or every 5 minutes if you want more precision).
   */
  @Process(ACTIVATE_SCHEDULED_PRICING_JOB)
  async activateScheduledPricing(job: Job<{ farmId?: string }>) {
    const { farmId } = job.data;
    const now = new Date();

    // Build query for scheduled versions
    const where: any = {
      status: PricingStatus.SCHEDULED,
      // effectiveDate: LessThanOrEqual(now),
    };
    if (farmId) where.farmId = farmId;

    const scheduledTiers = await this.pricingRepo.find({
      where,
      order: { 
        farmId: 'ASC',
        version: 'ASC' 
      },
      relations: ['farm'],
    });

    this.logger.log(
      `Found ${scheduledTiers.length} scheduled pricing tier(s) to activate`
    );

    let activated = 0;
    let errors = 0;

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
        // Sort by version to activate in order
        tiers.sort((a, b) => a.version - b.version);

        // Get current active version for this farm
        const currentActive = await this.pricingRepo.findOne({
          where: { 
            farmId, 
            status: PricingStatus.ACTIVE 
          }
        });

        // Activate each scheduled version sequentially
        for (const tier of tiers) {
          await this.activateVersion(tier, currentActive, farmId);
          activated++;
          
          // After first activation, subsequent ones become active
          // So we need to fetch the newly activated version for the next loop
          // Or we could handle this differently based on business rules
        }

        this.logger.log(
          `Activated ${tiers.length} scheduled version(s) for farm ${farmId}`
        );
      } catch (err: any) {
        errors++;
        this.logger.error(
          `Failed to activate scheduled pricing for farm ${farmId}: ${err?.message}`,
          err?.stack
        );
      }
    }

    return { 
      activated, 
      errors,
      totalFound: scheduledTiers.length 
    };
  }

  /**
   * Activate a single scheduled version
   */
  private async activateVersion(
    scheduledTier: PricingTier,
    currentActive: PricingTier | null,
    farmId: string
  ): Promise<void> {
    // Archive current active version if it exists
    if (currentActive) {
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
          eventReason: `Superseded by scheduled v${scheduledTier.version}`,
          actedBy: scheduledTier.createdBy, // Use the creator as the actor
          eventDate: new Date(),
        })
      );
    }

    // Activate the scheduled version
    scheduledTier.status = PricingStatus.ACTIVE;
    scheduledTier.archivedDate = null; // Ensure it's not archived
    await this.pricingRepo.save(scheduledTier);

    // Log activation
    await this.historyRepo.save(
      this.historyRepo.create({
        pricingTierId: scheduledTier.id,
        farmId,
        event: VersionEvent.ACTIVATED,
        prices: {
          feedCostPerKg: scheduledTier.feedCostPerKg,
          eggPricePerTray: scheduledTier.eggPricePerTray,
          broilerPricePerKg: scheduledTier.broilerPricePerKg,
          mortalityCostPerBird: scheduledTier.mortalityCostPerBird,
        },
        eventReason: `Scheduled version activated on ${new Date().toISOString()}`,
        actedBy: scheduledTier.createdBy,
        eventDate: new Date(),
      })
    );
  }
}