// insight/insight.service.ts

import { Injectable } from '@nestjs/common';
import { FlockAnalyticsService } from '../flock-analytics/flock-analytics.service';
import { BenchmarkService } from './benchmark.service';
import { FlockType } from '../flock/enums';
import {
  Insight,
  InsightSeverity,
  InsightCategory,
  InsightStatus,
} from './insight.types';
import { FlockBenchmarks, ProductionBenchmarks } from './insight.types';
import {
  FlockSummary,
  FlockSummaryFlock,
  FlockSummaryProduction,
  FlockSummaryFeed,
  FlockSummaryHealth,
  FlockSummaryGrowth,
} from './flock-summary.types';

/** A single point in a trend, reduced to just what trend math needs */
interface TrendPoint {
  recordDate: Date | string;
  value: number;
}

interface Trend {
  percentChange: number;
  days: number;
}

@Injectable()
export class InsightService {
  constructor(
    private readonly analyticsService: FlockAnalyticsService,
    private readonly benchmarkService: BenchmarkService,
  ) {}

  /**
   * Generate all insights for a flock.
   *
   * Production and growth trends are now genuinely fetched and computed —
   * previously the code referenced data.productionTrend / data.feedTrend /
   * data.daysBetweenWeighings, none of which FlockAnalyticsService ever
   * populated, so every trend-escalation branch and the entire
   * "daily gain too slow" check were dead code that could never fire.
   *
   * Feed trend is intentionally NOT wired yet — there's no
   * getFeedTrend()-equivalent on FlockAnalyticsService today. Rather than
   * fake it, the feed insight below just doesn't attempt trend
   * escalation. That's a real, known gap, not a silent one.
   */
  async generateInsights(flockId: string, farmId: string): Promise<Insight[]> {
    const summary: FlockSummary = await this.analyticsService.getFlockSummary(
      flockId,
      farmId,
    );
    const flock = summary.flock;

    const benchmarks = this.benchmarkService.getAgeAdjustedBenchmarks(
      flock.type,
      flock.age.days,
      flock.breed,
    );

    const eggProductionCapable =
      flock.type === FlockType.LAYERS || flock.type === FlockType.KIENYEJI;

    const [productionTrend, growthTrend] = await Promise.all([
      eggProductionCapable
        ? this.fetchProductionTrend(flockId, farmId)
        : Promise.resolve(null),
      this.fetchGrowthTrend(flockId, farmId),
    ]);

    const insights: Insight[] = [];

    insights.push(
      this.analyzeProduction(
        summary.production,
        benchmarks,
        flock,
        productionTrend,
      ),
    );
    insights.push(this.analyzeFeed(summary.feed, benchmarks, flock));
    insights.push(this.analyzeHealth(summary.health, benchmarks, flock));
    insights.push(
      this.analyzeGrowth(summary.growth, benchmarks, flock, growthTrend),
    );

    return insights;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TREND FETCHING
  // ═══════════════════════════════════════════════════════════════════════

  private async fetchProductionTrend(
    flockId: string,
    farmId: string,
  ): Promise<Trend | null> {
    const trend = await this.analyticsService.getEggProductionTrend(
      flockId,
      farmId,
      7,
    );
    if (!trend.available) return null;

    const points: TrendPoint[] = (trend.daily ?? [])
      .filter((d) => d.productionRatePercent !== null)
      .map((d) => ({
        recordDate: d.recordDate,
        value: d.productionRatePercent!,
      }));

    return this.computeTrend(points);
  }

  private async fetchGrowthTrend(
    flockId: string,
    farmId: string,
  ): Promise<Trend | null> {
    const trend = await this.analyticsService.getGrowthTrend(
      flockId,
      farmId,
      14,
    );
    if (!trend.available) return null;

    const points: TrendPoint[] = (trend.daily ?? []).map((d) => ({
      recordDate: d.recordDate,
      value: d.averageWeightKg,
    }));

    return this.computeTrend(points);
  }
  private toDate(value: Date | string): Date | null {
    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  /** First-vs-last comparison across whatever window was fetched. Needs at least 2 points. */
  private computeTrend(points: TrendPoint[]): Trend | null {
    if (points.length < 2) return null;

    const first = points[0];
    const firstDate = this.toDate(first.recordDate);
    const last = points[points.length - 1];
    const lastDate = this.toDate(last.recordDate);

    if (!firstDate || !lastDate) {
      return null;
    }

    const days = Math.max(
      1,
      Math.round((lastDate.getTime() - firstDate.getTime()) / 86_400_000),
    );
    const percentChange = ((last.value - first.value) / first.value) * 100;

    return { percentChange, days };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCTION ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  private analyzeProduction(
    data: FlockSummaryProduction,
    benchmarks: FlockBenchmarks,
    flock: FlockSummaryFlock,
    trend: Trend | null,
  ): Insight {
    const rate = data.latestProductionRatePercent;

    if (rate === null) {
      return this.noDataInsight(
        InsightCategory.PRODUCTION,
        flock,
        'Production',
      );
    }

    const { peak, good, minimum } = benchmarks.production;
    const breed = flock.breed;
    const ageDays = flock.age.days;

    let severity: InsightSeverity;
    let description: string;
    let isActionable: boolean;

    if (rate >= peak) {
      severity = InsightSeverity.INFO;
      description = `Production is ${rate}%, at or above the target peak of ${peak}% for ${breed} at ${ageDays} days. This is excellent performance.`;
      isActionable = false;
    } else if (rate >= good) {
      severity = InsightSeverity.INFO;
      description = `Production is ${rate}%, above the good threshold of ${good}% for ${breed} at ${ageDays} days. Performance is on track.`;
      isActionable = false;
    } else if (rate >= minimum) {
      severity = InsightSeverity.LOW;
      description = `Production is ${rate}%, at the minimum threshold of ${minimum}% for ${breed} at ${ageDays} days. Monitor closely for any further decline.`;
      isActionable = true;
    } else {
      severity = InsightSeverity.MEDIUM;
      description = `Production is ${rate}%, below the minimum threshold of ${minimum}% for ${breed} at ${ageDays} days. This requires attention.`;
      isActionable = true;
    }

    if (trend && trend.percentChange < -benchmarks.production.dropThreshold) {
      severity = this.escalateSeverity(severity);
      isActionable = true;
      description += ` Production has dropped ${Math.abs(trend.percentChange).toFixed(1)}% over the last ${trend.days} day(s).`;
    }

    return {
      id: this.generateInsightId(),
      category: InsightCategory.PRODUCTION,
      severity,
      status: InsightStatus.ACTIVE,
      title: `Production Rate: ${rate}%`,
      description,
      data: {
        actual: rate,
        expected: minimum,
        expectedRange: { min: good, max: peak },
        expectedDisplay: `${good}-${peak}%`,
        unit: '%',
        percentChange: trend?.percentChange,
        dataDate: data.latestRecordDate ?? undefined,
      },
      context: this.buildContext(flock),
      timestamp: new Date(),
      isActionable,
      sourceMetric: 'productionRate',
      confidence: 95,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FEED ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  private analyzeFeed(
    data: FlockSummaryFeed,
    benchmarks: FlockBenchmarks,
    flock: FlockSummaryFlock,
  ): Insight {
    const feedPerBird = data.feedPerBirdGramsLatest;

    if (feedPerBird === null) {
      return this.noDataInsight(InsightCategory.FEED, flock, 'Feed');
    }

    // A genuine 0kg feed day is a real operational emergency (feeders
    // empty, delivery didn't arrive) — NOT the same as "no data yet".
    // feedConsumedKg is a required field on record creation, so a
    // legitimate 0 is possible and shouldn't be silently treated as
    // missing data.
    if (feedPerBird === 0) {
      return {
        id: this.generateInsightId(),
        category: InsightCategory.FEED,
        severity: InsightSeverity.CRITICAL,
        status: InsightStatus.ACTIVE,
        title: 'Zero feed recorded today',
        description: `${flock.breed} flock at ${flock.age.days} days recorded zero feed consumption on the latest record. This likely means feeders were empty or feed delivery didn't arrive — verify immediately.`,
        data: {
          actual: 0,
          expected: benchmarks.feed.min,
          expectedRange: { min: benchmarks.feed.min, max: benchmarks.feed.max },
          expectedDisplay: `${benchmarks.feed.min}-${benchmarks.feed.max}g/bird/day`,
          unit: 'g/bird/day',
          dataDate: data.latestRecordDate ?? undefined,
        },
        context: this.buildContext(flock),
        timestamp: new Date(),
        isActionable: true,
        sourceMetric: 'feedPerBird',
        confidence: 95,
      };
    }

    const breed = flock.breed;
    const ageDays = flock.age.days;
    const { min, max } = benchmarks.feed;

    let severity: InsightSeverity;
    let description: string;
    let isActionable: boolean;

    if (feedPerBird >= min && feedPerBird <= max) {
      severity = InsightSeverity.INFO;
      description = `Feed intake is ${feedPerBird.toFixed(1)}g/bird/day, within the expected range of ${min}-${max}g/bird/day for ${breed} at ${ageDays} days.`;
      isActionable = false;
    } else if (feedPerBird < min) {
      severity = InsightSeverity.MEDIUM;
      description = `Feed intake is ${feedPerBird.toFixed(1)}g/bird/day, below the minimum of ${min}g/bird/day for ${breed} at ${ageDays} days. Low feed intake can lead to reduced production and weight loss.`;
      isActionable = true;
    } else {
      severity = InsightSeverity.MEDIUM;
      description = `Feed intake is ${feedPerBird.toFixed(1)}g/bird/day, above the maximum of ${max}g/bird/day for ${breed} at ${ageDays} days. High feed intake may indicate feed wastage or poor feed quality.`;
      isActionable = true;
    }

    // Feed trend escalation intentionally omitted — no getFeedTrend()
    // equivalent exists on FlockAnalyticsService yet. Known gap, not a
    // silent one; see the comment on generateInsights().

    return {
      id: this.generateInsightId(),
      category: InsightCategory.FEED,
      severity,
      status: InsightStatus.ACTIVE,
      title: `Feed Intake: ${feedPerBird.toFixed(1)}g/bird/day`,
      description,
      data: {
        actual: parseFloat(feedPerBird.toFixed(1)),
        expectedRange: { min, max },
        expectedDisplay: `${min}-${max}g/bird/day`,
        unit: 'g/bird/day',
        dataDate: data.latestRecordDate ?? undefined,
      },
      context: this.buildContext(flock),
      timestamp: new Date(),
      isActionable,
      sourceMetric: 'feedPerBird',
      confidence: 90,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HEALTH ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  private analyzeHealth(
    data: FlockSummaryHealth,
    benchmarks: FlockBenchmarks,
    flock: FlockSummaryFlock,
  ): Insight {
    const { mortalityPercent, cullingPercent, survivalRatePercent } = data;
    const breed = flock.breed;
    const ageDays = flock.age.days;
    const { mortalityThreshold, cullingThreshold } = benchmarks.health;

    const isMortalityHigh = mortalityPercent > mortalityThreshold;
    const isCullingHigh = cullingPercent > cullingThreshold;

    let severity: InsightSeverity;
    let description: string;
    let isActionable: boolean;

    if (isMortalityHigh && isCullingHigh) {
      severity = InsightSeverity.HIGH;
      description = `Mortality is ${mortalityPercent}% and culling is ${cullingPercent}%, both above their respective thresholds (${mortalityThreshold}% and ${cullingThreshold}%). This requires immediate attention.`;
      isActionable = true;
    } else if (isMortalityHigh) {
      severity = InsightSeverity.HIGH;
      description = `Mortality is ${mortalityPercent}%, above the threshold of ${mortalityThreshold}% for ${breed} at ${ageDays} days. This requires investigation.`;
      isActionable = true;
    } else if (isCullingHigh) {
      severity = InsightSeverity.MEDIUM;
      description = `Culling is ${cullingPercent}%, above the threshold of ${cullingThreshold}% for ${breed} at ${ageDays} days. Review culling practices.`;
      isActionable = true;
    } else if (mortalityPercent < mortalityThreshold * 0.5) {
      severity = InsightSeverity.INFO;
      description = `Mortality is ${mortalityPercent}%, well below the threshold of ${mortalityThreshold}% for ${breed} at ${ageDays} days. Health status is excellent.`;
      isActionable = false;
    } else {
      severity = InsightSeverity.INFO;
      description = `Mortality is ${mortalityPercent}%, within acceptable limits (below ${mortalityThreshold}%) for ${breed} at ${ageDays} days.`;
      isActionable = false;
    }

    description += ` Survival rate is ${survivalRatePercent.toFixed(1)}%.`;

    return {
      id: this.generateInsightId(),
      category: InsightCategory.HEALTH,
      severity,
      status: InsightStatus.ACTIVE,
      title: `Mortality: ${mortalityPercent}% (Survival: ${survivalRatePercent.toFixed(1)}%)`,
      description,
      data: {
        actual: mortalityPercent,
        expected: mortalityThreshold,
        expectedDisplay: `< ${mortalityThreshold}%`,
        unit: '%',
      },
      context: this.buildContext(flock),
      timestamp: new Date(),
      isActionable,
      sourceMetric: 'mortalityRate',
      confidence: 90,
      metadata: {
        survivalRate: survivalRatePercent,
        cullingPercent,
        totalMortality: data.totalMortality,
        totalCulls: data.totalCulls,
        totalLosses: data.populationLoss,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GROWTH ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  private analyzeGrowth(
    data: FlockSummaryGrowth,
    benchmarks: FlockBenchmarks,
    flock: FlockSummaryFlock,
    trend: Trend | null,
  ): Insight {
    if (!data.available) {
      return this.noDataInsight(InsightCategory.GROWTH, flock, 'Growth');
    }

    const currentWeight = data.currentAverageWeightKg;

    if (currentWeight === null || currentWeight === undefined) {
      return this.noDataInsight(InsightCategory.GROWTH, flock, 'Growth');
    }

    const breed = flock.breed;
    const ageDays = flock.age.days;
    const { minWeight, maxWeight, targetWeight, minDailyGain } =
      benchmarks.growth;

    const isBelowMin = currentWeight < minWeight;
    const isAboveMax = currentWeight > maxWeight;

    // Real daily gain, from the actual trend data — previously always
    // null because it depended on a field (daysBetweenWeighings) that
    // was never populated anywhere.
    const dailyGainKgPerDay = trend
      ? this.trendToDailyGain(trend, currentWeight)
      : null;
    const isGainLow =
      dailyGainKgPerDay !== null && dailyGainKgPerDay < minDailyGain;

    let severity: InsightSeverity;
    let description: string;
    let isActionable: boolean;

    if (isBelowMin && isGainLow) {
      severity = InsightSeverity.HIGH;
      description = `Average weight is ${currentWeight}kg (below minimum of ${minWeight}kg, target ${targetWeight}kg) with daily gain of ${dailyGainKgPerDay!.toFixed(3)}kg/day (below target of ${minDailyGain}kg/day). Growth is significantly below expectations for ${breed} at ${ageDays} days.`;
      isActionable = true;
    } else if (isBelowMin) {
      severity = InsightSeverity.MEDIUM;
      description = `Average weight is ${currentWeight}kg, below the minimum of ${minWeight}kg (target ${targetWeight}kg) for ${breed} at ${ageDays} days. Birds are underweight for their age.`;
      isActionable = true;
    } else if (isAboveMax) {
      severity = InsightSeverity.MEDIUM;
      description = `Average weight is ${currentWeight}kg, above the maximum of ${maxWeight}kg (target ${targetWeight}kg) for ${breed} at ${ageDays} days. Birds may be overweight for their age, which can affect production.`;
      isActionable = true;
    } else {
      const distanceFromTarget = Math.abs(currentWeight - targetWeight);
      // Within the band, but flag if meaningfully off the actual target
      // rather than just "somewhere in a wide range" — a bird at the
      // edge of the band isn't the same as a bird sitting on target.
      if (distanceFromTarget > (maxWeight - minWeight) * 0.3) {
        severity = InsightSeverity.LOW;
        description = `Average weight is ${currentWeight}kg — within the acceptable range (${minWeight}-${maxWeight}kg) but ${distanceFromTarget.toFixed(2)}kg from the ${targetWeight}kg target for ${breed} at ${ageDays} days.`;
        isActionable = false;
      } else {
        severity = InsightSeverity.INFO;
        description = `Average weight is ${currentWeight}kg, close to the ${targetWeight}kg target for ${breed} at ${ageDays} days. Growth is on track.`;
        isActionable = false;
      }
    }

    if (isGainLow) {
      severity = this.escalateSeverity(severity);
      description += ` Daily gain of ${dailyGainKgPerDay!.toFixed(3)}kg/day is below the expected ${minDailyGain}kg/day.`;
      isActionable = true;
    }

    if (data.firstWeighedOn && data.latestWeighedOn) {
      description += ` Weight recorded from ${this.formatDate(data.firstWeighedOn)} to ${this.formatDate(data.latestWeighedOn)}.`;
    }

    return {
      id: this.generateInsightId(),
      category: InsightCategory.GROWTH,
      severity,
      status: InsightStatus.ACTIVE,
      title: `Average Weight: ${currentWeight}kg`,
      description,
      data: {
        actual: currentWeight,
        expected: targetWeight,
        expectedRange: { min: minWeight, max: maxWeight },
        expectedDisplay: `${minWeight}-${maxWeight}kg (target ${targetWeight}kg)`,
        unit: 'kg',
        percentChange: trend?.percentChange,
        dataDate: data.latestWeighedOn ?? undefined,
      },
      context: this.buildContext(flock),
      timestamp: new Date(),
      isActionable,
      sourceMetric: 'averageWeight',
      confidence: 90,
      metadata: {
        dailyGainKgPerDay: dailyGainKgPerDay
          ? parseFloat(dailyGainKgPerDay.toFixed(3))
          : null,
        firstWeighedOn: data.firstWeighedOn,
        latestWeighedOn: data.latestWeighedOn,
        weightGainKg: data.weightGainKg,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private trendToDailyGain(trend: Trend, currentValue: number): number {
    // trend.percentChange is relative change over trend.days; convert
    // back to an absolute kg/day figure against the current weight.
    const startValue = currentValue / (1 + trend.percentChange / 100);
    return (currentValue - startValue) / trend.days;
  }

  private noDataInsight(
    category: InsightCategory,
    flock: FlockSummaryFlock,
    label: string,
  ): Insight {
    return {
      id: this.generateInsightId(),
      category,
      severity: InsightSeverity.INFO,
      status: InsightStatus.ACTIVE,
      title: `${label} data is being collected`,
      description: `${label} data is currently being collected for this flock. Once sufficient data is available, ${label.toLowerCase()} insights will be generated.`,
      data: { actual: 'N/A' },
      context: this.buildContext(flock),
      timestamp: new Date(),
      isActionable: false,
      confidence: 100,
    };
  }

  private buildContext(flock: FlockSummaryFlock) {
    return {
      breed: flock.breed,
      age: flock.age.days,
      // Display-only — see the warning on InsightContext.stage in
      // insight.types.ts. Nothing in this service branches on it.
      stage: flock.stage ?? undefined,
      type: flock.type,
    };
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'unknown';

    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return Number.isNaN(parsedDate.getTime())
      ? 'unknown'
      : parsedDate.toISOString().slice(0, 10);
  }

  private escalateSeverity(severity: InsightSeverity): InsightSeverity {
    const escalationMap: Record<InsightSeverity, InsightSeverity> = {
      [InsightSeverity.INFO]: InsightSeverity.LOW,
      [InsightSeverity.LOW]: InsightSeverity.MEDIUM,
      [InsightSeverity.MEDIUM]: InsightSeverity.HIGH,
      [InsightSeverity.HIGH]: InsightSeverity.CRITICAL,
      [InsightSeverity.CRITICAL]: InsightSeverity.CRITICAL,
    };
    return escalationMap[severity] || severity;
  }

  private generateInsightId(): string {
    return `insight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
