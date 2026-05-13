import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditProfile } from './entities/credit-profile.entity';

@Injectable()
export class CreditProfileService {
  constructor(
    @InjectRepository(CreditProfile)
    private readonly repo: Repository<CreditProfile>,
  ) {}

  async create(payload: Partial<CreditProfile>) {
    const profile = this.repo.create(payload);
    return this.repo.save(profile);
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const profile = await this.repo.findOneBy({ id });
    if (!profile) {
      throw new NotFoundException(`Credit profile ${id} was not found`);
    }
    return profile;
  }

  async update(id: string, payload: Partial<CreditProfile>) {
    const existing = await this.findOne(id);
    const updated = this.repo.create({ ...existing, ...payload });
    return this.repo.save(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { id, deleted: true };
  }

  async calculateCreditScore(profileId: string) {
    const profile = await this.findOne(profileId);
    const revenue = Number(profile.annualRevenue ?? 0);
    const repayment = Number(profile.repaymentConsistency ?? 0);
    const score = Math.max(
      300,
      Math.min(850, 300 + revenue * 0.2 + repayment * 5),
    );
    return { profileId, score: Math.round(score), calculatedAt: new Date() };
  }

  async evaluateLoanReadiness(profileId: string) {
    const score = await this.calculateCreditScore(profileId);
    return {
      ...score,
      decision: score.score >= 620 ? 'eligible' : 'review_required',
    };
  }
}
