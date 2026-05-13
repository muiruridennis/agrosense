import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
  IsDateString,
  IsUUID,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  StockCategory,
  StockUnit,
  StockAdjustmentReason,
  StockStatus,
} from '../enums/stock.enums';

// ──────────────────────────────────────────────────────────────────────────
// STOCK ITEM DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CreateStockItemDto {
  @IsEnum(StockCategory)
  category!: StockCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string; // "Layer Mash 16%", "Newcastle Vaccine"

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsEnum(StockUnit)
  unit!: StockUnit;

  @IsNumber()
  @Min(0)
  minStockLevel!: number; // Reorder threshold

  @IsNumber()
  @Min(0)
  optimalStockDays!: number; // Days supply to maintain

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateStockItemDto extends PartialType(CreateStockItemDto) {
  @IsOptional()
  isActive?: boolean;
}

export class StockItemDto {
  id!: string;
  farmId!: string;
  category!: StockCategory;
  name!: string;
  description!: string | null;
  unit!: StockUnit;
  minStockLevel!: number;
  optimalStockDays!: number;
  isActive!: boolean;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// STOCK PURCHASE DTOs
// ──────────────────────────────────────────────────────────────────────────
export class QualityCheckDto {
  @IsString()
  @IsOptional()
  appearance?: string; // Good, discolored, moldy

  @IsString()
  @IsOptional()
  smell?: string; // Normal, sour, off

  @IsString()
  @IsOptional()
  moisture?: string; // Normal, wet, dry

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  passedQC?: boolean;
}

export class CreateStockPurchaseDto {
  @IsUUID()
  itemId!: string;

  @IsDateString()
  purchaseDate!: string; // ISO date

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  costPerUnit!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  supplierName!: string;

  @IsString()
  @IsOptional()
  supplierPhone?: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => QualityCheckDto)
  qualityCheck?: QualityCheckDto;

  @IsString()
  @IsOptional()
  notes?: string;
}


export class StockPurchaseDto {
  id!: string;
  farmId!: string;
  itemId!: string;
  purchaseDate!: Date;
  quantity!: number;
  costPerUnit!: number;
  totalCost!: number;
  supplierName!: string;
  supplierPhone!: string | null;
  batchNumber!: string | null;
  expiryDate!: Date | null;
  deliveryDate!: Date | null;
  invoiceNumber!: string | null;
  qualityCheck!: any | null;
  notes!: string | null;
  recordedBy!: string | null;
  createdAt!: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// STOCK CONSUMPTION DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CreateStockConsumptionDto {
  @IsUUID()
  itemId!: string;

  @IsDateString()
  consumptionDate!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsUUID()
  @IsOptional()
  relatedFlockRecordId?: string; // Poultry daily record

  @IsUUID()
  @IsOptional()
  relatedDailyLogId?: string; // Dairy daily log

  @IsUUID()
  @IsOptional()
  relatedHealthEventId?: string; // Health event (treatment)

  @IsUUID()
  @IsOptional()
  relatedBreedingRecordId?: string; // Breeding record (supplement)

  @IsString()
  @IsOptional()
  consumptionReason?: string; // "Fed to flock", "Treatment", "Vaccination"

  @IsString()
  @IsOptional()
  notes?: string;
}

export class StockConsumptionDto {
  id!: string;
  farmId!: string;
  itemId!: string;
  consumptionDate!: Date;
  quantity!: number;
  relatedFlockRecordId!: string | null;
  relatedDailyLogId!: string | null;
  relatedHealthEventId!: string | null;
  relatedBreedingRecordId!: string | null;
  consumptionReason!: string | null;
  notes!: string | null;
  recordedBy!: string | null;
  createdAt!: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// STOCK ADJUSTMENT DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CreateStockAdjustmentDto {
  @IsUUID()
  itemId!: string;

  @IsDateString()
  adjustmentDate!: string;

  @IsNumber()
  quantityAdjusted!: number; // Positive or negative

  @IsEnum(StockAdjustmentReason)
  reason!: StockAdjustmentReason;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class StockAdjustmentDto {
  id!: string;
  farmId!: string;
  itemId!: string;
  adjustmentDate!: Date;
  quantityAdjusted!: number;
  reason!: string;
  description!: string;
  approvedBy!: string | null;
  recordedBy!: string | null;
  createdAt!: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// CURRENT STOCK & STATUS DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CurrentStockDto {
  id!: string;
  farmId!: string;
  itemId!: string;
  itemName!: string;
  category!: StockCategory;
  unit!: StockUnit;
  quantityOnHand!: number;
  lastUpdated!: Date;
  daysSupply!: number | null;
  estimatedRunoutDate!: Date | null;
  status!: StockStatus;
  latestExpiryDate!: Date | null;
  latestBatchNumber!: string | null;
  avgDailyConsumption!: number | null;
  avgDailyConsumption30Days!: number | null;
  minStockLevel!: number;
  optimalStockDays!: number;
}

export class StockStatusSummaryDto {
  totalItems!: number;
  adequateStock!: number;
  lowStock!: number;
  criticalStock!: number;
  excessStock!: number;
  unknownStatus!: number;

  itemsNeeringExpiry!: Array<{
    itemId: string;
    itemName: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }>;

  itemsNeedingReorder!: Array<{
    itemId: string;
    itemName: string;
    currentStock: number;
    minLevel: number;
    daysSupply: number;
  }>;
}

// ──────────────────────────────────────────────────────────────────────────
// STOCK ALERT DTOs
// ──────────────────────────────────────────────────────────────────────────

export class StockAlertDto {
  id!: string;
  farmId!: string;
  itemId!: string;
  itemName!: string;
  alertType!:
    | 'low_stock'
    | 'critical_stock'
    | 'expiry_warning'
    | 'expired'
    | 'overstock'
    | 'quality_issue';
  message!: string;
  details!: string | null;
  severity!: 'info' | 'warning' | 'critical';
  alertStatus!: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt!: Date | null;
  acknowledgedBy!: string | null;
  resolvedAt!: Date | null;
  resolutionNotes!: string | null;
  createdAt!: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// SUPPLIER PERFORMANCE DTOs
// ──────────────────────────────────────────────────────────────────────────

export class SupplierPerformanceDto {
  period!: string; // "January 2025", "Feb 2025"
  supplier!: string;
  itemName!: string;
  category!: StockCategory;

  // Purchase metrics
  quantityPurchased!: number;
  totalCost!: number;
  costPerUnit!: number;
  avgCostPerUnit!: number;

  // Consumption metrics (if linked to operations)
  quantityConsumed!: number;
  wastage!: number; // Purchases - Consumed - Adjustments
  wastagePercent!: number;

  // Quality metrics (if tracked)
  qualityScore!: number; // 0-10
  issues!: Array<{
    date: Date;
    issue: string;
    impact: string;
  }>;

  // Financial impact
  costPerEgg?: number; // If poultry farm
  costPerLiter?: number; // If dairy
  costPerKg?: number; // If crops

  // Comparison
  comparison!: {
    otherSuppliers: Array<{
      supplier: string;
      costPerUnit: number;
      qualityScore: number;
      advantage: string;
    }>;
  };

  recommendation!: string;
}

// ──────────────────────────────────────────────────────────────────────────
// INVENTORY REPORT DTOs
// ──────────────────────────────────────────────────────────────────────────

export class InventoryCostReportDto {
  period!: string;
  farmId!: string;

  // By category
  byCategory!: Array<{
    category: StockCategory;
    totalPurchased: number;
    totalCost: number;
    totalConsumed: number;
    totalWaste: number;
    wastePercent: number;
    costPerUnitConsumed: number;
  }>;

  // Summary
  totalPurchaseCost!: number;
  totalWasteCost!: number;
  totalConsumption!: number;

  // Efficiency
  wastePercentage!: number;
  costPerAnimal!: number; // Total input cost / number of animals
}

export class InventoryForecastDto {
  itemId!: string;
  itemName!: string;
  category!: StockCategory;

  currentStock!: number;
  avgDailyConsumption!: number;
  daysSupply!: number;
  minStockLevel!: number;
  optimalStockDays!: number;

  // Forecast
  forecastedRunoutDate!: Date;
  recommendedOrderDate!: Date; // When to order based on supplier lead time
  recommendedOrderQuantity!: number; // To reach optimal days

  // Seasonal adjustment
  seasonalTrend!: 'increasing' | 'decreasing' | 'stable';
  nextMonthEstimate!: number; // Estimated consumption next month
}
