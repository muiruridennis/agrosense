import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly repo: Repository<Alert>,
  ) {}

  async create(payload: Partial<Alert>) {
    const alert = this.repo.create(payload);
    return this.repo.save(alert);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const alert = await this.repo.findOneBy({ id });
    if (!alert) {
      throw new NotFoundException(`Alert ${id} was not found`);
    }
    return alert;
  }

  async update(id: string, payload: Partial<Alert>) {
    const existing = await this.findOne(id);
    const updated = this.repo.create({ ...existing, ...payload });
    return this.repo.save(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { id, deleted: true };
  }

  async triggerAlert(
    source: string,
    severity: 'low' | 'medium' | 'high',
    message: string,
  ) {
    return this.create({
      source,
      severity,
      message,
      status: 'active',
      triggeredAt: new Date(),
    });
  }

  async listActiveAlerts() {
    return (await this.findAll()).filter((alert) => alert.status === 'active');
  }
}
