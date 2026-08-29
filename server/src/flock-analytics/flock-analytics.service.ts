import { BadRequestException, Injectable } from '@nestjs/common';

import { FlockService } from '../flock/flock.service';
import { FlockRecordsService } from '../flock-records/flock-records.service';
import { FlockRecord } from '../flock-records/entities/flock-record.entity';

type ForecastConfidence = 'low' | 'moderate' | 'strong';

@Injectable()
export class FlockAnalyticsService {
  constructor(
    private readonly flockService: FlockService,
    private readonly flockRecordsService: FlockRecordsService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY — sectioned digest for the farmer dashboard
  // ═══════════════════════════════════════════════════════════════════════

  async getFlockSummary(flockId: string, farmId: string) {
    const flock = await this.flockService.getFlock(flockId, farmId);

    const stats = await this.flockRecordsService.getCumulativeStats(
      flockId,
      farmId,
    );

    const eggStats = await this.flockRecordsService.getEggStats(
      flockId,
      farmId,
    );

    const weightStats = await this.flockRecordsService.getWeightStats(
      flockId,
      farmId,
    );

    const recentRecords = await this.flockRecordsService.getRecentRecords(
      flockId,
      farmId,
      7,
    );

    // getRecentRecords() orders DESC
    const latestRecord = recentRecords[0] ?? null;

    // ─────────────────────────────────────────────────────────────────────
    // AGE
    // ─────────────────────────────────────────────────────────────────────

    const placementDate = this.asDate(flock.placementDate);

    const daysSincePlacement = Math.max(
      0,
      Math.floor(
        (Date.now() - placementDate.getTime()) / 86_400_000,
      ),
    );

    const ageInDays =
      daysSincePlacement + Number(flock.ageAtPlacementWeeks ?? 0) * 7;

    // ─────────────────────────────────────────────────────────────────────
    // LATEST RECORD
    // ─────────────────────────────────────────────────────────────────────

    const todayStr = this.toDateString(new Date());

    const latestRecordDateStr = latestRecord
      ? this.toDateString(latestRecord.recordDate)
      : null;

    const isLatestRecordToday =
      latestRecordDateStr !== null &&
      latestRecordDateStr === todayStr;

    // ─────────────────────────────────────────────────────────────────────
    // EGG PRODUCTION
    // ─────────────────────────────────────────────────────────────────────

    const recordsWithEggs = recentRecords.filter(
      (record) => record.eggCollection != null,
    );

    const avgEggsPerDay7d =
      recordsWithEggs.length > 0
        ? this.round(
            recordsWithEggs.reduce(
              (sum, record) =>
                sum + Number(record.eggCollection?.totalEggs ?? 0),
              0,
            ) / recordsWithEggs.length,
            1,
          )
        : null;

    /*
     * Production rate is only meaningful when egg data exists.
     *
     * We deliberately do NOT use flock.currentCount here because that
     * represents today's population. Historical production needs the
     * population that existed at the START of that production day.
     */
    const latestEggRecord = recordsWithEggs[0] ?? null;

    let latestProductionRatePercent: number | null = null;
    let productionPopulationAtStartOfDay: number | null = null;

    if (latestEggRecord) {
      const baseline =
        await this.flockRecordsService.getCumulativeLossBefore(
          flockId,
          farmId,
          this.asDate(latestEggRecord.recordDate),
        );

      productionPopulationAtStartOfDay =
        this.calculatePopulationAtStartOfDay(
          Number(flock.initialCount),
          baseline.mortality,
          baseline.culls,
        );

      const eggsCollected = Number(
        latestEggRecord.eggCollection?.totalEggs ?? 0,
      );

      latestProductionRatePercent =
        productionPopulationAtStartOfDay > 0
          ? this.round(
              (eggsCollected / productionPopulationAtStartOfDay) * 100,
              1,
            )
          : null;
    }

    const totalEggs = Number(eggStats.totalEggs ?? 0);

    const totalTrays = Math.floor(totalEggs / 30);
    const looseEggs = totalEggs % 30;

    // ─────────────────────────────────────────────────────────────────────
    // HEALTH
    // ─────────────────────────────────────────────────────────────────────

    const totalMortality = Number(stats.totalMortality ?? 0);
    const totalCulls = Number(stats.totalCulls ?? 0);

    const populationLoss = totalMortality + totalCulls;

    // ─────────────────────────────────────────────────────────────────────
    // FEED
    // ─────────────────────────────────────────────────────────────────────

    const latestFeedKg =
      latestRecord?.feedConsumedKg != null
        ? Number(latestRecord.feedConsumedKg)
        : null;

    const totalFeedKg = Number(stats.totalFeedKg ?? 0);

    const feedPerBirdGramsLatest =
      latestFeedKg !== null && Number(flock.currentCount) > 0
        ? this.round(
            (latestFeedKg / Number(flock.currentCount)) * 1000,
            1,
          )
        : null;

    // ─────────────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────────────

    return {
      flock: {
        id: flock.id,
        name: flock.name,
        breed: flock.breed,
        type: flock.type,
        status: flock.status,
        stage: flock.stage,

        currentCount: Number(flock.currentCount),
        initialCount: Number(flock.initialCount),

        age: {
          days: ageInDays,
          weeks: this.round(ageInDays / 7, 1),
          display: `${Math.floor(ageInDays / 7)} weeks`,
        },
      },

      production: {
        latestRecordDate: latestEggRecord
          ? this.toDateString(latestEggRecord.recordDate)
          : null,

        isLatestRecordToday: latestEggRecord
          ? this.toDateString(latestEggRecord.recordDate) === todayStr
          : false,

        latestRecordEggs: latestEggRecord
          ? Number(latestEggRecord.eggCollection?.totalEggs ?? 0)
          : null,

        /*
         * Hen-day production rate:
         *
         * eggs collected that day
         * -----------------------
         * birds present at start of day
         *
         * This is much more meaningful than dividing by today's
         * currentCount when mortality/culling occurred historically.
         */
        latestProductionRatePercent,

        populationAtStartOfProductionDay:
          productionPopulationAtStartOfDay,

        avgEggsPerDay7d,

        totalEggsCollected: totalEggs,

        trayBreakdown:
          totalEggs > 0
            ? {
                fullTrays: totalTrays,
                looseEggs,

                display:
                  looseEggs === 0
                    ? `${totalEggs} eggs = ${totalTrays} ${
                        totalTrays === 1 ? 'tray' : 'trays'
                      }`
                    : `${totalEggs} eggs = ${totalTrays} ${
                        totalTrays === 1 ? 'tray' : 'trays'
                      } + ${looseEggs} loose ${
                        looseEggs === 1 ? 'egg' : 'eggs'
                      }`,
              }
            : null,
      },

      feed: {
        latestRecordDate: latestRecord
          ? this.toDateString(latestRecord.recordDate)
          : null,

        // Always return a number, never a PostgreSQL decimal string.
        latestRecordFeedKg: latestFeedKg,

        totalFeedConsumedKg: totalFeedKg,

        feedPerBirdGramsLatest,
      },

      health: {
        totalMortality,
        totalCulls,
        populationLoss,

        mortalityPercent: this.percentOf(
          totalMortality,
          Number(flock.initialCount),
        ),

        cullingPercent: this.percentOf(
          totalCulls,
          Number(flock.initialCount),
        ),

        survivalRatePercent: this.percentOf(
          Number(flock.initialCount) - populationLoss,
          Number(flock.initialCount),
        ),
      },

      growth: weightStats.latestWeighedRecord
        ? {
            available: true,

            currentAverageWeightKg: Number(
              weightStats.latestWeighedRecord.averageWeightKg,
            ),

            weightGainKg: weightStats.firstWeighedRecord
              ? this.round(
                  Number(
                    weightStats.latestWeighedRecord.averageWeightKg,
                  ) -
                    Number(
                      weightStats.firstWeighedRecord.averageWeightKg,
                    ),
                  3,
                )
              : null,

            firstWeighedOn: weightStats.firstWeighedRecord
              ? this.toDateString(
                  weightStats.firstWeighedRecord.recordDate,
                )
              : null,

            latestWeighedOn: this.toDateString(
              weightStats.latestWeighedRecord.recordDate,
            ),
          }
        : {
            available: false,
            reason: 'No weight records logged yet',
          },

      recordsLogged: Number(stats.recordCount ?? 0),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MORTALITY / CULLING
  // ═══════════════════════════════════════════════════════════════════════

  async getMortalityBreakdown(flockId: string, farmId: string) {
    const flock = await this.flockService.getFlock(flockId, farmId);

    const stats = await this.flockRecordsService.getCumulativeStats(
      flockId,
      farmId,
    );

    const cullingReasons =
      await this.flockRecordsService.getCullingReasonBreakdown(
        flockId,
        farmId,
      );

    const initialCount = Number(flock.initialCount);
    const currentCount = Number(flock.currentCount);

    const totalMortality = Number(stats.totalMortality ?? 0);
    const totalCulls = Number(stats.totalCulls ?? 0);

    return {
      initialCount,
      currentCount,

      totalMortality,
      totalCulls,

      mortalityPercent: this.percentOf(
        totalMortality,
        initialCount,
      ),

      cullingPercent: this.percentOf(
        totalCulls,
        initialCount,
      ),

      cullingReasons,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FEED EFFICIENCY
  // ═══════════════════════════════════════════════════════════════════════

  async getFeedEfficiency(flockId: string, farmId: string) {
    const flock = await this.flockService.getFlock(flockId, farmId);

    const stats = await this.flockRecordsService.getCumulativeStats(
      flockId,
      farmId,
    );

    const weightStats = await this.flockRecordsService.getWeightStats(
      flockId,
      farmId,
    );

    const first = weightStats.firstWeighedRecord;
    const latest = weightStats.latestWeighedRecord;

    const canComputeFcr =
      first &&
      latest &&
      this.asDate(first.recordDate).getTime() !==
        this.asDate(latest.recordDate).getTime();

    if (canComputeFcr) {
      const firstWeight = Number(first.averageWeightKg);
      const latestWeight = Number(latest.averageWeightKg);

      const weightGainPerBirdKg = latestWeight - firstWeight;

      const totalWeightGainKg =
        weightGainPerBirdKg * Number(flock.currentCount);

      const totalFeedKg = Number(stats.totalFeedKg ?? 0);

      if (totalWeightGainKg > 0) {
        return {
          metric: 'estimated_feed_conversion_ratio' as const,

          available: true,

          value: this.round(
            totalFeedKg / totalWeightGainKg,
            2,
          ),

          caveat:
            'Approximate — uses current flock size as a stand-in for the birds present across the whole weighing window. Any mortality or culling in that window means the real FCR is somewhat worse than this figure.',

          basis: {
            totalFeedKg,

            weightGainPerBirdKg: this.round(
              weightGainPerBirdKg,
              3,
            ),

            birdsAssumed: Number(flock.currentCount),

            firstWeighedOn: this.toDateString(first.recordDate),

            latestWeighedOn: this.toDateString(latest.recordDate),
          },
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // LAYER / EGG EFFICIENCY
    // ─────────────────────────────────────────────────────────────────────

    const eggStats = await this.flockRecordsService.getEggStats(
      flockId,
      farmId,
    );

    const totalEggs = Number(eggStats.totalEggs ?? 0);
    const totalFeedKg = Number(stats.totalFeedKg ?? 0);

    if (totalEggs > 0) {
      const dozenCount = totalEggs / 12;

      return {
        metric: 'feed_per_dozen_eggs' as const,

        available: true,

        value: this.round(
          totalFeedKg / dozenCount,
          2,
        ),

        basis: {
          totalFeedKg,
          totalEggs,
          dozensProduced: this.round(dozenCount, 2),
        },
      };
    }

    return {
      metric: null,

      available: false,

      reason:
        'Not enough data yet — need at least two weighed records showing weight gain, or some eggs collected',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EGG PRODUCTION TREND
  //
  // Relevant to layers / kienyeji.
  // ═══════════════════════════════════════════════════════════════════════

  async getEggProductionTrend(
    flockId: string,
    farmId: string,
    days = 7,
  ) {
    const flock = await this.flockService.getFlock(
      flockId,
      farmId,
    );

    const records =
      await this.flockRecordsService.getRecentRecords(
        flockId,
        farmId,
        days,
      );

    const withEggs = records
      .filter((record) => record.eggCollection != null)
      .reverse();

    if (withEggs.length === 0) {
      return {
        available: false,
        reason: 'No egg collections in the selected window',
      };
    }

    const windowStart = this.asDate(
      withEggs[0].recordDate,
    );

    const baseline =
      await this.flockRecordsService.getCumulativeLossBefore(
        flockId,
        farmId,
        windowStart,
      );

    let runningLoss =
      Number(baseline.mortality) +
      Number(baseline.culls);

    const daily = withEggs.map((record) => {
      const populationAtStartOfDay =
        this.calculatePopulationAtStartOfDay(
          Number(flock.initialCount),
          0,
          runningLoss,
        );

      const totalEggs = Number(
        record.eggCollection?.totalEggs ?? 0,
      );

      const productionRatePercent =
        this.calculateProductionRate(
          totalEggs,
          populationAtStartOfDay,
        );

      /*
       * Losses occurring on this day affect the population
       * from the following day onward.
       */
      runningLoss +=
        Number(record.mortalityCount ?? 0) +
        Number(record.cullingCount ?? 0);

      return {
        recordDate: this.toDateString(record.recordDate),

        totalEggs,

        trays: this.round(
          Number(
            record.eggCollection?.totalTrayEquivalent ?? 0,
          ),
          2,
        ),

        populationAtStartOfDay,

        productionRatePercent,
      };
    });

    const avgEggsPerDay =
      daily.reduce(
        (sum, item) => sum + item.totalEggs,
        0,
      ) / daily.length;

    return {
      available: true,

      windowDays: daily.length,

      daily,

      avgEggsPerDay: this.round(
        avgEggsPerDay,
        1,
      ),

      projectedEggsPerWeek: Math.round(
        avgEggsPerDay * 7,
      ),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GROWTH TREND
  //
  // Uses averageWeightKg directly from FlockRecord.
  // ═══════════════════════════════════════════════════════════════════════

  async getGrowthTrend(
    flockId: string,
    farmId: string,
    days = 14,
  ) {
    await this.flockService.getFlock(
      flockId,
      farmId,
    );

    const records =
      await this.flockRecordsService.getRecentRecords(
        flockId,
        farmId,
        days,
      );

    const weighed = records
      .filter(
        (record) => record.growthRecord?.averageWeightKg != null,
      )
      .reverse();

    if (weighed.length === 0) {
      return {
        available: false,
        reason: 'No weight records in the selected window',
      };
    }

    const daily = weighed.map((record, index) => {
      const averageWeightKg = Number(
        record.growthRecord?.averageWeightKg,
      );

      const previous =
        index > 0
          ? weighed[index - 1]
          : null;

      if (!previous) {
        return {
          recordDate: this.toDateString(
            record.recordDate,
          ),

          averageWeightKg,

          dailyGainKg: null,
        };
      }

      const daysSincePrevious = Math.max(
        1,
        Math.round(
          (
            this.asDate(record.recordDate).getTime() -
            this.asDate(previous.recordDate).getTime()
          ) /
            86_400_000,
        ),
      );

      const previousWeightKg = Number(
        previous.growthRecord?.averageWeightKg,
      );

      const gainKg =
        averageWeightKg - previousWeightKg;

      return {
        recordDate: this.toDateString(
          record.recordDate,
        ),

        averageWeightKg,

        dailyGainKg: this.round(
          gainKg / daysSincePrevious,
          3,
        ),
      };
    });

    return {
      available: true,

      windowDays: weighed.length,

      daily,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GROWTH FORECAST
  // ═══════════════════════════════════════════════════════════════════════

  async forecastGrowth(
    flockId: string,
    farmId: string,
    targetWeightKg: number,
  ) {
    if (
      !Number.isFinite(targetWeightKg) ||
      targetWeightKg <= 0
    ) {
      throw new BadRequestException(
        'targetWeightKg must be a positive number',
      );
    }

    await this.flockService.getFlock(
      flockId,
      farmId,
    );

    const records =
      await this.flockRecordsService.getRecentRecords(
        flockId,
        farmId,
        14,
      );

    const weighed = records
      .filter(
        (record) => record.growthRecord?.averageWeightKg != null,
      )
      .reverse();

    if (weighed.length < 2) {
      return {
        available: false,

        reason:
          'Need at least two weighed records to project a growth trend',
      };
    }

    const oldest = weighed[0];
    const newest =
      weighed[weighed.length - 1];

    const daysBetween = Math.max(
      1,
      Math.round(
        (
          this.asDate(
            newest.recordDate,
          ).getTime() -
          this.asDate(
            oldest.recordDate,
          ).getTime()
        ) /
          86_400_000,
      ),
    );

    const oldestWeightKg = Number(
      oldest.growthRecord?.averageWeightKg,
    );

    const newestWeightKg = Number(
      newest.growthRecord?.averageWeightKg,
    );

    const dailyGainKg =
      (newestWeightKg - oldestWeightKg) /
      daysBetween;

    const confidence =
      this.forecastConfidence(
        weighed.length,
      );

    if (dailyGainKg <= 0) {
      return {
        available: false,

        reason:
          'No positive weight gain in recent records — worth checking for a health or feed issue before trusting a forecast',
      };
    }

    const remainingKg =
      targetWeightKg - newestWeightKg;

    if (remainingKg <= 0) {
      return {
        available: true,

        confidence,

        alreadyAtTarget: true,

        currentAvgWeightKg:
          newestWeightKg,

        targetWeightKg,
      };
    }

    const estimatedDaysToTarget =
      Math.ceil(
        remainingKg / dailyGainKg,
      );

    return {
      available: true,

      confidence,

      alreadyAtTarget: false,

      currentAvgWeightKg:
        newestWeightKg,

      targetWeightKg,

      observedDailyGainKg:
        this.round(dailyGainKg, 3),

      estimatedDaysToTarget,

      estimatedReadyDate: new Date(
        Date.now() +
          estimatedDaysToTarget *
            86_400_000,
      ),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE — POPULATION / PRODUCTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Reconstructs how many birds were alive at the START of a particular
   * production day.
   *
   * Important:
   *
   * initialCount
   *   - losses before the day
   *   = population at start of day
   *
   * Losses recorded ON the day are intentionally excluded.
   */
  private calculatePopulationAtStartOfDay(
    initialCount: number,
    mortalityBeforeDay: number,
    cullsBeforeDay: number,
  ): number {
    return Math.max(
      0,
      initialCount -
        mortalityBeforeDay -
        cullsBeforeDay,
    );
  }

  /**
   * Hen-day egg production rate.
   *
   * Example:
   *
   * 285 eggs / 1496 birds * 100
   * = 19.1%
   */
  private calculateProductionRate(
    eggsCollected: number,
    populationAtStartOfDay: number,
  ): number | null {
    if (
      populationAtStartOfDay <= 0
    ) {
      return null;
    }

    return this.round(
      (eggsCollected /
        populationAtStartOfDay) *
        100,
      1,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE — NUMBERS
  // ═══════════════════════════════════════════════════════════════════════

  private percentOf(
    part: number,
    whole: number,
  ): number {
    if (whole <= 0) {
      return 0;
    }

    return this.round(
      (part / whole) * 100,
      1,
    );
  }

  private round(
    value: number,
    decimals = 2,
  ): number {
    const factor = 10 ** decimals;

    return Math.round(
      value * factor,
    ) / factor;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE — DATES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * TypeORM/Postgres may give us either a Date or a string depending on
   * column type, driver configuration, query builder usage, etc.
   *
   * Keep date normalization at the analytics boundary so callers don't
   * have to care about the underlying database representation.
   */
  private asDate(
    value: Date | string,
  ): Date {
    if (value instanceof Date) {
      return value;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `Invalid date value: ${value}`,
      );
    }

    return date;
  }

  /**
   * Returns YYYY-MM-DD without assuming the value is already a Date.
   */
  private toDateString(
    value: Date | string,
  ): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    return value.toISOString().slice(0, 10);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE — FORECAST
  // ═══════════════════════════════════════════════════════════════════════

  private forecastConfidence(
    weighedRecordCount: number,
  ): ForecastConfidence {
    if (weighedRecordCount >= 6) {
      return 'strong';
    }

    if (weighedRecordCount >= 3) {
      return 'moderate';
    }

    return 'low';
  }
}