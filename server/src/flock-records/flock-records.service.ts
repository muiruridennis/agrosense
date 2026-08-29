import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { FlockRecord } from './entities/flock-record.entity';
import { EggCollection } from './entities/egg-collection.entity';
import { GrowthRecord } from './entities/growth-record.entity';

import { CreateFlockRecordDto } from './dtos/create-flock-record.dto';
import { UpdateFlockRecordDto } from './dtos/update-flock-record.dto';
import { resolveEggCount } from './utils/eggQuantity.util';
import { resolveAverageWeightKg } from './utils/growth-weight.util';

import { FlockService } from '../flock/flock.service';
import { Flock } from '../flock/entities/flock.entity';
import {
  FlockCapability,
  FlockStatus,
  FLOCK_CAPABILITIES,
} from '../flock/enums';

@Injectable()
export class FlockRecordsService {
  constructor(
    @InjectRepository(FlockRecord)
    private readonly recordRepo: Repository<FlockRecord>,

    private readonly flockService: FlockService,

    private readonly dataSource: DataSource,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════

  async createRecord(
    flockId: string,
    farmId: string,
    dto: CreateFlockRecordDto,
  ): Promise<FlockRecord> {
    const flock = await this.flockService.getFlock(flockId, farmId);

    this.assertFlockCanReceiveRecords(flock);
    this.validateProductionData(flock, dto);

    const mortalityCount = dto.mortalityCount ?? 0;
    const cullingCount = dto.cullingCount ?? 0;

    this.validatePopulationChange(flock, mortalityCount, cullingCount);
    this.validateCulling(cullingCount, dto.cullingReason);

    // Resolved before opening the transaction — ambiguous input should
    // fail fast, not after we've already started writing.
    const morningEggs = resolveEggCount(dto.eggCollection?.morning);
    const afternoonEggs = resolveEggCount(dto.eggCollection?.afternoon);
    const eveningEggs = resolveEggCount(dto.eggCollection?.evening);

    let resolvedWeightKg: number | null = null;
    if (dto.growthRecord) {
      resolvedWeightKg = resolveAverageWeightKg(dto.growthRecord);
      if (resolvedWeightKg === null) {
        throw new BadRequestException(
          'averageWeightKg or totalSampleWeightKg + sampleSize is required to record growth data',
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const recordRepo = manager.getRepository(FlockRecord);

      const existing = await recordRepo.findOne({
        where: {
          flockId,
          recordDate: new Date(dto.recordDate),
        },
      });

      if (existing) {
        throw new ConflictException(
          `A flock record already exists for ${dto.recordDate}`,
        );
      }

      // ─────────────────────────────────────────────────────────────────
      // EGG COLLECTION (layers / kienyeji)
      // ─────────────────────────────────────────────────────────────────

      const eggCollection = dto.eggCollection
        ? Object.assign(new EggCollection(), {
            morningEggs,
            afternoonEggs,
            eveningEggs,
          })
        : null;

      // ─────────────────────────────────────────────────────────────────
      // GROWTH RECORD (layers / broilers / kienyeji)
      // ─────────────────────────────────────────────────────────────────

      const growthRecord = dto.growthRecord
        ? Object.assign(new GrowthRecord(), {
            averageWeightKg: resolvedWeightKg,
            sampleSize: dto.growthRecord.sampleSize ?? null,
            notes: dto.growthRecord.notes?.trim() || null,
          })
        : null;

      // ─────────────────────────────────────────────────────────────────
      // RECORD
      // ─────────────────────────────────────────────────────────────────

      const record = recordRepo.create({
        flockId,

        recordDate: new Date(`${dto.recordDate}T00:00:00.000Z`),

        mortalityCount,
        cullingCount,

        cullingReason: dto.cullingReason?.trim() || null,

        feedConsumedKg: dto.feedConsumedKg,

        feedType: dto.feedType?.trim() || null,

        waterConsumedLitres: dto.waterConsumedLitres ?? null,

        sickCount: dto.sickCount ?? 0,

        healthNotes: dto.healthNotes?.trim() || null,

        houseTemperatureCelsius: dto.houseTemperatureCelsius ?? null,

        notes: dto.notes?.trim() || null,

        eggCollection,

        growthRecord,
      });

      const savedRecord = await recordRepo.save(record);

      // ─────────────────────────────────────────────────────────────────
      // UPDATE FLOCK POPULATION
      // ─────────────────────────────────────────────────────────────────

      const populationReduction = mortalityCount + cullingCount;

      if (populationReduction > 0) {
        await this.flockService.adjustPopulation(
          flockId,
          -populationReduction,
          manager,
        );
      }

      return savedRecord;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READ MANY
  // ═══════════════════════════════════════════════════════════════════════

  async getRecords(flockId: string, farmId: string): Promise<FlockRecord[]> {
    await this.flockService.getFlock(flockId, farmId);

    return this.recordRepo.find({
      where: {
        flockId,
      },
      order: {
        recordDate: 'DESC',
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READ ONE
  // ═══════════════════════════════════════════════════════════════════════

  async getRecord(recordId: string, flockId: string): Promise<FlockRecord> {
    const record = await this.recordRepo.findOne({
      where: {
        id: recordId,
      },
      relations: {
        flock: {
          house: true,
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Flock record ${recordId} not found`);
    }

    if (record.flock.id !== flockId) {
      throw new ForbiddenException(
        'This flock record does not belong to the specified flock',
      );
    }

    return record;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════

  async updateRecord(
    recordId: string,
    flockId: string,
    farmId: string,
    dto: UpdateFlockRecordDto,
  ): Promise<FlockRecord> {
    const existing = await this.getRecord(recordId, flockId);

    const flock = await this.flockService.getFlock(existing.flockId, farmId);

    this.assertFlockCanReceiveRecords(flock);
    this.validateProductionData(flock, dto);

    // ─────────────────────────────────────────────────────────────────────
    // POPULATION
    // ─────────────────────────────────────────────────────────────────────

    const oldPopulationReduction =
      existing.mortalityCount + existing.cullingCount;

    const newMortalityCount = dto.mortalityCount ?? existing.mortalityCount;

    const newCullingCount = dto.cullingCount ?? existing.cullingCount;

    const newPopulationReduction = newMortalityCount + newCullingCount;

    this.validateCulling(
      newCullingCount,
      dto.cullingReason ?? existing.cullingReason ?? undefined,
    );

    const populationDelta = newPopulationReduction - oldPopulationReduction;

    if (populationDelta > 0 && populationDelta > flock.currentCount) {
      throw new BadRequestException(
        'Population change would reduce the flock below zero',
      );
    }

    // Fail-fast resolution, same principle as createRecord — only for
    // sessions/fields the caller actually touched.
    const morningEggs =
      dto.eggCollection?.morning !== undefined
        ? resolveEggCount(dto.eggCollection.morning)
        : undefined;
    const afternoonEggs =
      dto.eggCollection?.afternoon !== undefined
        ? resolveEggCount(dto.eggCollection.afternoon)
        : undefined;
    const eveningEggs =
      dto.eggCollection?.evening !== undefined
        ? resolveEggCount(dto.eggCollection.evening)
        : undefined;

    // null = caller sent growthRecord but only touched notes/sampleSize,
    // not a weight — valid only when a growth record already exists.
    const resolvedWeightKg = dto.growthRecord
      ? resolveAverageWeightKg(dto.growthRecord)
      : undefined;

    if (
      dto.growthRecord &&
      resolvedWeightKg === null &&
      !existing.growthRecord
    ) {
      throw new BadRequestException(
        'averageWeightKg or totalSampleWeightKg + sampleSize is required to create a growth record',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const recordRepo = manager.getRepository(FlockRecord);

      const record = await recordRepo.findOne({
        where: {
          id: recordId,
        },
        relations: {
          eggCollection: true,
          growthRecord: true,
        },
      });

      if (!record) {
        throw new NotFoundException(`Flock record ${recordId} not found`);
      }

      // ─────────────────────────────────────────────────────────────────
      // DATE
      // ─────────────────────────────────────────────────────────────────

      if (dto.recordDate !== undefined) {
        const currentDate = this.toDateString(record.recordDate);

        if (dto.recordDate !== currentDate) {
          const duplicate = await recordRepo.findOne({
            where: {
              flockId: record.flockId,
              recordDate: new Date(`${dto.recordDate}T00:00:00.000Z`),
            },
          });

          if (duplicate) {
            throw new ConflictException(
              `A flock record already exists for ${dto.recordDate}`,
            );
          }

          record.recordDate = new Date(`${dto.recordDate}T00:00:00.000Z`);
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // POPULATION
      // ─────────────────────────────────────────────────────────────────

      record.mortalityCount = newMortalityCount;
      record.cullingCount = newCullingCount;

      if (dto.cullingReason !== undefined) {
        record.cullingReason = dto.cullingReason.trim() || null;
      }

      // ─────────────────────────────────────────────────────────────────
      // FEED
      // ─────────────────────────────────────────────────────────────────

      if (dto.feedConsumedKg !== undefined) {
        record.feedConsumedKg = dto.feedConsumedKg;
      }

      if (dto.feedType !== undefined) {
        record.feedType = dto.feedType.trim() || null;
      }

      // ─────────────────────────────────────────────────────────────────
      // WATER
      // ─────────────────────────────────────────────────────────────────

      if (dto.waterConsumedLitres !== undefined) {
        record.waterConsumedLitres = dto.waterConsumedLitres;
      }

      // ─────────────────────────────────────────────────────────────────
      // EGG COLLECTION
      // ─────────────────────────────────────────────────────────────────

      if (dto.eggCollection) {
        if (!record.eggCollection) {
          record.eggCollection = new EggCollection();
        }
        if (morningEggs !== undefined)
          record.eggCollection.morningEggs = morningEggs;
        if (afternoonEggs !== undefined)
          record.eggCollection.afternoonEggs = afternoonEggs;
        if (eveningEggs !== undefined)
          record.eggCollection.eveningEggs = eveningEggs;
      }

      // ─────────────────────────────────────────────────────────────────
      // GROWTH RECORD
      // ─────────────────────────────────────────────────────────────────

      if (dto.growthRecord) {
        if (!record.growthRecord) {
          // resolvedWeightKg can't be null here — guarded above, before
          // the transaction opened.
          record.growthRecord = Object.assign(new GrowthRecord(), {
            averageWeightKg: resolvedWeightKg,
          });
        } else if (
          resolvedWeightKg !== null &&
          resolvedWeightKg !== undefined
        ) {
          record.growthRecord.averageWeightKg = resolvedWeightKg;
        }

        if (dto.growthRecord.sampleSize !== undefined) {
          record.growthRecord.sampleSize = dto.growthRecord.sampleSize;
        }
        if (dto.growthRecord.notes !== undefined) {
          record.growthRecord.notes = dto.growthRecord.notes.trim() || null;
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // HEALTH
      // ─────────────────────────────────────────────────────────────────

      if (dto.sickCount !== undefined) {
        record.sickCount = dto.sickCount;
      }

      if (dto.healthNotes !== undefined) {
        record.healthNotes = dto.healthNotes.trim() || null;
      }

      // ─────────────────────────────────────────────────────────────────
      // ENVIRONMENT
      // ─────────────────────────────────────────────────────────────────

      if (dto.houseTemperatureCelsius !== undefined) {
        record.houseTemperatureCelsius = dto.houseTemperatureCelsius;
      }

      // ─────────────────────────────────────────────────────────────────
      // NOTES
      // ─────────────────────────────────────────────────────────────────

      if (dto.notes !== undefined) {
        record.notes = dto.notes.trim() || null;
      }

      // ─────────────────────────────────────────────────────────────────
      // SAVE + UPDATE FLOCK POPULATION
      // ─────────────────────────────────────────────────────────────────

      const savedRecord = await recordRepo.save(record);

      if (populationDelta !== 0) {
        await this.flockService.adjustPopulation(
          record.flockId,
          -populationDelta,
          manager,
        );
      }

      return savedRecord;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════════════════

  async deleteRecord(
    recordId: string,
    flockId: string,
    farmId: string,
  ): Promise<{ message: string }> {
    const existing = await this.getRecord(recordId, flockId);

    const flock = await this.flockService.getFlock(existing.flockId, farmId);

    this.assertFlockCanReceiveRecords(flock);

    const populationReduction = existing.mortalityCount + existing.cullingCount;

    await this.dataSource.transaction(async (manager) => {
      const recordRepo = manager.getRepository(FlockRecord);

      const record = await recordRepo.findOne({
        where: {
          id: recordId,
        },
      });

      if (!record) {
        throw new NotFoundException(`Flock record ${recordId} not found`);
      }

      await recordRepo.remove(record);

      if (populationReduction > 0) {
        await this.flockService.adjustPopulation(
          record.flockId,
          populationReduction,
          manager,
        );
      }
    });

    return {
      message: `Flock record ${recordId} deleted successfully`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS SUPPORT — read-only, called by FlockAnalyticsService only.
  // getCumulativeStats returns COMMON stats only (mortality, culls, feed,
  // record count). Egg and weight stats are per-dimension methods, not
  // bolted onto the common one — a layer-only field doesn't belong in a
  // method every flock type calls.
  // ═══════════════════════════════════════════════════════════════════════

  async getCumulativeStats(
    flockId: string,
    farmId: string,
  ): Promise<{
    totalMortality: number;
    totalCulls: number;
    totalFeedKg: number;
    recordCount: number;
  }> {
    await this.flockService.getFlock(flockId, farmId);

    const result = await this.recordRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.mortalityCount), 0)', 'totalMortality')
      .addSelect('COALESCE(SUM(r.cullingCount), 0)', 'totalCulls')
      .addSelect('COALESCE(SUM(r.feedConsumedKg), 0)', 'totalFeedKg')
      .addSelect('COUNT(*)', 'recordCount')
      .where('r.flockId = :flockId', { flockId })
      .getRawOne();

    return {
      totalMortality: parseInt(result.totalMortality, 10),
      totalCulls: parseInt(result.totalCulls, 10),
      totalFeedKg: parseFloat(result.totalFeedKg),
      recordCount: parseInt(result.recordCount, 10),
    };
  }

  async getEggStats(
    flockId: string,
    farmId: string,
  ): Promise<{ totalEggs: number }> {
    await this.flockService.getFlock(flockId, farmId);

    const result = await this.recordRepo
      .createQueryBuilder('r')
      .leftJoin('r.eggCollection', 'egg')
      .select('COALESCE(SUM(egg.morningEggs), 0)', 'morning')
      .addSelect('COALESCE(SUM(egg.afternoonEggs), 0)', 'afternoon')
      .addSelect('COALESCE(SUM(egg.eveningEggs), 0)', 'evening')
      .where('r.flockId = :flockId', { flockId })
      .getRawOne();

    return {
      totalEggs:
        parseInt(result.morning, 10) +
        parseInt(result.afternoon, 10) +
        parseInt(result.evening, 10),
    };
  }

  async getWeightStats(
    flockId: string,
    farmId: string,
  ): Promise<{
    firstWeighedRecord: { recordDate: Date; averageWeightKg: number } | null;
    latestWeighedRecord: { recordDate: Date; averageWeightKg: number } | null;
  }> {
    await this.flockService.getFlock(flockId, farmId);

    const firstWeighed = await this.recordRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.growthRecord', 'growth')
      .where('r.flockId = :flockId', { flockId })
      .orderBy('r.recordDate', 'ASC')
      .getOne();

    const latestWeighed = await this.recordRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.growthRecord', 'growth')
      .where('r.flockId = :flockId', { flockId })
      .orderBy('r.recordDate', 'DESC')
      .getOne();

    return {
      firstWeighedRecord: firstWeighed?.growthRecord
        ? {
            recordDate: firstWeighed.recordDate,
            averageWeightKg: firstWeighed.growthRecord.averageWeightKg,
          }
        : null,
      latestWeighedRecord: latestWeighed?.growthRecord
        ? {
            recordDate: latestWeighed.recordDate,
            averageWeightKg: latestWeighed.growthRecord.averageWeightKg,
          }
        : null,
    };
  }

  async getCullingReasonBreakdown(
    flockId: string,
    farmId: string,
  ): Promise<{ reason: string; count: number }[]> {
    await this.flockService.getFlock(flockId, farmId);

    const rows = await this.recordRepo
      .createQueryBuilder('r')
      .select("COALESCE(r.cullingReason, 'unspecified')", 'reason')
      .addSelect('SUM(r.cullingCount)', 'count')
      .where('r.flockId = :flockId', { flockId })
      .andWhere('r.cullingCount > 0')
      .groupBy('r.cullingReason')
      .getRawMany();

    return rows.map((row) => ({
      reason: row.reason,
      count: parseInt(row.count, 10),
    }));
  }

  async getRecentRecords(
    flockId: string,
    farmId: string,
    limit = 14,
  ): Promise<FlockRecord[]> {
    await this.flockService.getFlock(flockId, farmId);

    return this.recordRepo.find({
      where: { flockId },
      order: { recordDate: 'DESC' },
      take: limit,
    });
  }

  async getCumulativeLossBefore(
    flockId: string,
    farmId: string,
    beforeDate: Date,
  ): Promise<{ mortality: number; culls: number }> {
    await this.flockService.getFlock(flockId, farmId);

    const result = await this.recordRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.mortalityCount), 0)', 'mortality')
      .addSelect('COALESCE(SUM(r.cullingCount), 0)', 'culls')
      .where('r.flockId = :flockId', { flockId })
      .andWhere('r.recordDate < :beforeDate', { beforeDate })
      .getRawOne();

    return {
      mortality: parseInt(result.mortality, 10),
      culls: parseInt(result.culls, 10),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  private toDateString(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private assertFlockCanReceiveRecords(flock: Flock): void {
    if (flock.status === FlockStatus.CLOSED) {
      throw new ConflictException(
        'A closed flock cannot receive production records',
      );
    }
  }

  private validatePopulationChange(
    flock: Flock,
    mortalityCount: number,
    cullingCount: number,
  ): void {
    const reduction = mortalityCount + cullingCount;

    if (reduction > flock.currentCount) {
      throw new BadRequestException(
        `Population reduction (${reduction}) cannot exceed the flock's current population (${flock.currentCount})`,
      );
    }
  }

  private validateCulling(cullingCount: number, cullingReason?: string): void {
    if (cullingCount > 0 && !cullingReason?.trim()) {
      throw new BadRequestException(
        'Culling reason is required when culling birds',
      );
    }

    if (cullingCount === 0 && cullingReason?.trim()) {
      throw new BadRequestException(
        'Culling reason cannot be provided when culling count is zero',
      );
    }
  }

  /**
   * Capability-based, not type-based — this is what actually fixes the
   * Kienyeji problem. A flock's type determines which capabilities apply
   * (FLOCK_CAPABILITIES map in flock/enums), and this only checks whether
   * the submitted data matches those capabilities. BREEDERS currently has
   * an empty capability list, so any production data submitted for a
   * breeder flock is rejected until that's defined.
   */
  private validateProductionData(
    flock: Flock,
    dto: CreateFlockRecordDto | UpdateFlockRecordDto,
  ): void {
    const capabilities = FLOCK_CAPABILITIES[flock.type];

    const hasEggData = dto.eggCollection !== undefined;
    const hasGrowthData = dto.growthRecord !== undefined;

    if (hasEggData && !capabilities.includes(FlockCapability.EGG_PRODUCTION)) {
      throw new BadRequestException(
        `Egg collection cannot be recorded for a ${flock.type} flock`,
      );
    }

    if (
      hasGrowthData &&
      !capabilities.includes(FlockCapability.GROWTH_TRACKING)
    ) {
      throw new BadRequestException(
        `Growth data cannot be recorded for a ${flock.type} flock`,
      );
    }
  }
}
