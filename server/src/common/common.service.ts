import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseEntity } from './entities/base.entity';

@Injectable()
export class CommonService {
  constructor(
    @InjectRepository(BaseEntity)
    private readonly repo: Repository<BaseEntity>,
  ) {}

  async create(payload: Partial<BaseEntity>) {
    const metadata = this.repo.create(payload);
    return this.repo.save(metadata);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const item = await this.repo.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Common entry ${id} was not found`);
    }
    return item;
  }

  async update(id: string, payload: Partial<BaseEntity>) {
    const existing = await this.findOne(id);
    const updated = this.repo.create({ ...existing, ...payload });
    return this.repo.save(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { id, deleted: true };
  }

  buildAuditMetadata(actorId: string, action: string) {
    return {
      actorId,
      action,
      performedAt: new Date(),
    };
  }

  validatePagination(page: number, limit: number) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 25;
    return { page: safePage, limit: safeLimit };
  }
}
