import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CostCategory } from '../enums/cost-category.enum';
import { RevenueCategory } from '../enums/revenue-category.enum';
import { ConfidenceLevel } from '../enums/confidence-level.enum';

// ──────────────────────────────────────────────────────────────────────────
// COST ENTRY DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CreateCostEntryDto {
  @IsEnum(CostCategory)
  category!: CostCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  description!: string; // "Layer Mash - Supplier A, Batch #045"

  @IsDateString()
  incurredDate!: string; // When was this cost incurred?

  @IsNumber()
  @Min(0)
  quantity!: number; // 40,000

  @IsString()
  @IsNotEmpty()
  unit!: string; // "kg", "litre", "unit", "hour"

  @IsNumber()
  @Min(0)
  unitCost!: number; // KES per unit

  @IsString()
  @IsOptional()
  @MaxLength(50)
  supplier?: string; // Who did we buy from?

  @IsUUID()
  @IsOptional()
  relatedInventoryPurchaseId?: string; // Link to inventory purchase

  @IsUUID()
  @IsOptional()
  relatedHealthEventId?: string; // Link to health event (vet treatment)

  @IsUUID()
  @IsOptional()
  relatedAnimalId?: string; // Specific animal

  @IsString()
  @IsOptional()
  relatedInventoryConsumptionId?: string;
  
  @IsString()
  @IsOptional()
  relatedInventoryAdjustmentId?: string;
  @IsString()
  @IsOptional()
  relatedProductionLogId?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCostEntryDto extends PartialType(CreateCostEntryDto) {}

export class CostEntryDto {
  id!: string;
  farmId!: string;
  category!: CostCategory;
  description!: string;
  incurredDate!: Date;
  quantity!: number;
  unit!: string;
  unitCost!: number;
  totalCost!: number;
  supplier!: string | null;
  invoiceNumber!: string | null;
  isPaid!: boolean;
  paidDate!: Date | null;
  relatedInventoryPurchaseId!: string | null;
  relatedHealthEventId!: string | null;
  relatedAnimalId!: string | null;
  recordedBy!: string | null;
  createdAt!: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// REVENUE ENTRY DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CreateRevenueEntryDto {
  @IsEnum(RevenueCategory)
  category!: RevenueCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  description!: string; // "Eggs - Grade A", "Milk - Cooperative sale"

  @IsDateString()
  soldDate!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  unit!: string; // "units" (eggs), "litres" (milk), "kg" (meat)

  @IsNumber()
  @Min(0)
  unitPrice!: number; // KES per unit

  @IsString()
  @IsOptional()
  buyer?: string; // "Cooperative", "Local market", "Retailer name"

  @IsUUID()
  @IsOptional()
  relatedProductionLogId?: string;

  @IsUUID()
  @IsOptional()
  relatedAnimalId?: string;

  @IsString()
  @IsOptional()
  receiptNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateRevenueEntryDto extends PartialType(CreateRevenueEntryDto) {}

export class RecordPaymentDto {
  @IsNumber()
  @Min(0)
  amountPaid!: number;

  @IsDateString()
  @IsOptional()
  paidDate?: string; // Defaults to today

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RevenueEntryDto {
  id!: string;
  farmId!: string;
  category!: RevenueCategory;
  description!: string;
  soldDate!: Date;
  quantity!: number;
  unit!: string;
  unitPrice!: number;
  totalRevenue!: number;
  buyer!: string | null;
  receiptNumber!: string | null;
  isPaid!: boolean;
  paidDate!: Date | null;
  amountPaid!: number | null;
  relatedProductionLogId!: string | null;
  relatedAnimalId!: string | null;
  recordedBy!: string | null;
  createdAt!: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// FINANCIAL SUMMARY DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CostByCategoryDto {
  category!: CostCategory;
  totalQuantity!: number;
  totalCost!: number;
  unit!: string;
  costPerUnit!: number;
  entries!: number;
  percentOfTotal!: number; // % of total costs
}

export class RevenueByCategoryDto {
  category!: RevenueCategory;
  totalQuantity!: number;
  totalRevenue!: number;
  unit!: string;
  revenuePerUnit!: number;
  entries!: number;
  percentOfTotal!: number; // % of total revenue
}

export class FinancialSummaryDto {
  period!: string; // "2025-01"
  periodStart!: Date;
  periodEnd!: Date;

  // Costs
  costsByCategory!: CostByCategoryDto[];
  totalCosts!: number;

  // Revenue
  revenueByCategory!: RevenueByCategoryDto[];
  totalRevenue!: number;

  // Profit
  grossProfit!: number;
  profitMargin!: number; // %

  // Per-animal costs
  costPerPoultry!: number | null; // Total cost / count of poultry
  costPerDairyCow!: number | null;
  costPerSmallRuminant!: number | null;

  // Cash flow
  cashInflow!: number; // Paid revenues
  cashOutflow!: number; // Paid costs
  netCashFlow!: number;

  // Outstanding
  accountsPayable!: number; // Unpaid costs
  accountsReceivable!: number; // Unpaid revenue

  // Animal counts
  poultryCount!: number;
  dairyCowCount!: number;
  smallRuminantCount!: number;
}

export class FinancialComparisonDto {
  currentMonth!: FinancialSummaryDto;
  previousMonth!: FinancialSummaryDto;
  yearToDate!: FinancialSummaryDto;

  // Trends
  costsTrend!: number; // % change (positive = costs increased)
  revenueTrend!: number; // % change (positive = revenue increased)
  profitTrend!: number; // % change (positive = profit increased)

  // Insights
  insights!: string[]; // ["Feed costs up 15%", "Milk revenue down 5%"]
}

// ──────────────────────────────────────────────────────────────────────────
// PRODUCTION METRICS DTOs
// ──────────────────────────────────────────────────────────────────────────

export class ProductionMetricsDto {
  period!: string;

  // Poultry
  eggsProduced!: number | null;
  feedConsumedKg!: number | null;
  feedConversionRatio!: number | null; // kg feed per 10 eggs
  costPerEgg!: number | null;
  poultryMortality!: number | null;

  // Dairy
  milkProducedLitres!: number | null;
  concentratePerLiter!: number | null;
  costPerLiter!: number | null;
  dairyMortality!: number | null;

  // Small Ruminants
  meatProducedKg!: number | null;
  costPerKgMeat!: number | null;
  ruminantMortality!: number | null;

  // Crops
  cropsHarvestedKg!: number | null;
  cropYieldPerHectare!: number | null;

  // Overall
  overallProductivityScore!: number | null; // 0-100
}

export class ProductionTrendDto {
  metric!: string; // "feedConversionRatio", "costPerEgg", etc
  current!: number;
  previousPeriod!: number;
  trend!: number; // % change
  direction!: 'improving' | 'declining' | 'stable';
  target!: number | null; // Industry benchmark
}

// ──────────────────────────────────────────────────────────────────────────
// CASH FLOW FORECAST DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CreateCashFlowForecastDto {
  @IsDateString()
  requiredByDate!: string; // When is this cash needed?

  @IsEnum(CostCategory)
  category!: CostCategory;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  estimatedAmount!: number;

  @IsEnum(ConfidenceLevel)
  @IsOptional()
  confidence?: ConfidenceLevel;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CashFlowForecastDto {
  id!: string;
  farmId!: string;
  forecastDate!: Date;
  requiredByDate!: Date;
  category!: CostCategory;
  description!: string;
  estimatedAmount!: number;
  confidence!: ConfidenceLevel;
  isFulfilled!: boolean;
  actualAmount!: number | null;
  daysUntilNeeded!: number;
  createdAt!: Date;
}

export class CashFlowSummaryDto {
  currentCash!: number; // Starting balance
  nextSevenDays!: number; // Cash needed in next 7 days
  nextThirtyDays!: number; // Cash needed in next 30 days
  nextNinetyDays!: number; // Cash needed in next 90 days

  // By category
  byCategory!: Array<{
    category: CostCategory;
    nextSevenDays: number;
    nextThirtyDays: number;
  }>;

  // Risk assessment
  riskLevel!: 'low' | 'medium' | 'high'; // Will we have enough cash?
  warningMessage!: string | null; // "Shortfall of 200K KES in 10 days"
}

// ──────────────────────────────────────────────────────────────────────────
// BUDGET DTOs
// ──────────────────────────────────────────────────────────────────────────

export class CreateBudgetLineDto {
  @IsEnum(CostCategory)
  category!: CostCategory;

  @IsNumber()
  @Min(0)
  budgetedAmount!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BudgetLineDto {
  id!: string;
  farmId!: string;
  period!: string;
  category!: CostCategory;
  budgetedAmount!: number;
  actualSpent!: number;
  remaining!: number;
  variancePercent!: number; // Negative = over budget
  percentOfBudget!: number; // How much spent (as %)
  notes!: string | null;
}

export class BudgetSummaryDto {
  period!: string;
  budgets!: BudgetLineDto[];

  totalBudgeted!: number;
  totalActualSpent!: number;
  totalVariance!: number;
  totalVariancePercent!: number;

  // Category breakdown
  onTrack!: string[]; // Categories within budget
  overBudget!: Array<{ category: string; overage: number }>;
  underBudget!: Array<{ category: string; savings: number }>;
}

// ──────────────────────────────────────────────────────────────────────────
// PROFIT & LOSS (P&L) DTOs
// ──────────────────────────────────────────────────────────────────────────

export class ProfitAndLossDto {
  period!: string;

  // Revenue
  totalRevenue!: number;
  revenueByType!: Array<{
    type: RevenueCategory;
    amount: number;
    percentage: number;
  }>;

  // Costs
  totalCosts!: number;
  costsByType!: Array<{
    type: CostCategory;
    amount: number;
    percentage: number;
  }>;

  // Profit
  grossProfit!: number;
  grossProfitMargin!: number; // %

  // Additional costs (if tracked)
  depreciation!: number;
  interest!: number;
  netProfit!: number;
  netProfitMargin!: number; // %

  // Break-even
  breakEvenRevenue!: number; // Revenue needed to cover costs
  safetyMargin!: number; // % above break-even

  // Per-unit economics
  costPerEgg!: number | null;
  revenuePerEgg!: number | null;
  profitPerEgg!: number | null;

  costPerLiter!: number | null;
  revenuePerLiter!: number | null;
  profitPerLiter!: number | null;

  costPerKgMeat!: number | null;
  revenuePerKgMeat!: number | null;
  profitPerKgMeat!: number | null;
}

// ──────────────────────────────────────────────────────────────────────────
// PROFITABILITY ANALYSIS
// ──────────────────────────────────────────────────────────────────────────

export class AnimalProfitabilityDto {
  animalType!: string; // "Poultry", "Dairy", "SmallRuminants"
  animalId!: string;
  animalIdentifier!: string; // Tag ID, name, etc

  lifetimeRevenue!: number; // Total revenue from this animal
  lifetimeCosts!: number; // Total costs for this animal
  lifetimeProfit!: number;

  // Monthly breakdown (current)
  monthlyRevenue!: number;
  monthlyCosts!: number;
  monthlyProfit!: number;
  monthlyROI!: number; // % return on investment

  // Efficiency
  feedCostRatio!: number; // Feed cost / revenue (lower is better)
  medicationCostRatio!: number; // Medication / revenue
  overallEfficiency!: number; // 0-100 score

  // Recommendation
  status!: 'profitable' | 'marginal' | 'unprofitable';
  recommendation!: string; // "Keep", "Monitor", "Cull"
}

export class HerdProfitabilityDto {
  animalType!: string; // "Poultry", "Dairy", etc
  totalAnimals!: number;
  averageAnimalProfit!: number;
  totalHerdProfit!: number;

  topProfitableAnimals!: AnimalProfitabilityDto[]; // Top 5
  leastProfitableAnimals!: AnimalProfitabilityDto[]; // Bottom 5

  overallStatus!: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations!: string[]; // "Cull bottom 10% of animals", etc
}

// ──────────────────────────────────────────────────────────────────────────
// FINANCIAL HEALTH ASSESSMENT
// ──────────────────────────────────────────────────────────────────────────

export class FinancialHealthDto {
  overallScore!: number; // 0-100

  // Key metrics
  profitabilityScore!: number;
  liquidityScore!: number; // Can pay short-term costs?
  solvencyScore!: number; // Long-term viability?
  efficiencyScore!: number; // Cost control?

  // Ratios
  debtToEquity!: number; // (if debt tracked)
  currentRatio!: number; // Assets / Liabilities
  quickRatio!: number; // Quick assets / Liabilities

  // Trends
  revenueTrend!: number; // % change YoY
  profitTrend!: number; // % change YoY
  costTrend!: number; // % change YoY

  // Recommendations
  strengths!: string[]; // "Strong egg production margin"
  weaknesses!: string[]; // "High medication costs"
  opportunities!: string[]; // "Reduce feed costs by 5-10%"
  threats!: string[]; // "Feed prices rising"

  riskLevel!: 'low' | 'medium' | 'high';
  actionItems!: string[];
}
