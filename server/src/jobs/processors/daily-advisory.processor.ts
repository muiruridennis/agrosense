import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Job } from 'bull';
import { Farm } from '../../farms/entities/farm.entity';
import { RecommendationsService } from '../../recommendations/recommendations.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { DairyService } from '../../dairy/dairy.service';
import { SmallRuminantsService } from '../../smallruminants/smallruminants.service';
import { PoultryService } from '../../poultry/poultry.service';
import { Flock } from '../../poultry/entities/flock.entity';
import { NotificationChannel } from '../../notifications/entities/notification.entity';
import { DiseaseSeverity } from '../../disease-engine/entities/disease-rule.entity';
import { DiseaseEngineService } from '../../disease-engine/disease-engine.service';
import { CropCyclesService } from '../../crops/crops.service';

export const ADVISORY_QUEUE = 'advisory';
export const DAILY_ADVISORY_JOB = 'daily-advisory';
// export const MARK_OVERDUE_VACCINATIONS_JOB = 'mark-overdue-vaccinations'; // Removed as LivestockService is gone
export const WEATHER_ADVISORIES_JOB = 'weather-advisories';

@Processor(ADVISORY_QUEUE)
export class DailyAdvisoryProcessor {
  private readonly logger = new Logger(DailyAdvisoryProcessor.name);

  constructor(
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    private readonly diseaseEngineService: DiseaseEngineService,
    private readonly recommendationsService: RecommendationsService,
    private readonly notificationsService: NotificationsService,
    private readonly cropCyclesService: CropCyclesService,
    private readonly dairyService: DairyService,
    private readonly smallRuminantsService: SmallRuminantsService,
    private readonly poultryService: PoultryService,
  ) {}

  /**
   * Main daily job — runs for every active farm.
   * Evaluates disease rules, creates alerts, generates recommendations,
   * and sends SMS to farmers with active alerts.
   */
  @Process(DAILY_ADVISORY_JOB)
  async runDailyAdvisory(job: Job<{ farmId?: string }>) {
    const { farmId } = job.data;

    const farms = farmId
      ? await this.farmRepo
          .findOne({
            where: { id: farmId },
            relations: ['owner'],
          })
          .then((f) => (f ? [f] : []))
      : await this.farmRepo.find({ relations: ['owner'] });

    this.logger.log(`Running daily advisory for ${farms.length} farm(s)`);

    let processed = 0;
    let alertsCreated = 0;

    for (const farm of farms) {
      try {
        await job.progress(Math.round((processed / farms.length) * 100));

        const [cropCycles, dairyAnimals, ruminantAnimals, poultryAnimals] =
          await Promise.all([
            this.cropCyclesService.findActiveCycles(farm.id),
            this.dairyService.getCows(farm.id),
            this.smallRuminantsService.getRuminants(farm.id),
            this.getAllFlocksForFarm(farm.id, farm.ownerId),
          ]);

        // Combine all animals into a single array
        const animals = [
          ...dairyAnimals,
          ...ruminantAnimals,
          ...poultryAnimals,
        ];

        // Run disease engine
        const newAlerts = await this.diseaseEngineService.evaluateFarm(
          farm,
          farm.ownerId, //we will later need to use the real user
          // cropCycles,
          // animals,
        );

        alertsCreated += newAlerts.length;

        // Generate recommendations from each new alert
        for (const alert of newAlerts) {
          const rec =
            await this.recommendationsService.createFromDiseaseAlert(alert);

          // Send SMS for high/critical severity alerts
          if (
            alert.severity === DiseaseSeverity.HIGH ||
            alert.severity === DiseaseSeverity.CRITICAL
          ) {
            await this.notificationsService.send({
              user: farm.owner,
              title: `Alert: ${alert.diseaseName}`,
              body:
                rec.actions?.slice(0, 2).join('. ') ??
                rec.message.slice(0, 120),
              channels: [NotificationChannel.SMS, NotificationChannel.IN_APP],
              data: {
                farmId: farm.id,
                alertId: alert.id,
                type: 'disease_alert',
              },
            });
          } else {
            // Lower severity — in-app only
            await this.notificationsService.send({
              user: farm.owner,
              title: `Advisory: ${alert.diseaseName}`,
              body: rec.message.slice(0, 160),
              channels: [NotificationChannel.IN_APP],
              data: { farmId: farm.id, alertId: alert.id },
            });
          }
        }

        processed++;
      } catch (err: any) {
        this.logger.error(
          `Failed advisory for farm ${farm.id}: ${err?.message}`,
        );
      }
    }

    this.logger.log(
      `Daily advisory complete — ${processed} farms, ${alertsCreated} alerts created`,
    );

    return { processed, alertsCreated };
  }

  /**
   * Generate weather advisories for all farms — runs daily at 7am.
   */
  @Process(WEATHER_ADVISORIES_JOB)
  async generateWeatherAdvisories(_job: Job) {
    const farms = await this.farmRepo.find({
      select: ['id', 'geoPoint', 'timezone'],
    });

    await this.recommendationsService.generateWeatherAdvisories(
      farms.map((f) => ({
        id: f.id,
        geoPoint: f.geoPoint,
        timezone: f.timezone,
      })),
    );

    this.logger.log(`Weather advisories generated for ${farms.length} farms`);
    return { count: farms.length };
  }

  /**
   * Helper method to get all flocks for a farm by fetching houses and their flocks.
   */
  private async getAllFlocksForFarm(
    farmId: string,
    userId: string,
  ): Promise<Flock[]> {
    // Assuming PoultryService has a method to get all houses for a farm
    // If not, we need to add it or fetch differently
    // For now, placeholder: return empty array or implement properly
    // TODO: Implement based on PoultryService methods
    return []; // Placeholder
  }
}
