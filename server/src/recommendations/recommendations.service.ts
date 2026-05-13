import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import {
  Recommendation,
  RecommendationCategory,
  RecommendationPriority,
} from './entities/recommendation.entity';
import { DiseaseAlert } from '../disease-engine/entities/disease-alert.entity';
import { DiseaseSeverity } from '../disease-engine/entities/disease-rule.entity';
import { WeatherService } from '../weather/weather.service';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Recommendation)
    private readonly repo: Repository<Recommendation>,
    private readonly weatherService: WeatherService,
    private readonly farmsService: FarmsService,
  ) {}

  async findByFarm(farmId: string): Promise<Recommendation[]> {
    return this.repo.find({
      where: { farmId, isDismissed: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markRead(id: string, farmId: string): Promise<Recommendation> {
    await this.repo.update({ id, farmId }, { isRead: true });
    return this.repo.findOneOrFail({ where: { id } });
  }

  async dismiss(id: string, farmId: string): Promise<void> {
    await this.repo.update({ id, farmId }, { isDismissed: true });
  }

  async getUnreadCount(farmId: string): Promise<number> {
    return this.repo.count({ where: { farmId, isRead: false, isDismissed: false } });
  }

  /**
   * Auto-generate a recommendation when a disease alert is created.
   * Triggered via event emitter from the jobs processor.
   */
  async createFromDiseaseAlert(
    alert: DiseaseAlert,
  ): Promise<Recommendation> {
    const priority = this.mapSeverityToPriority(alert.severity);
    const actions = alert.recommendations.immediateActions ?? [];

    const rec = this.repo.create({
      farmId: alert.farmId,
      category: RecommendationCategory.DISEASE,
      priority,
      title: `Disease risk: ${alert.diseaseName}`,
      message: [
        alert.description ?? '',
        '',
        'Recommended actions:',
        ...actions.map((a, i) => `${i + 1}. ${a}`),
        '',
        alert.recommendations.vetRequired
          ? 'Consult a veterinarian or agronomist.'
          : '',
      ]
        .join('\n')
        .trim(),
      actions,
      sourceAlertId: alert.id,
      // Recommendations expire after 7 days
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return this.repo.save(rec);
  }

  async createWeatherRecommendation(
    farmId: string,
    message: string,
    actions: string[],
    priority = RecommendationPriority.MEDIUM,
  ): Promise<Recommendation> {
    const rec = this.repo.create({
      farmId,
      category: RecommendationCategory.WEATHER,
      priority,
      title: 'Weather advisory',
      message,
      actions,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });
    return this.repo.save(rec);
  }

  /**
   * Generate weather-based recommendations for all active farms.
   * Called by the daily job processor.
   */
  async generateWeatherAdvisories(farms: { id: string; geoPoint: any; timezone: string }[]) {
    for (const farm of farms) {
      if (!farm.geoPoint) continue;

      const [lng, lat] = farm.geoPoint.coordinates;
      const forecast = await this.weatherService.getForecastByCoords(
        lat,
        lng,
        farm.timezone,
      );

      const today = forecast.daily[0];
      if (!today) continue;

      // Heavy rain advisory
      if (today.precipitation > 50) {
        await this.createWeatherRecommendation(
          farm.id,
          `Heavy rainfall expected today (${today.precipitation.toFixed(0)}mm). Protect harvested crops and check drainage.`,
          ['Move harvested crops to dry storage', 'Check plot drainage channels', 'Postpone spraying activities'],
          RecommendationPriority.HIGH,
        );
      }

      // Drought advisory
      if (today.precipitation < 1 && today.temperatureMax > 32) {
        await this.createWeatherRecommendation(
          farm.id,
          `Hot and dry conditions expected (${today.temperatureMax.toFixed(0)}°C, no rainfall). Ensure adequate irrigation.`,
          ['Check soil moisture', 'Irrigate if available', 'Apply mulch to retain moisture'],
          RecommendationPriority.MEDIUM,
        );
      }
    }
  }

  private mapSeverityToPriority(
    severity: DiseaseSeverity,
  ): RecommendationPriority {
    const map: Record<DiseaseSeverity, RecommendationPriority> = {
      [DiseaseSeverity.LOW]: RecommendationPriority.LOW,
      [DiseaseSeverity.MEDIUM]: RecommendationPriority.MEDIUM,
      [DiseaseSeverity.HIGH]: RecommendationPriority.HIGH,
      [DiseaseSeverity.CRITICAL]: RecommendationPriority.URGENT,
    };
    return map[severity];
  }
}