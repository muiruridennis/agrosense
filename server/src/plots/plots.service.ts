import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plot } from './entities/plot.entity';
import { CreatePlotDto, UpdatePlotDto } from './dto/plot.dto';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class PlotsService {
  constructor(
    @InjectRepository(Plot)
    private readonly plotRepo: Repository<Plot>,
    private readonly farmsService: FarmsService,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(
    farmId: string,
    ownerId: string,
    dto: CreatePlotDto,
  ): Promise<Plot> {
    // Verify farm exists and belongs to this owner before creating a plot
    await this.farmsService.findOne(farmId, ownerId);

    const plot = this.plotRepo.create({ ...dto, farmId });
    return this.plotRepo.save(plot);
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async findAll(farmId: string, ownerId: string): Promise<Plot[]> {
    await this.farmsService.findOne(farmId, ownerId);

    return this.plotRepo.find({
      where: { farmId },
      relations: ['cropCycles'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    farmId: string,
    plotId: string,
    ownerId: string,
  ): Promise<Plot> {
    await this.farmsService.findOne(farmId, ownerId);

    const plot = await this.plotRepo.findOne({
      where: { id: plotId, farmId },
      relations: ['cropCycles'],
    });

    if (!plot) throw new NotFoundException(`Plot ${plotId} not found`);
    return plot;
  }

  /**
   * Internal lookup — skips ownership check.
   * Used by CropCyclesService and DiseaseEngineService which have
   * already verified ownership upstream.
   */
  async findById(plotId: string): Promise<Plot> {
    const plot = await this.plotRepo.findOne({
      where: { id: plotId },
      relations: ['cropCycles'],
    });
    if (!plot) throw new NotFoundException(`Plot ${plotId} not found`);
    return plot;
  }

  async findByFarm(farmId: string): Promise<Plot[]> {
    return this.plotRepo.find({
      where: { farmId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(
    farmId: string,
    plotId: string,
    ownerId: string,
    dto: UpdatePlotDto,
  ): Promise<Plot> {
    const plot = await this.findOne(farmId, plotId, ownerId);
    Object.assign(plot, dto);
    return this.plotRepo.save(plot);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(
    farmId: string,
    plotId: string,
    ownerId: string,
  ): Promise<void> {
    const plot = await this.findOne(farmId, plotId, ownerId);
    await this.plotRepo.remove(plot);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  /**
   * Returns plot count and total area per soil type for a farm.
   * Useful for the farm dashboard and agronomist reports.
   */
  async getSoilSummary(farmId: string, ownerId: string) {
    await this.farmsService.findOne(farmId, ownerId);

    return this.plotRepo
      .createQueryBuilder('plot')
      .select('plot.soilType', 'soilType')
      .addSelect('COUNT(*)', 'plotCount')
      .addSelect('SUM(plot.areaHectares)', 'totalAreaHa')
      .where('plot.farmId = :farmId', { farmId })
      .groupBy('plot.soilType')
      .getRawMany();
  }

  /**
   * Returns each plot with its active crop cycle count.
   * Used by the advisory engine to quickly understand what's growing where.
   */
  async getPlotActivitySummary(farmId: string, ownerId: string) {
    await this.farmsService.findOne(farmId, ownerId);

    return this.plotRepo
      .createQueryBuilder('plot')
      .leftJoin('plot.cropCycles', 'cycle', "cycle.status = 'active'")
      .select('plot.id', 'plotId')
      .addSelect('plot.name', 'name')
      .addSelect('plot.areaHectares', 'areaHa')
      .addSelect('plot.soilType', 'soilType')
      .addSelect('COUNT(cycle.id)', 'activeCycleCount')
      .where('plot.farmId = :farmId', { farmId })
      .groupBy('plot.id')
      .orderBy('plot.createdAt', 'DESC')
      .getRawMany();
  }

  /**
   * Total cultivated area across all plots for a farm.
   */
  async getTotalArea(farmId: string): Promise<number> {
    const result = await this.plotRepo
      .createQueryBuilder('plot')
      .select('SUM(plot.areaHectares)', 'total')
      .where('plot.farmId = :farmId', { farmId })
      .getRawOne();

    return Number(result?.total ?? 0);
  }
}