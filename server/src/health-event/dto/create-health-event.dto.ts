import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsObject,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AnimalType,
  HealthEventSeverity,
  ProductionImpactType,
} from '../entities/health-event.entity';
import { TreatmentRoute } from '../enums/treatment-route.enum';
import { WithdrawalType } from '../enums/withdrawal-type.enum';
import { DiagnosticType } from '../enums/diagnostic-type.enum';
import {
  ProcurementSource,
  TreatmentCostSource,
} from '../entities/treatment.entity';

// ─────────────────────────────────────────────────────────────────────────
// NESTED DTOS
// ─────────────────────────────────────────────────────────────────────────

export class CreateTreatmentDto {
  // Medication / Intervention
  @IsUUID()
  @IsOptional()
  medicationId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  medicationName!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dosage?: number;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  unit?: string;

  @IsEnum(TreatmentRoute)
  @IsOptional()
  route?: TreatmentRoute;

  @IsNumber()
  @Min(1)
  @IsOptional()
  durationDays?: number;

  @IsDateString()
  administeredAt!: string;

  @IsUUID()
  @IsOptional()
  administeredBy?: string;

  // Procurement / Source Traceability
  @IsEnum(ProcurementSource)
  @IsOptional()
  procurementSource?: ProcurementSource;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  supplierName?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  receiptReference?: string;

  // Cost Structure
  @IsEnum(TreatmentCostSource)
  @IsOptional()
  costSource?: TreatmentCostSource;

  @ValidateIf((obj) => obj.costSource === TreatmentCostSource.MANUAL)
  @IsNumber()
  @IsOptional()
  @Min(0)
  manualUnitCost?: number;

  @ValidateIf((obj) => obj.costSource === TreatmentCostSource.MANUAL)
  @IsNumber()
  @IsOptional()
  @Min(0)
  manualTotalCost?: number;

  @ValidateIf((obj) => obj.costSource === TreatmentCostSource.VET_SERVICE)
  @IsNumber()
  @IsOptional()
  @Min(0)
  vetConsultationFee?: number;

  @IsString()
  @IsOptional()
  costNotes?: string;

  // Safety / Batch
  @IsString()
  @MaxLength(100)
  @IsOptional()
  batchNumber?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  // Notes
  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  frequencyPerDay: number;

  @IsNumber()
  @IsOptional()
  withdrawalPeriodDays: number;
}

export class CreateWithdrawalDto {
  @IsEnum(WithdrawalType)
  productType!: WithdrawalType;

  @IsDateString()
  endsAt!: string;

  @IsString()
  reason!: string;

  @IsNumber()
  @IsOptional()
  estimatedLossQuantity?: number;

  @IsNumber()
  @IsOptional()
  estimatedLossValue?: number;
}

export class CreateDiagnosticDto {
  @IsEnum(DiagnosticType)
  type!: DiagnosticType;

  @IsDateString()
  performedDate!: string;

  @IsString()
  @IsOptional()
  labName?: string;

  @IsString()
  @IsOptional()
  sampleId?: string;

  @IsOptional()
  results?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  interpretation?: string;

  @IsString()
  @IsOptional()
  notes?: string;
  @IsString()
  @IsOptional()
  performedBy?: string;
}

export class CreateQuarantineDto {
  @IsString()
  zoneName!: string;

  @IsDateString()
  endsAt!: string;

  @IsBoolean()
  @IsOptional()
  requiresPPE?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresHandHygiene?: boolean;

  @IsString()
  @IsOptional()
  cleaningProtocol?: string;

  @IsArray()
  @IsOptional()
  restrictedActions?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateProductionImpactDto {
  @IsEnum(ProductionImpactType)
  type!: ProductionImpactType;

  @IsNumber()
  @Min(0)
  normalRate!: number;

  @IsNumber()
  @Min(0)
  affectedRate!: number;

  @IsNumber()
  @Min(0)
  lossQuantity!: number;

  @IsNumber()
  @Min(0)
  lossValue!: number;

  @IsDateString()
  @IsOptional()
  recoveryDate?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN CREATE HEALTH EVENT DTO
// ─────────────────────────────────────────────────────────────────────────

export class CreateHealthEventDto {
  // Farm & Animal Reference
  @IsOptional()
  @IsEnum(AnimalType)
  animalType!: AnimalType;

  @IsOptional()
  @IsUUID()
  animalId!: string;

  @IsString()
  @IsOptional()
  animalTag?: string;

  // Event Details
  @IsString()
  @IsNotEmpty()
  condition!: string;

  @IsString()
  description!: string;

  @IsEnum(HealthEventSeverity)
  severity!: HealthEventSeverity;

  @IsArray()
  @IsOptional()
  symptoms?: string[];

  @IsDateString()
  occurredDate!: string;

  // Clinical Measurements
  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(45)
  temperatureCelsius?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weightKg?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  bodyConditionScore?: number;

  // Breeding Impact
  @IsBoolean()
  @IsOptional()
  affectsBreeding?: boolean;

  @IsDateString()
  @IsOptional()
  breedingLockUntil?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCalvingDelayDays?: number;

  // Production Impact
  @ValidateNested()
  @Type(() => CreateProductionImpactDto)
  @IsOptional()
  productionImpact?: CreateProductionImpactDto;

  // Treatments
  @ValidateNested({ each: true })
  @Type(() => CreateTreatmentDto)
  @IsOptional()
  treatments?: CreateTreatmentDto[];

  // Withdrawals
  @ValidateNested({ each: true })
  @Type(() => CreateWithdrawalDto)
  @IsOptional()
  withdrawals?: CreateWithdrawalDto[];

  // Diagnostics
  @ValidateNested({ each: true })
  @Type(() => CreateDiagnosticDto)
  @IsOptional()
  diagnostics?: CreateDiagnosticDto[];

  // Quarantines
  @ValidateNested({ each: true })
  @Type(() => CreateQuarantineDto)
  @IsOptional()
  quarantines?: CreateQuarantineDto[];

  // Flock Outbreak
  @IsUUID()
  @IsOptional()
  flockOutbreakId?: string;

  // Metadata
  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
