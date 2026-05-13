import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FlockOutbreak } from '../entities/flock-outbreak.entity';
import { HealthEvent, HealthEventStatus } from '../entities/health-event.entity';
import { HealthOrchestratorService } from './health-orchestrator.service';
import { CreateFlockOutbreakDto } from '../dto/flock-outbreak.dto';



@Injectable()
export class FlockOutbreakService {
  private readonly logger = new Logger(FlockOutbreakService.name);

  constructor(
    @InjectRepository(FlockOutbreak)
    private readonly outbreakRepo: Repository<FlockOutbreak>,
    @InjectRepository(HealthEvent)
    private readonly healthEventRepo: Repository<HealthEvent>,
    private readonly healthOrchestrator: HealthOrchestratorService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  async recordOutbreak(dto: CreateFlockOutbreakDto): Promise<FlockOutbreak> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Calculate mortality rate
      const mortalityRate = dto.totalBirds > 0
        ? (dto.mortalityCount || 0) / dto.totalBirds * 100
        : 0;

      const outbreak = this.outbreakRepo.create({
        ...dto,
        mortalityRate,
        status: HealthEventStatus.REPORTED,  
      });

      const savedOutbreak = await queryRunner.manager.save(outbreak);

      // Emit outbreak event for alerting
      this.eventEmitter.emit('flock.outbreak.reported', {
        outbreakId: savedOutbreak.id,
        farmId: dto.farmId,
        flockId: dto.flockId,
        condition: dto.condition,
        severity: dto.severity,
        affectedCount: dto.affectedCount,
        mortalityCount: dto.mortalityCount,
      });

      await queryRunner.commitTransaction();

      this.logger.log(
        `Flock outbreak recorded for flock ${dto.flockId}: ${dto.condition}`,
      );

      return savedOutbreak;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to record outbreak: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async resolveOutbreak(
    outbreakId: string,
    resolutionNotes: string,
  ): Promise<FlockOutbreak> {
    const outbreak = await this.outbreakRepo.findOne({
      where: { id: outbreakId },
    });

    if (!outbreak) {
      throw new Error(`Outbreak ${outbreakId} not found`);
    }

    outbreak.status = HealthEventStatus.RESOLVED;
    outbreak.resolvedAt = new Date();
    outbreak.notes = resolutionNotes;

    return this.outbreakRepo.save(outbreak);
  }

  async getActiveOutbreaks(farmId: string): Promise<FlockOutbreak[]> {
    return this.outbreakRepo.find({
      where: {
        farmId,
        status: HealthEventStatus.REPORTED,
      },
      order: { startedAt: 'DESC' },
    });
  }
}