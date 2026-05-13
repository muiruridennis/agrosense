// health-event/services/health-orchestrator.service.ts
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  HealthEvent,
  HealthEventStatus,
} from '../entities/health-event.entity';
import { Treatment } from '../entities/treatment.entity';
import { Withdrawal } from '../entities/withdrawal.entity';
import { Quarantine } from '../entities/quarantine.entity';
import { Diagnostic } from '../entities/diagnostic.entity';
import { InventoryService } from '../../inventory/inventory.service';
import { FinanceService } from '../../finance/finance.service';
import { CreateHealthEventDto } from '../dto/create-health-event.dto';
import { CostCategory } from '../../finance/enums/cost-category.enum';

@Injectable()
export class HealthOrchestratorService {
  private readonly logger = new Logger(HealthOrchestratorService.name);

  constructor(
    @InjectRepository(HealthEvent)
    private readonly healthEventRepo: Repository<HealthEvent>,
    @InjectRepository(Treatment)
    private readonly treatmentRepo: Repository<Treatment>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Quarantine)
    private readonly quarantineRepo: Repository<Quarantine>,
    @InjectRepository(Diagnostic)
    private readonly diagnosticRepo: Repository<Diagnostic>,
    private readonly inventoryService: InventoryService,
    private readonly financeService: FinanceService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  async recordHealthEventWithSideEffects(
    farmId: string,
    userId: string,
    dto: CreateHealthEventDto,
  ): Promise<HealthEvent> {
    // Validate input
    this.validateHealthEventDto(dto);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create the health event
      const healthEvent = this.healthEventRepo.create({
        farmId,
        animalType: dto.animalType,
        animalId: dto.animalId,
        animalTag: dto.animalTag ?? null,
        condition: dto.condition,
        description: dto.description ?? null,
        severity: dto.severity,
        symptoms: dto.symptoms ?? null,
        occurredDate: new Date(dto.occurredDate),
        temperatureCelsius: dto.temperatureCelsius ?? null,
        weightKg: dto.weightKg ?? null,
        bodyConditionScore: dto.bodyConditionScore ?? null,
        affectsBreeding: dto.affectsBreeding ?? false,
        breedingLockUntil: dto.breedingLockUntil
          ? new Date(dto.breedingLockUntil)
          : null,
        estimatedCalvingDelayDays: dto.estimatedCalvingDelayDays ?? null,
        productionImpact: dto.productionImpact ?? null,
        recordedBy: userId,
        notes: dto.notes ?? null,
      });

      const savedEvent = await queryRunner.manager.save(healthEvent);
      this.logger.log(
        `Created health event ${savedEvent.id} for animal ${dto.animalId}`,
      );

      // 2. Save treatments and auto-consume from inventory
      let totalTreatmentCost = 0;

      if (dto.treatments?.length) {
        for (const treatmentDto of dto.treatments) {
          const treatment = this.treatmentRepo.create({
            healthEventId: savedEvent.id,
            medicationId: treatmentDto.medicationId ?? null,
            medicationName: treatmentDto.medicationName,
            manualTotalCost: treatmentDto.manualTotalCost ?? null,
            dosage: treatmentDto.dosage,
            unit: treatmentDto.unit,
            route: treatmentDto.route,
            durationDays: treatmentDto.durationDays,
            frequencyPerDay: treatmentDto.frequencyPerDay ?? 1,
            administeredAt: new Date(treatmentDto.administeredAt),
            administeredBy: treatmentDto.administeredBy ?? userId,
            batchNumber: treatmentDto.batchNumber ?? null,
            expiryDate: treatmentDto.expiryDate
              ? new Date(treatmentDto.expiryDate)
              : null,
            withdrawalPeriodDays: treatmentDto.withdrawalPeriodDays ?? null,
            notes: treatmentDto.notes ?? null,
          });

          await queryRunner.manager.save(treatment);

          let treatmentCost = 0;

          // Handle inventory-based treatments
          if (treatmentDto.medicationId) {
            try {
              const dosage = treatmentDto.dosage ?? 0;
              const durationDays = treatmentDto.durationDays ?? 1;
              const frequency = treatmentDto.frequencyPerDay ?? 1;
              const totalDosage = dosage * durationDays * frequency;

              await this.inventoryService.autoRecordConsumption(
                farmId,
                treatmentDto.medicationId,
                totalDosage,
                savedEvent.id,
                'health_event',
              );

              const stock = await this.inventoryService.getCurrentStock(
                farmId,
                treatmentDto.medicationId,
              );
              const itemCost = (stock as any)?.item?.costPerUnit || 0;
              treatmentCost = totalDosage * itemCost;

              this.logger.log(
                `Auto-consumed ${totalDosage} units, cost: ${treatmentCost} KES`,
              );
            } catch (error) {
              this.logger.warn(
                `Failed to auto-consume medication: ${(error as Error).message}`,
              );
            }
          }
          // Handle manual cost
          else if (
            treatmentDto.manualTotalCost &&
            treatmentDto.manualTotalCost > 0
          ) {
            treatmentCost = treatmentDto.manualTotalCost;
            this.logger.log(
              `Manual cost: ${treatmentCost} KES for ${treatmentDto.medicationName}`,
            );
          }
          // Handle vet service fee
          else if (
            treatmentDto.vetConsultationFee &&
            treatmentDto.vetConsultationFee > 0
          ) {
            treatmentCost = treatmentDto.vetConsultationFee;
            this.logger.log(`Vet service fee: ${treatmentCost} KES`);
          }

          totalTreatmentCost += treatmentCost;

          // Auto-consume from inventory if medicationId provided
          if (treatmentDto.medicationId) {
            try {
              // Calculate total dosage with safe defaults
              const dosage = treatmentDto.dosage ?? 0;
              const durationDays = treatmentDto.durationDays ?? 1;
              const frequency = treatmentDto.frequencyPerDay ?? 1;
              const totalDosage = dosage * durationDays * frequency;
              await this.inventoryService.autoRecordConsumption(
                farmId,
                treatmentDto.medicationId,
                totalDosage,
                savedEvent.id,
                'health_event',
              );

              // Get cost from inventory
              const stock = await this.inventoryService.getCurrentStock(
                farmId,
                treatmentDto.medicationId,
              );
              const itemCost = (stock as any)?.item?.costPerUnit || 0;
              totalTreatmentCost += totalDosage * itemCost;

              this.logger.log(
                `Auto-consumed ${totalDosage} units of medication ${treatmentDto.medicationId}`,
              );
            } catch (error) {
              this.logger.warn(
                `Failed to auto-consume medication: ${(error as Error).message}`,
              );
              // Don't fail the entire transaction, just log warning
            }
          }
        }
      }

      // 3. Save withdrawals (milk/egg safety)
      if (dto.withdrawals?.length) {
        for (const withdrawalDto of dto.withdrawals) {
          // Validate withdrawal end date
          if (
            new Date(withdrawalDto.endsAt) <= new Date(savedEvent.occurredDate)
          ) {
            throw new BadRequestException(
              'Withdrawal end date must be after health event occurred date',
            );
          }

          const withdrawal = this.withdrawalRepo.create({
            healthEventId: savedEvent.id,
            productType: withdrawalDto.productType,
            startsAt: savedEvent.occurredDate,
            endsAt: new Date(withdrawalDto.endsAt),
            reason: withdrawalDto.reason,
            estimatedLossQuantity: withdrawalDto.estimatedLossQuantity ?? null,
            estimatedLossValue: withdrawalDto.estimatedLossValue ?? null,
          });

          await queryRunner.manager.save(withdrawal);

          // Emit withdrawal event for production module
          this.eventEmitter.emit('production.withdrawal.active', {
            farmId,
            animalId: dto.animalId,
            animalType: dto.animalType,
            productType: withdrawalDto.productType,
            startsAt: savedEvent.occurredDate,
            endsAt: withdrawalDto.endsAt,
            estimatedLossValue: withdrawalDto.estimatedLossValue,
          });

          this.logger.log(
            `Created withdrawal for ${withdrawalDto.productType} until ${withdrawalDto.endsAt}`,
          );
        }
      }

      // 4. Save quarantines (biosecurity)
      if (dto.quarantines?.length) {
        for (const quarantineDto of dto.quarantines) {
          // Validate quarantine end date
          if (
            new Date(quarantineDto.endsAt) <= new Date(savedEvent.occurredDate)
          ) {
            throw new BadRequestException(
              'Quarantine end date must be after health event occurred date',
            );
          }

          const quarantine = this.quarantineRepo.create({
            healthEventId: savedEvent.id,
            zoneName: quarantineDto.zoneName,
            startsAt: savedEvent.occurredDate,
            endsAt: new Date(quarantineDto.endsAt),
            requiresPPE: quarantineDto.requiresPPE ?? false,
            requiresHandHygiene: quarantineDto.requiresHandHygiene ?? false,
            cleaningProtocol: quarantineDto.cleaningProtocol ?? null,
            restrictedActions: quarantineDto.restrictedActions ?? null,
            isActive: true,
            notes: quarantineDto.notes ?? null,
          });

          await queryRunner.manager.save(quarantine);

          this.logger.log(
            `Created quarantine for zone ${quarantineDto.zoneName}`,
          );
        }
      }

      // 5. Save diagnostics if provided
      if (dto.diagnostics?.length) {
        for (const diagnosticDto of dto.diagnostics) {
          const diagnostic = this.diagnosticRepo.create({
            healthEventId: savedEvent.id,
            type: diagnosticDto.type,
            performedDate: new Date(diagnosticDto.performedDate),
            labName: diagnosticDto.labName ?? null,
            sampleId: diagnosticDto.sampleId ?? null,
            results: diagnosticDto.results ?? null,
            interpretation: diagnosticDto.interpretation ?? null,
            cost: diagnosticDto.cost ?? null,
            performedBy: diagnosticDto.performedBy ?? userId,
            notes: diagnosticDto.notes ?? null,
          });

          await queryRunner.manager.save(diagnostic);

          // Add diagnostic cost to treatment cost
          if (diagnosticDto.cost) {
            totalTreatmentCost += diagnosticDto.cost;
          }

          this.logger.log(`Recorded diagnostic: ${diagnosticDto.type}`);
        }
      }

      // 6. Update event with financial impact
      const totalProductionLoss = this.calculateProductionLoss(dto);
      const totalEconomicImpact = totalTreatmentCost + totalProductionLoss;

      savedEvent.totalTreatmentCost =
        totalTreatmentCost > 0 ? totalTreatmentCost : null;
      savedEvent.totalProductionLossValue =
        totalProductionLoss > 0 ? totalProductionLoss : null;
      savedEvent.totalEconomicImpact =
        totalEconomicImpact > 0 ? totalEconomicImpact : null;

      await queryRunner.manager.save(savedEvent);

      // 7. Create finance cost entry if there are costs
      if (totalEconomicImpact > 0) {
        try {
          await this.financeService.recordCost(farmId, userId, {
            category: CostCategory.MEDICATION,
            description: `Health event: ${dto.condition} - Treatment and diagnostic costs`,
            incurredDate: savedEvent.occurredDate.toISOString().split('T')[0],
            quantity: totalEconomicImpact,
            unit: 'KES',
            unitCost: 1,
            relatedHealthEventId: savedEvent.id,
            notes: `Treatment for ${dto.animalType} ${dto.animalId}. Condition: ${dto.condition}. Economic impact includes treatment, diagnostics, and production loss.`,
          });

          this.logger.log(
            `Created cost entry in Finance: ${totalEconomicImpact} KES`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to create finance cost entry: ${(error as Error).message}`,
          );
          // Don't fail the entire transaction, just log warning
        }
      }

      // 8. Emit events for other subscribers
      this.eventEmitter.emit('health.event.recorded', {
        eventId: savedEvent.id,
        farmId,
        animalId: dto.animalId,
        animalType: dto.animalType,
        severity: dto.severity,
        condition: dto.condition,
        affectsBreeding: dto.affectsBreeding,
        breedingLockUntil: dto.breedingLockUntil,
        hasWithdrawals: !!dto.withdrawals?.length,
        hasQuarantines: !!dto.quarantines?.length,
        totalEconomicImpact,
      });

      await queryRunner.commitTransaction();

      this.logger.log(
        `Health event ${savedEvent.id} recorded successfully. Economic impact: ${totalEconomicImpact} KES`,
      );

      return savedEvent;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      this.logger.error(
        `Failed to record health event for animal ${dto.animalId}`,
        {
          error: error.message,
          farmId,
          animalType: dto.animalType,
          condition: dto.condition,
          stack: error.stack,
        },
      );

      // Emit failure event for monitoring
      this.eventEmitter.emit('health.event.failed', {
        farmId,
        animalId: dto.animalId,
        reason: error.message,
      });

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private validateHealthEventDto(dto: CreateHealthEventDto): void {
    if (!dto.animalId) {
      throw new BadRequestException('animalId is required');
    }
    if (!dto.animalType) {
      throw new BadRequestException('animalType is required');
    }
    if (!dto.condition) {
      throw new BadRequestException('condition is required');
    }
    if (!dto.occurredDate) {
      throw new BadRequestException('occurredDate is required');
    }

    // Validate that occurred date is not in future
    const occurredDate = new Date(dto.occurredDate);
    if (occurredDate > new Date()) {
      throw new BadRequestException('occurredDate cannot be in the future');
    }

    // Validate breeding lock
    if (dto.affectsBreeding && !dto.breedingLockUntil) {
      throw new BadRequestException(
        'breedingLockUntil is required when affectsBreeding is true',
      );
    }

    // Validate withdrawal dates
    if (dto.withdrawals?.length) {
      for (const w of dto.withdrawals) {
        if (new Date(w.endsAt) <= occurredDate) {
          throw new BadRequestException(
            'Withdrawal end date must be after health event occurred date',
          );
        }
      }
    }

    // Validate quarantine dates
    if (dto.quarantines?.length) {
      for (const q of dto.quarantines) {
        if (new Date(q.endsAt) <= occurredDate) {
          throw new BadRequestException(
            'Quarantine end date must be after health event occurred date',
          );
        }
      }
    }
  }

  private calculateProductionLoss(dto: CreateHealthEventDto): number {
    if (!dto.productionImpact) return 0;
    return dto.productionImpact.lossValue || 0;
  }

  async updateHealthEventStatus(
    eventId: string,
    userId: string,
    newStatus: HealthEventStatus,
    resolvedDate?: Date,
    notes?: string,
  ): Promise<HealthEvent> {
    const event = await this.healthEventRepo.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Health event ${eventId} not found`);
    }

    event.status = newStatus;
    if (
      newStatus === HealthEventStatus.RESOLVED ||
      newStatus === HealthEventStatus.FATAL
    ) {
      event.resolvedDate = resolvedDate || new Date();
    }
    if (notes) {
      event.notes = notes;
    }

    const updated = await this.healthEventRepo.save(event);

    // Emit status change event
    this.eventEmitter.emit('health.event.status.changed', {
      eventId,
      farmId: event.farmId,
      animalId: event.animalId,
      oldStatus: event.status,
      newStatus,
      resolvedDate: event.resolvedDate,
    });

    this.logger.log(`Health event ${eventId} status updated to ${newStatus}`);

    return updated;
  }

  async recordTreatmentResponse(
    eventId: string,
    treatmentId: string,
    responseStatus: string,
    notes?: string,
  ): Promise<Treatment> {
    const treatment = await this.treatmentRepo.findOne({
      where: { id: treatmentId, healthEventId: eventId },
    });

    if (!treatment) {
      throw new NotFoundException(
        `Treatment ${treatmentId} not found for event ${eventId}`,
      );
    }

    treatment.responseStatus = responseStatus as any;
    treatment.responseAssessedAt = new Date();
    treatment.responseNotes = notes || null;

    const updated = await this.treatmentRepo.save(treatment);

    this.logger.log(
      `Treatment ${treatmentId} response recorded: ${responseStatus}`,
    );

    return updated;
  }
}
