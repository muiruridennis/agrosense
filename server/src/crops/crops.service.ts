import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCropCycleDto, UpdateCropCycleDto } from './dto/crop-cycle.dto';
import { CropCycle, CropCycleStatus } from './entities/crop-cycle.entity';
import { FarmsService } from '../farms/farms.service';
import { PlotsService } from '../plots/plots.service';

@Injectable()
export class CropCyclesService {
  constructor(
    @InjectRepository(CropCycle)
    private readonly repo: Repository<CropCycle>,
    private readonly farmsService: FarmsService,
    private readonly plotService:PlotsService,
  ) {}

  async create(
    farmId: string,
    plotId: string,
    ownerId: string,
    dto: CreateCropCycleDto,
  ): Promise<CropCycle> {
    // Verify plot belongs to farm and farm belongs to owner
    await this.plotService.findOne(farmId, plotId, ownerId);

    const cycle = this.repo.create({ ...dto, plotId });
    return this.repo.save(cycle);
  }

  async findAll(farmId: string, plotId: string, ownerId: string): Promise<CropCycle[]> {
    await this.farmsService.findOne(farmId, ownerId);
    return this.repo.find({
      where: { plotId },
      order: { plantedAt: 'DESC' },
    });
  }

  async findAllByFarm(farmId: string, ownerId: string): Promise<CropCycle[]> {
    await this.farmsService.findOne(farmId, ownerId);
    return this.repo
      .createQueryBuilder('cycle')
      .innerJoin('cycle.plot', 'plot')
      .where('plot.farmId = :farmId', { farmId })
      .orderBy('cycle.plantedAt', 'DESC')
      .getMany();
  }

  async findActiveCycles(farmId: string): Promise<CropCycle[]> {
    return this.repo
      .createQueryBuilder('cycle')
      .innerJoin('cycle.plot', 'plot')
      .where('plot.farmId = :farmId', { farmId })
      .andWhere('cycle.status = :status', { status: CropCycleStatus.ACTIVE })
      .getMany();
  }

  async findOne(id: string, farmId: string, ownerId: string): Promise<CropCycle> {
    await this.farmsService.findOne(farmId, ownerId);
    const cycle = await this.repo
      .createQueryBuilder('cycle')
      .innerJoin('cycle.plot', 'plot')
      .where('cycle.id = :id', { id })
      .andWhere('plot.farmId = :farmId', { farmId })
      .getOne();
    if (!cycle) throw new NotFoundException(`Crop cycle ${id} not found`);
    return cycle;
  }

  async update(
    id: string,
    farmId: string,
    ownerId: string,
    dto: UpdateCropCycleDto,
  ): Promise<CropCycle> {
    const cycle = await this.findOne(id, farmId, ownerId);
    Object.assign(cycle, dto);
    return this.repo.save(cycle);
  }

  async remove(id: string, farmId: string, ownerId: string): Promise<void> {
    const cycle = await this.findOne(id, farmId, ownerId);
    await this.repo.remove(cycle);
  }

  async getSummaryByFarm(farmId: string, ownerId: string) {
    await this.farmsService.findOne(farmId, ownerId);
    return this.repo
      .createQueryBuilder('cycle')
      .innerJoin('cycle.plot', 'plot')
      .select('cycle.cropType', 'cropType')
      .addSelect('cycle.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(cycle.yieldKg)', 'totalYieldKg')
      .addSelect('AVG(cycle.yieldKg)', 'avgYieldKg')
      .where('plot.farmId = :farmId', { farmId })
      .groupBy('cycle.cropType')
      .addGroupBy('cycle.status')
      .getRawMany();
  }
}