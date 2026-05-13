import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateRecordDto,
  RecordsFilterDto,
  UpdateRecordDto,
} from './dto/record.dto';
import { FarmRecord, RecordType } from './entities/farm-record.entity';
import { FarmsService } from '../farms/farms.service';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(FarmRecord)
    private readonly repo: Repository<FarmRecord>,
    private readonly farmsService: FarmsService,
  ) {}

  async create(
    farmId: string,
    ownerId: string,
    dto: CreateRecordDto,
  ): Promise<FarmRecord> {
    await this.farmsService.findOne(farmId, ownerId);

    // Idempotency: if clientId already exists, return existing record
    if (dto.clientId) {
      const existing = await this.repo.findOne({
        where: { clientId: dto.clientId },
      });
      if (existing) return existing;
    }

    const record = this.repo.create({ ...dto, farmId });
    return this.repo.save(record);
  }

  async findAll(
    farmId: string,
    ownerId: string,
    filter: RecordsFilterDto,
  ): Promise<PaginatedResult<FarmRecord>> {
    await this.farmsService.findOne(farmId, ownerId);

    const qb = this.repo
      .createQueryBuilder('record')
      .where('record.farmId = :farmId', { farmId })
      .andWhere('record.isDeleted = :isDeleted', { isDeleted: false }) // CRITICAL: Exclude soft-deleted records
      .orderBy('record.recordedAt', 'DESC')
      .addOrderBy('record.createdAt', 'DESC');

    if (filter.recordType) {
      qb.andWhere('record.recordType = :type', { type: filter.recordType });
    }
    if (filter.category) {
      qb.andWhere('record.category = :cat', { cat: filter.category });
    }
    if (filter.fromDate) {
      qb.andWhere('record.recordedAt >= :from', { from: filter.fromDate });
    }
    if (filter.toDate) {
      qb.andWhere('record.recordedAt <= :to', { to: filter.toDate });
    }
    if (filter.cursor) {
      qb.andWhere('record.createdAt < :cursor', {
        cursor: new Date(Buffer.from(filter.cursor, 'base64').toString()),
      });
    }

    const data = await qb.take(filter.limit + 1).getMany();
    const hasMore = data.length > filter.limit;
    const items = hasMore ? data.slice(0, filter.limit) : data;
    const nextCursor =
      hasMore && items.length > 0
        ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString(
            'base64',
          )
        : null;

    return { data: items, meta: { limit: filter.limit, nextCursor, hasMore } };
  }

  async findOne(
    id: string,
    farmId: string,
    ownerId: string,
  ): Promise<FarmRecord> {
    await this.farmsService.findOne(farmId, ownerId);
    const record = await this.repo.findOne({
      where: { id, farmId, isDeleted: false },
    }); // CRITICAL: Exclude soft-deleted records
    if (!record) throw new NotFoundException(`Record ${id} not found`);
    return record;
  }

  async update(
    id: string,
    farmId: string,
    ownerId: string,
    dto: UpdateRecordDto,
  ): Promise<FarmRecord> {
    const record = await this.findOne(id, farmId, ownerId);
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async remove(id: string, farmId: string, ownerId: string): Promise<void> {
    const record = await this.findOne(id, farmId, ownerId);
    record.isDeleted = true; // Soft delete for audit trails
    record.deletedAt = new Date();
    await this.repo.save(record);
  }

  async getSeasonSummary(
    farmId: string,
    ownerId: string,
    fromDate: string,
    toDate: string,
  ) {
    await this.farmsService.findOne(farmId, ownerId);

    const rows = await this.repo
      .createQueryBuilder('record')
      .select('record.recordType', 'recordType')
      .addSelect('record.category', 'category')
      .addSelect('SUM(record.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('record.farmId = :farmId', { farmId })
      .andWhere('record.isDeleted = :isDeleted', { isDeleted: false }) // CRITICAL: Exclude soft-deleted records
      .andWhere('record.recordedAt BETWEEN :from AND :to', {
        from: fromDate,
        to: toDate,
      })
      .groupBy('record.recordType')
      .addGroupBy('record.category')
      .getRawMany();

    const income = rows
      .filter(
        (r) =>
          r.recordType === RecordType.INCOME ||
          r.recordType === RecordType.HARVEST,
      )
      .reduce((sum, r) => sum + Number(r.total), 0);

    const expenses = rows
      .filter(
        (r) =>
          r.recordType !== RecordType.INCOME &&
          r.recordType !== RecordType.HARVEST,
      )
      .reduce((sum, r) => sum + Number(r.total), 0);

    return {
      fromDate,
      toDate,
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
      breakdown: rows.map((r) => ({
        ...r,
        total: Number(r.total),
        count: Number(r.count),
      })),
    };
  }
}
