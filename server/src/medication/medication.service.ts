import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MedicationRecord } from './entities/medication-record.entity';
import { MedicationStatus } from './enums/medication-status.enum';
import {
  CancelMedicationDto,
  CompleteMedicationDto,
  UpdateMedicationRecordDto,
} from './dtos/update-medication-record.dto';
import { CreateMedicationRecordDto } from './dtos/create-medication-record.dto';

import { FlockService } from '../flock/flock.service';

@Injectable()
export class MedicationService {
  constructor(
    @InjectRepository(MedicationRecord)
    private readonly medicationRepo: Repository<MedicationRecord>,

    private readonly flockService: FlockService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════

  async createRecord(
    flockId: string,
    farmId: string,
    userId: string,
    dto: CreateMedicationRecordDto,
  ): Promise<MedicationRecord> {
    // Confirms flock exists and belongs to this farm — no status/capability
    // gating beyond that. Every flock type can be medicated, and there's
    // no "one active course at a time" rule — concurrent treatments
    // (e.g. antibiotic + vitamin support) are legitimate.
    await this.flockService.getFlock(flockId, farmId);

    const record = this.medicationRepo.create({
      flockId,
      recordedById: userId,
      medicationName: dto.medicationName.trim(),
      purpose: dto.purpose.trim(),
      startDate: new Date(dto.startDate),
      endDate: null,
      dosage: dto.dosage.trim(),
      frequency: dto.frequency.trim(),
      route: dto.route,
      affectedBirds: dto.affectedBirds ?? null,
      withdrawalPeriodDays: dto.withdrawalPeriodDays,
      status: MedicationStatus.ACTIVE,
      notes: dto.notes?.trim() || null,
    });

    return this.medicationRepo.save(record);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READ
  // ═══════════════════════════════════════════════════════════════════════

  async getRecords(
    flockId: string,
    farmId: string,
  ): Promise<MedicationRecord[]> {
    await this.flockService.getFlock(flockId, farmId);

    return this.medicationRepo.find({
      where: { flockId },
      order: { startDate: 'DESC' },
    });
  }

  async getRecord(
    medicationId: string,
    flockId: string,
  ): Promise<MedicationRecord> {
    const record = await this.medicationRepo.findOne({
      where: { id: medicationId },
    });

    if (!record) {
      throw new NotFoundException(
        `Medication record ${medicationId} not found`,
      );
    }
    if (record.flockId !== flockId) {
      throw new ForbiddenException(
        'This medication record does not belong to the specified flock',
      );
    }

    return record;
  }

  /**
   * Records still ACTIVE, or COMPLETED/CANCELLED but still inside their
   * withdrawal window. Used by InsightService — deliberately fetches all
   * non-stale records and filters in application code via the entity's
   * own getters (isInWithdrawal etc.) rather than reimplementing the
   * withdrawal math in a query. Medication record volume per flock is low,
   * so this is cheap; the DRYness of one source of truth for the math
   * matters more here than the query cost.
   */
  async getActiveOrWithdrawalRecords(
    flockId: string,
    farmId: string,
  ): Promise<MedicationRecord[]> {
    await this.flockService.getFlock(flockId, farmId);

    const records = await this.medicationRepo.find({
      where: { flockId },
      order: { startDate: 'DESC' },
    });

    return records.filter(
      (r) => r.status === MedicationStatus.ACTIVE || r.isInWithdrawal,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE — only while ACTIVE
  // ═══════════════════════════════════════════════════════════════════════

  async updateRecord(
    medicationId: string,
    flockId: string,
    farmId: string,
    dto: UpdateMedicationRecordDto,
  ): Promise<MedicationRecord> {
    const record = await this.getRecord(medicationId, flockId);
    await this.flockService.getFlock(flockId, farmId);

    this.assertEditable(record);

    if (dto.medicationName !== undefined)
      record.medicationName = dto.medicationName.trim();
    if (dto.purpose !== undefined) record.purpose = dto.purpose.trim();
    if (dto.startDate !== undefined) record.startDate = new Date(dto.startDate);
    if (dto.dosage !== undefined) record.dosage = dto.dosage.trim();
    if (dto.frequency !== undefined) record.frequency = dto.frequency.trim();
    if (dto.route !== undefined) record.route = dto.route;
    if (dto.affectedBirds !== undefined)
      record.affectedBirds = dto.affectedBirds;
    if (dto.withdrawalPeriodDays !== undefined)
      record.withdrawalPeriodDays = dto.withdrawalPeriodDays;
    if (dto.notes !== undefined) record.notes = dto.notes.trim() || null;

    return this.medicationRepo.save(record);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPLETE
  // ═══════════════════════════════════════════════════════════════════════

  async completeMedication(
    medicationId: string,
    flockId: string,
    farmId: string,
    dto: CompleteMedicationDto,
  ): Promise<MedicationRecord> {
    const record = await this.getRecord(medicationId, flockId);
    await this.flockService.getFlock(flockId, farmId);

    this.assertEditable(record);

    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
    if (endDate < record.startDate) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    record.endDate = endDate;
    record.status = MedicationStatus.COMPLETED;

    return this.medicationRepo.save(record);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CANCEL — withdrawal still applies from the real stop date
  // ═══════════════════════════════════════════════════════════════════════

  async cancelMedication(
    medicationId: string,
    flockId: string,
    farmId: string,
    dto: CancelMedicationDto,
  ): Promise<MedicationRecord> {
    const record = await this.getRecord(medicationId, flockId);
    await this.flockService.getFlock(flockId, farmId);

    this.assertEditable(record);

    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
    if (endDate < record.startDate) {
      throw new BadRequestException('endDate cannot be before startDate');
    }

    // Cancelling doesn't waive withdrawal — if any dosing occurred, residue
    // math runs off this real stop date exactly the same as a completed
    // course. "Cancelled" means "didn't finish the planned course," not
    // "no withdrawal applies."
    record.endDate = endDate;
    record.status = MedicationStatus.CANCELLED;
    record.cancelReason = dto.reason.trim();

    return this.medicationRepo.save(record);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DELETE — only while ACTIVE, i.e. before the record becomes an
  // immutable part of the flock's treatment/withdrawal history
  // ═══════════════════════════════════════════════════════════════════════

  async deleteRecord(
    medicationId: string,
    flockId: string,
    farmId: string,
  ): Promise<void> {
    const record = await this.getRecord(medicationId, flockId);
    await this.flockService.getFlock(flockId, farmId);

    if (record.status !== MedicationStatus.ACTIVE) {
      throw new ConflictException(
        'Only an active (not yet completed or cancelled) medication record can be deleted — ' +
          "a completed or cancelled course is part of the flock's treatment history",
      );
    }

    await this.medicationRepo.remove(record);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE
  // ═══════════════════════════════════════════════════════════════════════

  private assertEditable(record: MedicationRecord): void {
    if (record.status !== MedicationStatus.ACTIVE) {
      throw new ConflictException(
        `This medication record is ${record.status} and can no longer be modified — ` +
          "it is a locked part of the flock's treatment history",
      );
    }
  }
}
