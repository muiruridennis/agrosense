import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FeatureFlag } from './entities/feature-flag.entity';
import { CreateFeatureFlagDto } from './dtos/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dtos/update-feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagRepository: Repository<FeatureFlag>,
  ) {}

  async create(dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    const exists = await this.featureFlagRepository.findOne({
      where: { key: dto.key },
    });

    if (exists) {
      throw new ConflictException(`Feature flag '${dto.key}' already exists`);
    }

    const flag = this.featureFlagRepository.create({
      ...dto,
      description: dto.description ?? null,
      allowedFarmIds: dto.allowedFarmIds ?? null,
      allowedUserIds: dto.allowedUserIds ?? null,
    });

    return this.featureFlagRepository.save(flag);
  }

  async findAll(): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      order: {
        key: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findOne({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag '${id}' not found`);
    }

    return flag;
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    return this.featureFlagRepository.findOne({
      where: { key },
    });
  }

  async update(id: string, dto: UpdateFeatureFlagDto): Promise<FeatureFlag> {
    const flag = await this.findOne(id);

    Object.assign(flag, dto);

    return this.featureFlagRepository.save(flag);
  }

  async remove(id: string): Promise<void> {
    const flag = await this.findOne(id);

    await this.featureFlagRepository.remove(flag);
  }

  /**
   * Determines whether a feature is enabled.
   *
   * Rules:
   * 1. Flag must exist
   * 2. Flag must be enabled
   * 3. If allowedUserIds is populated, user must be included
   * 4. If allowedFarmIds is populated, farm must be included
   */
  async isEnabled(
    featureFlagKey: string,
    options?: {
      userId?: string;
      farmId?: string;
    },
  ): Promise<boolean> {
    const flag = await this.findByKey(featureFlagKey);

    if (!flag || !flag.isEnabled) {
      return false;
    }

    if (
      flag.allowedUserIds?.length &&
      !flag.allowedUserIds.includes(options?.userId ?? '')
    ) {
      return false;
    }

    if (
      flag.allowedFarmIds?.length &&
      !flag.allowedFarmIds.includes(options?.farmId ?? '')
    ) {
      return false;
    }

    return true;
  }
}
