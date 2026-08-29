// insight/benchmark.service.ts

import { Injectable } from '@nestjs/common';
import { FlockType } from '../flock/enums';
import {
  FlockBenchmarks,
  ProductionBenchmarks,
  FeedBenchmarks,
  HealthBenchmarks,
  GrowthBenchmarks,
  WaterBenchmarks,
} from './insight.types';

// ─── DEFAULT BENCHMARKS BY FLOCK TYPE ──────────────────────────────────────

/**
 * These are INDUSTRY-STANDARD benchmarks for each production type.
 *
 * IMPORTANT: These should be configurable per farm in the future.
 * For MVP, we use sensible defaults that farmers can later adjust.
 */

const DEFAULT_LAYER_BENCHMARKS: FlockBenchmarks = {
  production: {
    peak: 92,
    good: 85,
    minimum: 75,
    dropThreshold: 10,
  },
  feed: {
    min: 110,
    max: 125,
    target: 118,
  },
  health: {
    mortalityThreshold: 2,
    cullingThreshold: 1,
    mortalitySpikeThreshold: 2,
    sickBirdThreshold: 5,
  },
  growth: {
    minWeight: 1.6,
    maxWeight: 2.2,
    targetWeight: 1.9,
    minDailyGain: 0.008,
    uniformityTarget: 85,
  },
  water: {
    min: 0.15,
    max: 0.35,
    waterToFeedRatioMin: 1.6,
    waterToFeedRatioMax: 2.8,
  },
  version: '1.0.0',
  effectiveDate: new Date(),
  isCustom: false,
};

const DEFAULT_BROILER_BENCHMARKS: FlockBenchmarks = {
  production: {
    peak: 0, // Not applicable
    good: 0, // Not applicable
    minimum: 0, // Not applicable
    dropThreshold: 0, // Not applicable
  },
  feed: {
    min: 85,
    max: 120,
    target: 100,
  },
  health: {
    mortalityThreshold: 5,
    cullingThreshold: 2,
    mortalitySpikeThreshold: 2,
    sickBirdThreshold: 10,
  },
  growth: {
    minWeight: 1.8,
    maxWeight: 2.8,
    targetWeight: 2.2,
    minDailyGain: 0.05,
    uniformityTarget: 80,
  },
  water: {
    min: 0.15,
    max: 0.35,
    waterToFeedRatioMin: 1.6,
    waterToFeedRatioMax: 2.8,
  },
  version: '1.0.0',
  effectiveDate: new Date(),
  isCustom: false,
};

const DEFAULT_KIENYEJI_BENCHMARKS: FlockBenchmarks = {
  production: {
    peak: 75,
    good: 65,
    minimum: 50,
    dropThreshold: 10,
  },
  feed: {
    min: 80,
    max: 110,
    target: 95,
  },
  health: {
    mortalityThreshold: 8,
    cullingThreshold: 3,
    mortalitySpikeThreshold: 2,
    sickBirdThreshold: 8,
  },
  growth: {
    minWeight: 1.2,
    maxWeight: 2.0,
    targetWeight: 1.6,
    minDailyGain: 0.03,
    uniformityTarget: 75,
  },
  water: {
    min: 0.1,
    max: 0.3,
    waterToFeedRatioMin: 1.4,
    waterToFeedRatioMax: 3.0,
  },
  version: '1.0.0',
  effectiveDate: new Date(),
  isCustom: false,
};

const DEFAULT_BREEDER_BENCHMARKS: FlockBenchmarks = {
  production: {
    peak: 85,
    good: 78,
    minimum: 70,
    dropThreshold: 8,
  },
  feed: {
    min: 120,
    max: 140,
    target: 130,
  },
  health: {
    mortalityThreshold: 3,
    cullingThreshold: 2,
    mortalitySpikeThreshold: 2,
    sickBirdThreshold: 5,
  },
  growth: {
    minWeight: 2.0,
    maxWeight: 2.8,
    targetWeight: 2.4,
    minDailyGain: 0.01,
    uniformityTarget: 85,
  },
  water: {
    min: 0.2,
    max: 0.4,
    waterToFeedRatioMin: 1.6,
    waterToFeedRatioMax: 2.8,
  },
  version: '1.0.0',
  effectiveDate: new Date(),
  isCustom: false,
};

// ─── BREED-SPECIFIC OVERRIDES ──────────────────────────────────────────────

const BREED_OVERRIDES: Record<string, Partial<FlockBenchmarks>> = {
  'Lohmann Brown': {
    production: {
      peak: 95,
      good: 88,
      minimum: 78,
      dropThreshold: 10,
    },
    feed: {
      min: 112,
      max: 122,
      target: 117,
    },
  },
  'Lohmann White': {
    production: {
      peak: 93,
      good: 86,
      minimum: 76,
      dropThreshold: 10,
    },
    feed: {
      min: 108,
      max: 118,
      target: 113,
    },
  },
  'Ross 308': {
    growth: {
      minWeight: 2.0,
      maxWeight: 3.0,
      targetWeight: 2.5,
      minDailyGain: 0.055,
      uniformityTarget: 85,
    },
    feed: {
      min: 90,
      max: 115,
      target: 102,
    },
  },
  'Cobb 500': {
    growth: {
      minWeight: 2.0,
      maxWeight: 3.0,
      targetWeight: 2.4,
      minDailyGain: 0.052,
      uniformityTarget: 85,
    },
    feed: {
      min: 90,
      max: 115,
      target: 100,
    },
  },
};

// ─── BENCHMARK SERVICE ─────────────────────────────────────────────────────

@Injectable()
export class BenchmarkService {
  getBenchmarks(type: FlockType, breed?: string): FlockBenchmarks {
    let benchmarks = this.getDefaultBenchmarks(type);

    if (breed && BREED_OVERRIDES[breed]) {
      benchmarks = this.mergeBenchmarks(benchmarks, BREED_OVERRIDES[breed]);
    }

    return benchmarks;
  }

  /**
   * Get benchmarks with age-based adjustments.
   *
   * Production ramp: LAYERS and KIENYEJI both lay eggs (capability-gated,
   * not a hardcoded type check — same principle as FLOCK_CAPABILITIES).
   * KIENYEJI reuses the layer ramp SHAPE against its own target values,
   * which is an approximation pending real kienyeji production-curve
   * data — free-range dual-purpose birds likely ramp slower and more
   * variably than commercial layers. Flagged, not silently assumed
   * accurate.
   *
   * Growth: previously broiler-only. Layers get weighed too (rearing
   * monitoring, body condition checks) and were being checked against a
   * flat adult 1.6-2.2kg band regardless of age — meaning every layer
   * flock under ~16 weeks old would read as "underweight" by definition.
   * Now age-adjusted for both.
   */
  getAgeAdjustedBenchmarks(
    type: FlockType,
    ageDays: number,
    breed?: string,
  ): FlockBenchmarks {
    const benchmarks = this.getBenchmarks(type, breed);

    if (type === FlockType.LAYERS || type === FlockType.KIENYEJI) {
      benchmarks.production = this.adjustProductionForAge(
        benchmarks.production,
        ageDays,
      );
    }

    benchmarks.growth = this.adjustGrowthForAge(benchmarks.growth, ageDays, type);

    return benchmarks;
  }

  /**
   * Production ramp for layers/kienyeji — continuous across the day-120
   * boundary. The previous version computed the pre-120-day segment
   * independently from the 120-140-day segment, using a different
   * formula for each, which created a real cliff: at day 119 the peak
   * benchmark was 47.5%, and at day 120 it jumped to 60% — a 12.5 point
   * discontinuity for one day's difference in flock age. This version
   * uses the SAME anchor values (peak=60, good=50, minimum=20 at day 120)
   * for both segments, so they meet exactly instead of jumping.
   */
  private adjustProductionForAge(
    production: ProductionBenchmarks,
    ageDays: number,
  ): ProductionBenchmarks {
    const RAMP_START_DAY = 120; // ~17 weeks — typical onset of lay
    const RAMP_END_DAY = 140; // ~20 weeks — typical approach to peak
    const DECLINE_START_DAY = 280; // ~40 weeks — typical onset of decline

    const ANCHOR_PEAK = 60;
    const ANCHOR_GOOD = 50;
    const ANCHOR_MINIMUM = 20;

    let peak: number;
    let good: number;
    let minimum: number;

    if (ageDays < RAMP_START_DAY) {
      const progress = Math.max(0, ageDays) / RAMP_START_DAY; // 0 at day 0, 1 at day 120
      peak = ANCHOR_PEAK * progress;
      good = ANCHOR_GOOD * progress;
      minimum = ANCHOR_MINIMUM * progress;
    } else if (ageDays < RAMP_END_DAY) {
      const progress = (ageDays - RAMP_START_DAY) / (RAMP_END_DAY - RAMP_START_DAY);
      peak = ANCHOR_PEAK + progress * (production.peak - ANCHOR_PEAK);
      good = ANCHOR_GOOD + progress * (production.good - ANCHOR_GOOD);
      minimum = ANCHOR_MINIMUM + progress * (production.minimum - ANCHOR_MINIMUM);
    } else if (ageDays < DECLINE_START_DAY) {
      peak = production.peak;
      good = production.good;
      minimum = production.minimum;
    } else {
      const decline = Math.min(15, (ageDays - DECLINE_START_DAY) / 7);
      peak = production.peak - decline;
      good = production.good - decline * 0.8;
      minimum = production.minimum - decline * 0.5;
    }

    return {
      ...production,
      peak: Math.round(Math.max(0, peak)),
      good: Math.round(Math.max(0, good)),
      minimum: Math.round(Math.max(0, minimum)),
      dropThreshold: production.dropThreshold,
    };
  }

  /**
   * Growth curve, age-adjusted for BOTH broilers and layers now.
   * Kienyeji/breeders keep static bands — no reliable curve data for
   * either yet, same "don't guess" principle as leaving BREEDERS
   * capabilities empty until it's actually defined.
   */
  private adjustGrowthForAge(
    growth: GrowthBenchmarks,
    ageDays: number,
    type: FlockType,
  ): GrowthBenchmarks {
    if (type === FlockType.BROILERS) {
      const targetWeight = this.estimateBroilerWeightAtAge(ageDays);
      return {
        ...growth,
        targetWeight: Math.round(targetWeight * 100) / 100,
      };
    }

    if (type === FlockType.LAYERS) {
      const targetWeight = this.estimateLayerWeightAtAge(ageDays, growth.targetWeight);
      // Preserve the configured tolerance width, just re-center it on the
      // age-appropriate target instead of the flat adult target.
      const bandWidth = growth.maxWeight - growth.minWeight;
      return {
        ...growth,
        targetWeight: Math.round(targetWeight * 100) / 100,
        minWeight: Math.round(Math.max(0.04, targetWeight - bandWidth / 2) * 100) / 100,
        maxWeight: Math.round((targetWeight + bandWidth / 2) * 100) / 100,
      };
    }

    return growth;
  }

  /** Simplified broiler growth curve — day-old chick to ~56-day market weight */
  private estimateBroilerWeightAtAge(ageDays: number): number {
    if (ageDays <= 0) return 0.04;
    if (ageDays >= 56) return 2.8;
    return 0.04 + 2.76 / (1 + Math.exp(-0.09 * (ageDays - 28)));
  }

  /**
   * Simplified layer growth curve — day-old chick ramping toward the
   * breed's adult target weight, inflection around 12 weeks (84 days).
   * Generic sigmoid, not breed-specific (no breed growth overrides exist
   * for layers today — Lohmann Brown/White only override production and
   * feed). Good enough to stop flagging every young pullet as
   * underweight; not precise enough to replace a real breed growth chart.
   */
  private estimateLayerWeightAtAge(ageDays: number, adultTargetWeightKg: number): number {
    if (ageDays <= 0) return 0.04;
    const weight =
      0.04 + (adultTargetWeightKg - 0.04) / (1 + Math.exp(-0.035 * (ageDays - 84)));
    return Math.min(adultTargetWeightKg, weight);
  }

  private getDefaultBenchmarks(type: FlockType): FlockBenchmarks {
    switch (type) {
      case FlockType.LAYERS:
        return JSON.parse(JSON.stringify(DEFAULT_LAYER_BENCHMARKS));
      case FlockType.BROILERS:
        return JSON.parse(JSON.stringify(DEFAULT_BROILER_BENCHMARKS));
      case FlockType.KIENYEJI:
        return JSON.parse(JSON.stringify(DEFAULT_KIENYEJI_BENCHMARKS));
      case FlockType.BREEDERS:
        return JSON.parse(JSON.stringify(DEFAULT_BREEDER_BENCHMARKS));
      default:
        return JSON.parse(JSON.stringify(DEFAULT_BROILER_BENCHMARKS));
    }
  }

  private mergeBenchmarks(
    base: FlockBenchmarks,
    overrides: Partial<FlockBenchmarks>,
  ): FlockBenchmarks {
    return {
      production: { ...base.production, ...(overrides.production || {}) },
      feed: { ...base.feed, ...(overrides.feed || {}) },
      health: { ...base.health, ...(overrides.health || {}) },
      growth: { ...base.growth, ...(overrides.growth || {}) },
      water: { ...base.water, ...(overrides.water || {}) },
      version: overrides.version || base.version,
      effectiveDate: overrides.effectiveDate || base.effectiveDate,
      isCustom: overrides.isCustom || base.isCustom,
    };
  }

  getBreedBenchmarks(breed: string): Partial<FlockBenchmarks> | null {
    return BREED_OVERRIDES[breed] || null;
  }

  getAvailableBreeds(): string[] {
    return Object.keys(BREED_OVERRIDES);
  }

  /**
   * Validate metrics against benchmarks. Weight is now checked whenever
   * it's PROVIDED, not gated to a specific FlockType — a layer's weight
   * is just as real a measurement as a broiler's. Same principle as the
   * FLOCK_CAPABILITIES fix: check what data exists, not what the type
   * "usually" has. Also added the missing upper-bound (overweight) check,
   * which previously didn't exist at all.
   */
  validateAgainstBenchmarks(
    type: FlockType,
    breed: string | undefined,
    metrics: {
      productionRate?: number;
      feedPerBird?: number;
      mortalityRate?: number;
      averageWeight?: number;
      dailyGain?: number;
      waterIntake?: number;
    },
  ): {
    passes: boolean;
    failures: Array<{
      metric: string;
      actual: number;
      expected: number | string;
      severity: 'low' | 'medium' | 'high';
      message: string;
    }>;
  } {
    const benchmarks = this.getBenchmarks(type, breed);
    const failures: Array<{
      metric: string;
      actual: number;
      expected: number | string;
      severity: 'low' | 'medium' | 'high';
      message: string;
    }> = [];

    // ── Production — capability-gated, not hardcoded to LAYERS alone ────

    if (
      metrics.productionRate !== undefined &&
      (type === FlockType.LAYERS || type === FlockType.KIENYEJI)
    ) {
      if (metrics.productionRate < benchmarks.production.minimum) {
        failures.push({
          metric: 'productionRate',
          actual: metrics.productionRate,
          expected: `> ${benchmarks.production.minimum}%`,
          severity: 'high',
          message: 'Production is below minimum threshold',
        });
      }
    }

    // ── Feed ────────────────────────────────────────────────────────────

    if (metrics.feedPerBird !== undefined) {
      if (metrics.feedPerBird < benchmarks.feed.min) {
        failures.push({
          metric: 'feedPerBird',
          actual: metrics.feedPerBird,
          expected: `${benchmarks.feed.min}-${benchmarks.feed.max}g`,
          severity: 'medium',
          message: 'Feed intake is below minimum',
        });
      }
      if (metrics.feedPerBird > benchmarks.feed.max) {
        failures.push({
          metric: 'feedPerBird',
          actual: metrics.feedPerBird,
          expected: `${benchmarks.feed.min}-${benchmarks.feed.max}g`,
          severity: 'medium',
          message: 'Feed intake is above maximum',
        });
      }
    }

    // ── Health ─────────────────────────────────────────────────────────

    if (metrics.mortalityRate !== undefined) {
      if (metrics.mortalityRate > benchmarks.health.mortalityThreshold) {
        failures.push({
          metric: 'mortalityRate',
          actual: metrics.mortalityRate,
          expected: `< ${benchmarks.health.mortalityThreshold}%`,
          severity: 'high',
          message: 'Mortality is above threshold',
        });
      }
    }

    // ── Growth — checked for any type that supplies it, both bounds ────

    if (metrics.averageWeight !== undefined) {
      if (metrics.averageWeight < benchmarks.growth.minWeight) {
        failures.push({
          metric: 'averageWeight',
          actual: metrics.averageWeight,
          expected: `${benchmarks.growth.minWeight}-${benchmarks.growth.maxWeight}kg`,
          severity: 'medium',
          message: 'Average weight is below minimum',
        });
      } else if (metrics.averageWeight > benchmarks.growth.maxWeight) {
        failures.push({
          metric: 'averageWeight',
          actual: metrics.averageWeight,
          expected: `${benchmarks.growth.minWeight}-${benchmarks.growth.maxWeight}kg`,
          severity: 'medium',
          message: 'Average weight is above maximum',
        });
      }
    }

    return {
      passes: failures.length === 0,
      failures,
    };
  }
}