import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DiseaseRule,
  RuleHostType,
  RuleCondition,
  WeatherConditionThreshold,
} from './entities/disease-rule.entity';
import { DiseaseAlert } from './entities/disease-alert.entity';
import {
  WeatherService,
  WeatherCondition,
  WeatherForecast,
} from '../weather/weather.service';
import { Farm } from '../farms/entities/farm.entity';
import { DairyService } from '../dairy/dairy.service';
import { SmallRuminantsService } from '../smallruminants/smallruminants.service';
import { PoultryService } from '../poultry/poultry.service';
import { HealthEventService } from '../health-event/services/health-event.service';
import { CropCyclesService } from '../crops/crops.service';

/**
 * DiseaseEngineService
 *
 * Evaluates disease rules against farm conditions using:
 * - Weather forecasts (from WeatherService)
 * - Animal data (from Dairy, SmallRuminants, Poultry services)
 * - Crop data (from CropCyclesService)
 * - Health events (from HealthEventService)
 *
 * Architecture:
 * - Uses module-specific services (no direct repo queries)
 * - Works with DairyService, SmallRuminantsService, PoultryService, CropCyclesService
 * - Creates DiseaseAlert when conditions are met
 * - Respects cooldown periods to avoid alert fatigue
 * - Filters rules by region and season
 */
@Injectable()
export class DiseaseEngineService {
  private readonly logger = new Logger(DiseaseEngineService.name);

  constructor(
    @InjectRepository(DiseaseRule)
    private readonly rulesRepo: Repository<DiseaseRule>,

    @InjectRepository(DiseaseAlert)
    private readonly alertsRepo: Repository<DiseaseAlert>,

    private readonly weatherService: WeatherService,
    private readonly dairyService: DairyService,
    private readonly smallRuminantsService: SmallRuminantsService,
    private readonly poultryService: PoultryService,
    private readonly healthEventService: HealthEventService,
    private readonly cropsService: CropCyclesService,
  ) {}

  /**
   * Main evaluation entry point
   * Called by scheduler/job to evaluate a farm against all active rules
   *
   * @param farm - Farm to evaluate
   * @param userId - System user or scheduler user for permission checks
   * @returns Array of newly created disease alerts
   */
  async evaluateFarm(farm: Farm, userId: string): Promise<DiseaseAlert[]> {
    const forecast = await this.weatherService.getForecast(farm);
    if (!forecast) {
      this.logger.warn(`No weather forecast available for farm ${farm.id}`);
      return [];
    }

    const rules = await this.rulesRepo.find({ where: { isActive: true } });
    if (rules.length === 0) {
      this.logger.debug('No active disease rules to evaluate');
      return [];
    }

    // Filter rules by region and season
    const currentSeason = this.getCurrentSeason();
    const applicableRules = rules.filter((rule) => {
      // Check region filter
      if (rule.applicableRegions && rule.applicableRegions.length > 0) {
        if (!rule.applicableRegions.includes(farm.region)) {
          return false;
        }
      }

      // Check season filter
      if (rule.conditions.season && rule.conditions.season.length > 0) {
        if (!rule.conditions.season.includes(currentSeason)) {
          return false;
        }
      }

      return true;
    });

    if (applicableRules.length === 0) {
      this.logger.debug(
        `No applicable disease rules for farm ${farm.id} (region: ${farm.region}, season: ${currentSeason})`,
      );
      return [];
    }

    const newAlerts: DiseaseAlert[] = [];

    // Get recent health events for symptom matching (last 7 days only)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentHealthEvents =
      await this.healthEventService.getFarmActiveHealthEvents(farm.id);

    // Filter to only events from the last 7 days
    const recentEvents = recentHealthEvents.filter(
      (event) => event.occurredDate >= sevenDaysAgo,
    );

    const symptomsByAnimal = new Map<string, string[]>();
    for (const event of recentEvents) {
      if (event.symptoms?.length) {
        const existing = symptomsByAnimal.get(event.animalId) || [];
        symptomsByAnimal.set(event.animalId, [...existing, ...event.symptoms]);
      }
    }

    // ─── DAIRY RULES ──────────────────────────────────────────────────────
    const dairyRules = applicableRules.filter(
      (r) => r.hostType === RuleHostType.DAIRY,
    );
    if (dairyRules.length > 0) {
      try {
        const cows = await this.dairyService.getCows(farm.id);
        for (const cow of cows) {
          const animalSymptoms = symptomsByAnimal.get(cow.id) || [];
          for (const rule of dairyRules) {
            // Skip if rule targets specific breed and it doesn't match
            if (rule.hostTarget && rule.hostTarget !== cow.breed) continue;

            if (
              this.evaluateRuleForDairy(
                rule.conditions,
                forecast,
                animalSymptoms,
                cow,
              )
            ) {
              const alert = await this.createAlert(
                farm,
                rule,
                RuleHostType.DAIRY,
                cow.id,
              );
              if (alert) newAlerts.push(alert);
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error evaluating dairy rules for farm ${farm.id}`,
          error,
        );
      }
    }

    // ─── RUMINANT RULES ───────────────────────────────────────────────────
    const ruminantRules = applicableRules.filter(
      (r) => r.hostType === RuleHostType.RUMINANT,
    );
    if (ruminantRules.length > 0) {
      try {
        const ruminants = await this.smallRuminantsService.getRuminants(
          farm.id,
        );
        for (const ruminant of ruminants) {
          const animalSymptoms = symptomsByAnimal.get(ruminant.id) || [];
          for (const rule of ruminantRules) {
            // Skip if rule targets specific species and it doesn't match
            if (rule.hostTarget && rule.hostTarget !== ruminant.species)
              continue;

            if (
              this.evaluateRuleForRuminant(
                rule.conditions,
                forecast,
                animalSymptoms,
                ruminant,
              )
            ) {
              const alert = await this.createAlert(
                farm,
                rule,
                RuleHostType.RUMINANT,
                ruminant.id,
              );
              if (alert) newAlerts.push(alert);
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error evaluating ruminant rules for farm ${farm.id}`,
          error,
        );
      }
    }

    // ─── POULTRY RULES ────────────────────────────────────────────────────
    const poultryRules = applicableRules.filter(
      (r) => r.hostType === RuleHostType.POULTRY,
    );
    if (poultryRules.length > 0) {
      try {
        // Get all houses with flocks
        const houses = await this.poultryService.getHouses(farm.id);
        for (const house of houses) {
          const flocks = await this.poultryService.getFlocks(house.id);
          for (const flock of flocks) {
            const flockSymptoms = symptomsByAnimal.get(flock.id) || [];
            for (const rule of poultryRules) {
              // Skip if rule targets specific type/breed
              if (
                rule.hostTarget &&
                rule.hostTarget !== flock.type &&
                rule.hostTarget !== flock.breed
              )
                continue;

              if (
                this.evaluateRuleForPoultry(
                  rule.conditions,
                  forecast,
                  flockSymptoms,
                  flock,
                )
              ) {
                const alert = await this.createAlert(
                  farm,
                  rule,
                  RuleHostType.POULTRY,
                  flock.id,
                );
                if (alert) newAlerts.push(alert);
              }
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error evaluating poultry rules for farm ${farm.id}`,
          error,
        );
      }
    }

    // ─── CROP RULES ───────────────────────────────────────────────────────
    const cropRules = applicableRules.filter(
      (r) => r.hostType === RuleHostType.CROP,
    );
    if (cropRules.length > 0) {
      try {
        const activeCycles = await this.cropsService.findActiveCycles(farm.id);
        for (const cycle of activeCycles) {
          for (const rule of cropRules) {
            // Skip if rule targets specific crop type and it doesn't match
            if (rule.hostTarget && rule.hostTarget !== cycle.cropType) continue;

            if (this.evaluateRuleForCrop(rule.conditions, forecast, cycle)) {
              const alert = await this.createAlert(
                farm,
                rule,
                RuleHostType.CROP,
                cycle.id, // Use cycle ID as animalId equivalent
              );
              if (alert) newAlerts.push(alert);
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error evaluating crop rules for farm ${farm.id}`,
          error,
        );
      }
    }

    this.logger.log(
      `Farm ${farm.id}: evaluated ${rules.length} rules → created ${newAlerts.length} alerts`,
    );

    return newAlerts;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EVALUATION METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Evaluate rule conditions for dairy cattle
   */
  private evaluateRuleForDairy(
    conditions: RuleCondition,
    forecast: WeatherForecast,
    symptoms: string[],
    cow: any,
  ): boolean {
    // Weather check
    if (
      conditions.weather &&
      !this.checkWeather(conditions.weather, forecast)
    ) {
      return false;
    }

    // Symptoms check
    if (conditions.symptoms?.length) {
      const hasMatchingSymptom = conditions.symptoms.some((s) =>
        symptoms.includes(s),
      );
      if (!hasMatchingSymptom) return false;
    }

    // Lactation stage (dairy specific)
    if (
      conditions.lactationStage?.length &&
      cow.daysInMilk !== undefined &&
      cow.daysInMilk !== null
    ) {
      const stage = this.getLactationStage(cow.daysInMilk);
      if (!conditions.lactationStage.includes(stage)) return false;
    }

    // Breeding status
    if (conditions.breedingStatus?.length) {
      const status = cow.isPregnant ? 'pregnant' : 'non-pregnant';
      if (!conditions.breedingStatus.includes(status)) return false;
    }

    return true;
  }

  /**
   * Evaluate rule conditions for small ruminants
   */
  private evaluateRuleForRuminant(
    conditions: RuleCondition,
    forecast: WeatherForecast,
    symptoms: string[],
    ruminant: any,
  ): boolean {
    // Weather check
    if (
      conditions.weather &&
      !this.checkWeather(conditions.weather, forecast)
    ) {
      return false;
    }

    // Symptoms check
    if (conditions.symptoms?.length) {
      const hasMatchingSymptom = conditions.symptoms.some((s) =>
        symptoms.includes(s),
      );
      if (!hasMatchingSymptom) return false;
    }

    // Growth stage (ruminant specific)
    if (conditions.growthStage?.length && ruminant.dateOfBirth) {
      const stage = this.getGrowthStage(ruminant.dateOfBirth);
      if (!conditions.growthStage.includes(stage)) return false;
    }

    // Breeding status
    if (conditions.breedingStatus?.length) {
      const status = ruminant.isPregnant ? 'pregnant' : 'non-pregnant';
      if (!conditions.breedingStatus.includes(status)) return false;
    }

    // Species filter
    if (conditions.animalSpecies?.length) {
      if (!conditions.animalSpecies.includes(ruminant.species)) return false;
    }

    return true;
  }

  /**
   * Evaluate rule conditions for poultry flocks
   */
  private evaluateRuleForPoultry(
    conditions: RuleCondition,
    forecast: WeatherForecast,
    symptoms: string[],
    flock: any,
  ): boolean {
    // Weather check
    if (
      conditions.weather &&
      !this.checkWeather(conditions.weather, forecast)
    ) {
      return false;
    }

    // Symptoms check
    if (conditions.symptoms?.length) {
      const hasMatchingSymptom = conditions.symptoms.some((s) =>
        symptoms.includes(s),
      );
      if (!hasMatchingSymptom) return false;
    }

    // Flock size (poultry specific)
    if (conditions.flockSize?.length && flock.currentCount) {
      const size = this.getFlockSizeCategory(flock.currentCount);
      if (!conditions.flockSize.includes(size)) return false;
    }

    // Bird type / breed
    if (conditions.birdType?.length) {
      if (!conditions.birdType.includes(flock.type)) return false;
    }

    return true;
  }

  /**
   * Evaluate rule conditions for crop cycles
   */
  private evaluateRuleForCrop(
    conditions: RuleCondition,
    forecast: WeatherForecast,
    cycle: any,
  ): boolean {
    // Weather check
    if (
      conditions.weather &&
      !this.checkWeather(conditions.weather, forecast)
    ) {
      return false;
    }

    // Crop stage check
    if (conditions.cropStage?.length) {
      if (!conditions.cropStage.includes(cycle.currentStage)) return false;
    }

    // Crop type check
    if (conditions.cropType?.length) {
      if (!conditions.cropType.includes(cycle.cropType)) return false;
    }

    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check if weather conditions match thresholds
   */
  private checkWeather(
    weatherThreshold: WeatherConditionThreshold,
    forecast: WeatherForecast,
  ): boolean {
    // Average weather over next 5 days for better disease prediction
    const days = forecast.daily.slice(0, 5);
    const avg = this.averageWeather(days);

    const check = (
      val: number,
      range?: { min?: number; max?: number },
    ): boolean => {
      if (!range) return true;
      if (range.min !== undefined && val < range.min) return false;
      if (range.max !== undefined && val > range.max) return false;
      return true;
    };

    return (
      check(avg.humidity, weatherThreshold.humidity) &&
      check(avg.temperatureMean, weatherThreshold.temperatureMean) &&
      check(avg.precipitation, weatherThreshold.precipitation) &&
      check(avg.windSpeed, weatherThreshold.windSpeed)
    );
  }

  /**
   * Determine lactation stage from days in milk
   */
  private getLactationStage(daysInMilk: number): string {
    if (daysInMilk <= 100) return 'early_lactation';
    if (daysInMilk <= 200) return 'mid_lactation';
    return 'late_lactation';
  }

  /**
   * Determine growth stage from date of birth (for ruminants)
   */
  private getGrowthStage(dateOfBirth: Date): string {
    const ageMonths = this.calculateAgeMonths(dateOfBirth);
    if (ageMonths <= 3) return 'young';
    if (ageMonths <= 6) return 'growing';
    return 'mature';
  }

  /**
   * Determine flock size category
   */
  private getFlockSizeCategory(size: number): string {
    if (size < 100) return 'small';
    if (size <= 500) return 'medium';
    return 'large';
  }

  /**
   * Calculate age in months from date of birth
   */
  private calculateAgeMonths(dateOfBirth: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - new Date(dateOfBirth).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  }

  /**
   * Get current season based on date (simplified - could be region-specific)
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1; // 1-12

    // Simplified seasonal mapping (Kenya/East Africa context)
    if (month >= 3 && month <= 5) return 'long_rains'; // March-May
    if (month >= 6 && month <= 9) return 'dry'; // June-September
    if (month >= 10 && month <= 11) return 'short_rains'; // October-November
    return 'dry'; // December-February
  }

  /**
   * Calculate average weather across multiple days
   */
  private averageWeather(days: WeatherCondition[]): WeatherCondition {
    const n = days.length;
    return {
      date: days[0].date,
      temperatureMin: days.reduce((s, d) => s + d.temperatureMin, 0) / n,
      temperatureMax: days.reduce((s, d) => s + d.temperatureMax, 0) / n,
      temperatureMean: days.reduce((s, d) => s + d.temperatureMean, 0) / n,
      humidity: days.reduce((s, d) => s + d.humidity, 0) / n,
      precipitation: days.reduce((s, d) => s + d.precipitation, 0) / n,
      windSpeed: days.reduce((s, d) => s + d.windSpeed, 0) / n,
      uvIndex: days.reduce((s, d) => s + d.uvIndex, 0) / n,
      weatherCode: days[0].weatherCode,
    };
  }

  /**
   * Create disease alert if no recent alert exists (respecting cooldown)
   */
  private async createAlert(
    farm: Farm,
    rule: DiseaseRule,
    hostType: RuleHostType,
    animalId: string,
  ): Promise<DiseaseAlert | null> {
    // Check for recent alert for this rule and animal
    const recentAlert = await this.alertsRepo.findOne({
      where: {
        farmId: farm.id,
        ruleId: rule.id,
        animalId: animalId, // Include animal for per-animal cooldown
      },
      order: { triggeredAt: 'DESC' },
    });

    if (recentAlert) {
      const daysSinceAlert =
        (Date.now() - recentAlert.triggeredAt.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceAlert < rule.cooldownDays) {
        return null; // Still in cooldown period
      }
    }

    // Create new alert
    const alert = this.alertsRepo.create({
      farmId: farm.id,
      animalId: animalId, // Track which animal triggered the alert
      ruleId: rule.id,
      diseaseName: rule.diseaseName,
      hostType,
      hostTarget: rule.hostTarget,
      severity: rule.severity,
      description: rule.description,
      recommendations: rule.recommendations,
      triggeredAt: new Date(),
      triggerContext: { weatherForecast: true }, // Could store actual forecast data
    });

    return this.alertsRepo.save(alert);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUERY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get all unresolved disease alerts for a farm
   */
  async getActiveAlerts(farmId: string): Promise<DiseaseAlert[]> {
    return this.alertsRepo.find({
      where: { farmId, isResolved: false },
      order: { severity: 'DESC', triggeredAt: 'DESC' },
    });
  }

  /**
   * Mark alert as read
   */
  async acknowledgeAlert(alertId: string): Promise<DiseaseAlert> {
    await this.alertsRepo.update({ id: alertId }, { isRead: true });
    return this.alertsRepo.findOneOrFail({ where: { id: alertId } });
  }

  /**
   * Mark alert as resolved
   */
  async resolveAlert(alertId: string): Promise<DiseaseAlert> {
    await this.alertsRepo.update({ id: alertId }, { isResolved: true });
    return this.alertsRepo.findOneOrFail({ where: { id: alertId } });
  }

  /**
   * Get all active disease rules
   */
  async getRules(): Promise<DiseaseRule[]> {
    return this.rulesRepo.find({ where: { isActive: true } });
  }

  /**
   * Create a new disease rule
   */
  async createRule(data: Partial<DiseaseRule>): Promise<DiseaseRule> {
    const rule = this.rulesRepo.create(data);
    return this.rulesRepo.save(rule);
  }

  /**
   * Update a disease rule
   */
  async updateRule(
    ruleId: string,
    data: Partial<DiseaseRule>,
  ): Promise<DiseaseRule> {
    await this.rulesRepo.update({ id: ruleId }, data);
    return this.rulesRepo.findOneOrFail({ where: { id: ruleId } });
  }

  /**
   * Deactivate a disease rule
   */
  async deactivateRule(ruleId: string): Promise<DiseaseRule> {
    await this.rulesRepo.update({ id: ruleId }, { isActive: false });
    return this.rulesRepo.findOneOrFail({ where: { id: ruleId } });
  }
}
