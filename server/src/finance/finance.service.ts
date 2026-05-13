// finance/finance.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  CostEntry,
  RevenueEntry,
  FinancialSummary,
  ProductionMetrics,
  CashFlowForecast,
  BudgetLine,
} from './entities';
import { CostCategory } from './enums/cost-category.enum';
import { RevenueCategory } from './enums/revenue-category.enum';
import {
  CreateCostEntryDto,
  CreateRevenueEntryDto,
  FinancialSummaryDto,
  FinancialComparisonDto,
  ProfitAndLossDto,
  FinancialHealthDto,
  RecordPaymentDto,
  CashFlowSummaryDto,
  BudgetSummaryDto,
  CreateCashFlowForecastDto,
  CreateBudgetLineDto,
} from './dtos/finance.dto';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(CostEntry)
    private readonly costRepo: Repository<CostEntry>,
    @InjectRepository(RevenueEntry)
    private readonly revenueRepo: Repository<RevenueEntry>,
    @InjectRepository(FinancialSummary)
    private readonly summaryRepo: Repository<FinancialSummary>,
    @InjectRepository(ProductionMetrics)
    private readonly metricsRepo: Repository<ProductionMetrics>,
    @InjectRepository(CashFlowForecast)
    private readonly forecastRepo: Repository<CashFlowForecast>,
    @InjectRepository(BudgetLine)
    private readonly budgetRepo: Repository<BudgetLine>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // COST TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  async recordCost(
    farmId: string,
    userId: string,
    dto: CreateCostEntryDto,
  ): Promise<CostEntry> {
    const totalCost = this.toNumber(dto.quantity) * this.toNumber(dto.unitCost);

    const entry = this.costRepo.create({
      ...dto,
      farmId,
      incurredDate: new Date(dto.incurredDate),
      totalCost,
      recordedBy: userId,
    });

    const saved = await this.costRepo.save(entry);
    await this.markSummaryDirty(farmId, new Date(dto.incurredDate));

    return saved;
  }

  async getCosts(
    farmId: string,
    startDate: Date,
    endDate: Date,
    category?: CostCategory,
  ): Promise<CostEntry[]> {
    const where: any = { farmId, incurredDate: Between(startDate, endDate) };
    if (category) where.category = category;

    return this.costRepo.find({ where, order: { incurredDate: 'DESC' } });
  }

  async recordCostPayment(
    farmId: string,
    costId: string,
    dto: RecordPaymentDto,
  ): Promise<CostEntry> {
    const cost = await this.costRepo.findOne({ where: { id: costId, farmId } });
    if (!cost) throw new NotFoundException('Cost entry not found');

    cost.isPaid = true;
    cost.paidDate = dto.paidDate ? new Date(dto.paidDate) : new Date();

    const saved = await this.costRepo.save(cost);
    await this.markSummaryDirty(farmId, cost.incurredDate);

    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUE TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  async recordRevenue(
    farmId: string,
    userId: string,
    dto: CreateRevenueEntryDto,
  ): Promise<RevenueEntry> {
    const totalRevenue = this.toNumber(dto.quantity) * this.toNumber(dto.unitPrice);

    const entry = this.revenueRepo.create({
      ...dto,
      farmId,
      soldDate: new Date(dto.soldDate),
      totalRevenue,
      recordedBy: userId,
    });

    const saved = await this.revenueRepo.save(entry);
    await this.markSummaryDirty(farmId, new Date(dto.soldDate));

    return saved;
  }

  async getRevenue(
    farmId: string,
    startDate: Date,
    endDate: Date,
    category?: RevenueCategory,
  ): Promise<RevenueEntry[]> {
    const where: any = { farmId, soldDate: Between(startDate, endDate) };
    if (category) where.category = category;

    return this.revenueRepo.find({ where, order: { soldDate: 'DESC' } });
  }

  async recordRevenuePayment(
    farmId: string,
    revenueId: string,
    dto: RecordPaymentDto,
  ): Promise<RevenueEntry> {
    const revenue = await this.revenueRepo.findOne({ where: { id: revenueId, farmId } });
    if (!revenue) throw new NotFoundException('Revenue entry not found');

    revenue.isPaid = true;
    revenue.paidDate = dto.paidDate ? new Date(dto.paidDate) : new Date();
    revenue.amountPaid = this.toNumber(dto.amountPaid);

    const saved = await this.revenueRepo.save(revenue);
    await this.markSummaryDirty(farmId, revenue.soldDate);

    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCIAL SUMMARIES
  // ─────────────────────────────────────────────────────────────────────────

  async recalculateFinancialSummary(farmId: string, date: Date): Promise<FinancialSummary> {
    const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const period = date.toISOString().substring(0, 7);

    const costs = await this.costRepo.find({
      where: { farmId, incurredDate: Between(periodStart, periodEnd) },
    });

    const revenue = await this.revenueRepo.find({
      where: { farmId, soldDate: Between(periodStart, periodEnd) },
    });

    // Aggregate costs
    const costsByCategory: any = {};
    let totalCosts = 0;

    for (const cost of costs) {
      const totalCost = this.toNumber(cost.totalCost);
      if (!costsByCategory[cost.category]) {
        costsByCategory[cost.category] = {
          totalQuantity: 0,
          totalCost: 0,
          unit: cost.unit,
          entries: 0,
        };
      }
      costsByCategory[cost.category].totalQuantity += this.toNumber(cost.quantity);
      costsByCategory[cost.category].totalCost += totalCost;
      costsByCategory[cost.category].entries += 1;
      totalCosts += totalCost;
    }

    for (const key of Object.keys(costsByCategory)) {
      const cat = costsByCategory[key];
      cat.costPerUnit = cat.totalQuantity > 0 ? cat.totalCost / cat.totalQuantity : 0;
    }

    // Aggregate revenue
    const revenueByCategory: any = {};
    let totalRevenue = 0;

    for (const rev of revenue) {
      const totalRev = this.toNumber(rev.totalRevenue);
      if (!revenueByCategory[rev.category]) {
        revenueByCategory[rev.category] = {
          totalQuantity: 0,
          totalRevenue: 0,
          unit: rev.unit,
          entries: 0,
        };
      }
      revenueByCategory[rev.category].totalQuantity += this.toNumber(rev.quantity);
      revenueByCategory[rev.category].totalRevenue += totalRev;
      revenueByCategory[rev.category].entries += 1;
      totalRevenue += totalRev;
    }

    for (const key of Object.keys(revenueByCategory)) {
      const cat = revenueByCategory[key];
      cat.revenuePerUnit = cat.totalQuantity > 0 ? cat.totalRevenue / cat.totalQuantity : 0;
    }

    const grossProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Cash flow
    const cashOutflow = costs.filter(c => c.isPaid).reduce((sum, c) => sum + this.toNumber(c.totalCost), 0);
    const cashInflow = revenue.filter(r => r.isPaid).reduce((sum, r) => sum + this.toNumber(r.totalRevenue), 0);
    const netCashFlow = cashInflow - cashOutflow;

    const accountsPayable = costs.filter(c => !c.isPaid).reduce((sum, c) => sum + this.toNumber(c.totalCost), 0);
    const accountsReceivable = revenue.filter(r => !r.isPaid).reduce((sum, r) => sum + this.toNumber(r.totalRevenue), 0);

    // Find or create summary
    let summary = await this.summaryRepo.findOne({ where: { farmId, period } });

    const currentVersion = summary?.version ?? 0;
    const safeVersion = Number.isFinite(currentVersion) ? currentVersion : 0;

    if (!summary) {
      summary = this.summaryRepo.create({
        farmId,
        period,
        periodStart,
        periodEnd,
        costsByCategory: {},
        revenueByCategory: {},
        animalCounts: { poultry: 0, dairy: 0, smallRuminants: 0 },
        costPerAnimal: null,
        totalCosts: 0,
        totalRevenue: 0,
        grossProfit: 0,
        profitMargin: 0,
        cashInflow: 0,
        cashOutflow: 0,
        netCashFlow: 0,
        accountsPayable: 0,
        accountsReceivable: 0,
        isDirty: false,
        version: 1,
        calculatedAt: new Date(),
      });
    }

    const animalCounts = await this.getAnimalCounts(farmId);
    const costPerAnimal = this.calculateCostPerAnimal(totalCosts, animalCounts);

    summary.costsByCategory = costsByCategory;
    summary.totalCosts = totalCosts;
    summary.revenueByCategory = revenueByCategory;
    summary.totalRevenue = totalRevenue;
    summary.grossProfit = grossProfit;
    summary.profitMargin = profitMargin;
    summary.cashInflow = cashInflow;
    summary.cashOutflow = cashOutflow;
    summary.netCashFlow = netCashFlow;
    summary.accountsPayable = accountsPayable;
    summary.accountsReceivable = accountsReceivable;
    summary.animalCounts = animalCounts;
    summary.costPerAnimal = costPerAnimal;
    summary.calculatedAt = new Date();
    summary.isDirty = false;
    summary.version = safeVersion + 1;

    this.validateSummaryNumbers(summary);
    return this.summaryRepo.save(summary);
  }

  async markSummaryDirty(farmId: string, date: Date): Promise<void> {
    const period = date.toISOString().substring(0, 7);
    let summary = await this.summaryRepo.findOne({ where: { farmId, period } });

    const currentVersion = summary?.version ?? 0;
    const safeVersion = Number.isFinite(currentVersion) ? currentVersion : 0;

    if (!summary) {
      summary = this.summaryRepo.create({
        farmId,
        period,
        periodStart: new Date(date.getFullYear(), date.getMonth(), 1),
        periodEnd: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        costsByCategory: {},
        revenueByCategory: {},
        animalCounts: { poultry: 0, dairy: 0, smallRuminants: 0 },
        costPerAnimal: null,
        totalCosts: 0,
        totalRevenue: 0,
        grossProfit: 0,
        profitMargin: 0,
        cashInflow: 0,
        cashOutflow: 0,
        netCashFlow: 0,
        accountsPayable: 0,
        accountsReceivable: 0,
        isDirty: true,
        calculatedAt: new Date(),
        version: safeVersion + 1,
      });
    } else {
      summary.isDirty = true;
      summary.version = safeVersion + 1;
    }

    await this.summaryRepo.save(summary);
  }

  async rebuildSummary(farmId: string, period: string): Promise<FinancialSummary> {
    const [year, month] = period.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    return this.recalculateFinancialSummary(farmId, periodStart);
  }

  async getFinancialSummary(farmId: string, period: string): Promise<FinancialSummaryDto> {
    let summary = await this.summaryRepo.findOne({ where: { farmId, period } });

    if (!summary) {
      summary = await this.rebuildSummary(farmId, period);
    } else if (summary.isDirty) {
      summary = await this.rebuildSummary(farmId, period);
    }

    const costsByCategory = Object.entries(summary.costsByCategory || {}).map(([cat, data]: any) => ({
      category: cat as CostCategory,
      ...data,
      percentOfTotal: summary.totalCosts > 0 ? (data.totalCost / summary.totalCosts) * 100 : 0,
    }));

    const revenueByCategory = Object.entries(summary.revenueByCategory || {}).map(([cat, data]: any) => ({
      category: cat as RevenueCategory,
      ...data,
      percentOfTotal: summary.totalRevenue > 0 ? (data.totalRevenue / summary.totalRevenue) * 100 : 0,
    }));

    return {
      period: summary.period,
      periodStart: summary.periodStart,
      periodEnd: summary.periodEnd,
      costsByCategory,
      totalCosts: summary.totalCosts,
      revenueByCategory,
      totalRevenue: summary.totalRevenue,
      grossProfit: summary.grossProfit,
      profitMargin: summary.profitMargin,
      costPerPoultry: summary.costPerAnimal?.poultry || null,
      costPerDairyCow: summary.costPerAnimal?.dairy || null,
      costPerSmallRuminant: summary.costPerAnimal?.smallRuminants || null,
      cashInflow: summary.cashInflow,
      cashOutflow: summary.cashOutflow,
      netCashFlow: summary.netCashFlow,
      accountsPayable: summary.accountsPayable,
      accountsReceivable: summary.accountsReceivable,
      poultryCount: summary.animalCounts?.poultry || 0,
      dairyCowCount: summary.animalCounts?.dairy || 0,
      smallRuminantCount: summary.animalCounts?.smallRuminants || 0,
    };
  }

  async compareFinancialPeriods(
    farmId: string,
    currentPeriod: string,
    previousPeriod: string,
  ): Promise<FinancialComparisonDto> {
    let current: FinancialSummaryDto;
    let previous: FinancialSummaryDto;

    try {
      current = await this.getFinancialSummary(farmId, currentPeriod);
    } catch {
      current = this.createEmptyFinancialSummary(farmId, currentPeriod);
    }

    try {
      previous = await this.getFinancialSummary(farmId, previousPeriod);
    } catch {
      previous = this.createEmptyFinancialSummary(farmId, previousPeriod);
    }

    const costsTrend = this.calculateTrend(current.totalCosts, previous.totalCosts);
    const revenueTrend = this.calculateTrend(current.totalRevenue, previous.totalRevenue);
    const profitTrend = this.calculateTrend(current.grossProfit, previous.grossProfit);

    const insights: string[] = [];

    if (costsTrend !== null && Math.abs(costsTrend) > 10) {
      insights.push(costsTrend > 0 ? `⚠️ Costs increased ${costsTrend.toFixed(1)}%` : `✅ Costs decreased ${Math.abs(costsTrend).toFixed(1)}%`);
    }

    if (revenueTrend !== null && Math.abs(revenueTrend) > 10) {
      insights.push(revenueTrend > 0 ? `📈 Revenue increased ${revenueTrend.toFixed(1)}%` : `📉 Revenue decreased ${Math.abs(revenueTrend).toFixed(1)}%`);
    }

    if (profitTrend !== null && Math.abs(profitTrend) > 20) {
      insights.push(profitTrend > 0 ? `💰 Profit up ${profitTrend.toFixed(1)}%` : `⚠️ Profit down ${Math.abs(profitTrend).toFixed(1)}%`);
    }

    if (insights.length === 0) {
      insights.push('📊 Financial metrics are stable with no significant changes');
    }

    let ytd: FinancialSummaryDto;
    const ytdPeriod = currentPeriod.substring(0, 4) + '-01';
    try {
      ytd = await this.getFinancialSummary(farmId, ytdPeriod);
    } catch {
      ytd = current;
    }

    return {
      currentMonth: current,
      previousMonth: previous,
      yearToDate: ytd,
      costsTrend: costsTrend ?? 0,
      revenueTrend: revenueTrend ?? 0,
      profitTrend: profitTrend ?? 0,
      insights,
    };
  }

  async getProfitAndLoss(farmId: string, period: string): Promise<ProfitAndLossDto> {
    const summary = await this.getFinancialSummary(farmId, period);

    const costsByType = summary.costsByCategory.map(cat => ({
      type: cat.category,
      amount: cat.totalCost,
      percentage: summary.totalCosts > 0 ? (cat.totalCost / summary.totalCosts) * 100 : 0,
    }));

    const revenueByType = summary.revenueByCategory.map(cat => ({
      type: cat.category,
      amount: cat.totalRevenue,
      percentage: summary.totalRevenue > 0 ? (cat.totalRevenue / summary.totalRevenue) * 100 : 0,
    }));

    const breakEvenRevenue = summary.totalCosts;
    const safetyMargin = summary.totalRevenue > 0 ? ((summary.totalRevenue - breakEvenRevenue) / summary.totalRevenue) * 100 : 0;

    return {
      period: summary.period,
      totalRevenue: summary.totalRevenue,
      revenueByType,
      totalCosts: summary.totalCosts,
      costsByType,
      grossProfit: summary.grossProfit,
      grossProfitMargin: summary.profitMargin,
      depreciation: 0,
      interest: 0,
      netProfit: summary.grossProfit,
      netProfitMargin: summary.profitMargin,
      breakEvenRevenue,
      safetyMargin,
      costPerEgg: summary.costPerPoultry,
      revenuePerEgg: null,
      profitPerEgg: null,
      costPerLiter: summary.costPerDairyCow,
      revenuePerLiter: null,
      profitPerLiter: null,
      costPerKgMeat: summary.costPerSmallRuminant,
      revenuePerKgMeat: null,
      profitPerKgMeat: null,
    };
  }

  async getFinancialHealth(farmId: string, currentCash: number = 0): Promise<FinancialHealthDto> {
    const today = new Date();
    const currentPeriod = today.toISOString().substring(0, 7);
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1);
    const prevPeriod = prevDate.toISOString().substring(0, 7);

    let currentSummary: FinancialSummaryDto;
    let previousSummary: FinancialSummaryDto;

    try {
      currentSummary = await this.getFinancialSummary(farmId, currentPeriod);
    } catch {
      currentSummary = this.createEmptyFinancialSummary(farmId, currentPeriod);
    }

    try {
      previousSummary = await this.getFinancialSummary(farmId, prevPeriod);
    } catch {
      previousSummary = currentSummary;
    }

    const safeCash = this.toNumber(currentCash);
    const safePayable = this.toNumber(currentSummary.accountsPayable);

    const profitabilityScore = currentSummary.totalRevenue > 0 ? Math.min(100, (currentSummary.profitMargin / 30) * 100) : 0;
    const liquidityScore = safeCash > safePayable ? 100 : safeCash > safePayable * 0.5 ? 50 : 25;
    const solvencyScore = 80;
    const efficiencyScore = currentSummary.totalRevenue > 0 && (currentSummary.totalCosts + currentSummary.grossProfit) > 0
      ? 100 - (currentSummary.totalCosts / (currentSummary.totalCosts + currentSummary.grossProfit)) * 100
      : 0;

    const overallScore = (profitabilityScore + liquidityScore + solvencyScore + efficiencyScore) / 4;

    const revenueTrend = this.calculateTrend(currentSummary.totalRevenue, previousSummary.totalRevenue) ?? 0;
    const profitTrend = this.calculateTrend(currentSummary.grossProfit, previousSummary.grossProfit) ?? 0;
    const costTrend = this.calculateTrend(currentSummary.totalCosts, previousSummary.totalCosts) ?? 0;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    if (currentSummary.profitMargin > 30) strengths.push('Excellent profit margins');
    else if (currentSummary.profitMargin > 15) strengths.push('Good profit margins');
    if (liquidityScore === 100) strengths.push('Strong cash position');

    if (costTrend > 15) weaknesses.push(`Costs rising rapidly (${costTrend.toFixed(1)}%)`);
    if (currentSummary.profitMargin < 5) weaknesses.push('Very thin profit margins');

    if (revenueTrend > 10) opportunities.push('Revenue is growing - scale operations?');
    if (costTrend < -10) opportunities.push('Cost efficiency improving - reinvest savings?');

    if (costTrend > 10) threats.push('Rising input costs');
    if (safeCash < safePayable) threats.push('Cash shortage risk');

    const riskLevel = overallScore > 70 ? 'low' : overallScore > 40 ? 'medium' : 'high';
    const actionItems: string[] = [];

    if (riskLevel === 'high') {
      actionItems.push('Create emergency cash reserve', 'Review and reduce costs');
    }
    if (revenueTrend < 0) actionItems.push('Investigate revenue decline');
    if (costTrend > 10) actionItems.push('Negotiate better supplier terms');

    return {
      overallScore: Math.round(overallScore),
      profitabilityScore: Math.round(profitabilityScore),
      liquidityScore: Math.round(liquidityScore),
      solvencyScore: Math.round(solvencyScore),
      efficiencyScore: Math.round(efficiencyScore),
      debtToEquity: 0,
      currentRatio: safePayable > 0 ? safeCash / safePayable : 0,
      quickRatio: safePayable > 0 ? safeCash / safePayable : 0,
      revenueTrend,
      profitTrend,
      costTrend,
      strengths,
      weaknesses,
      opportunities,
      threats,
      riskLevel,
      actionItems,
    };
  }

  async createCashFlowForecast(
    farmId: string,
    userId: string,
    dto: CreateCashFlowForecastDto,
  ): Promise<CashFlowForecast> {
    const forecast = this.forecastRepo.create({
      ...dto,
      farmId,
      forecastDate: new Date(),
      requiredByDate: new Date(dto.requiredByDate),
      recordedBy: userId,
      estimatedAmount: this.toNumber(dto.estimatedAmount),
    });
    return  await this.forecastRepo.save(forecast);
  }

  async getCashFlowSummary(farmId: string, currentCash: number = 0): Promise<CashFlowSummaryDto> {
    const today = new Date();
    const nextSeven = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextThirty = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nextNinety = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const forecasts = await this.forecastRepo.find({
      where: { farmId, requiredByDate: Between(today, nextNinety) },
    });

    const nextSevenDaysTotal = forecasts.filter(f => f.requiredByDate <= nextSeven).reduce((sum, f) => sum + this.toNumber(f.estimatedAmount), 0);
    const nextThirtyDaysTotal = forecasts.filter(f => f.requiredByDate <= nextThirty).reduce((sum, f) => sum + this.toNumber(f.estimatedAmount), 0);
    const nextNinetyDaysTotal = forecasts.reduce((sum, f) => sum + this.toNumber(f.estimatedAmount), 0);

    const byCategory = Object.values(CostCategory).map(cat => ({
      category: cat,
      nextSevenDays: forecasts.filter(f => f.category === cat && f.requiredByDate <= nextSeven).reduce((sum, f) => sum + this.toNumber(f.estimatedAmount), 0),
      nextThirtyDays: forecasts.filter(f => f.category === cat && f.requiredByDate <= nextThirty).reduce((sum, f) => sum + this.toNumber(f.estimatedAmount), 0),
    })).filter(c => c.nextSevenDays > 0);

    const safeCash = this.toNumber(currentCash);
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let warningMessage: string | null = null;

    if (safeCash < nextSevenDaysTotal) {
      riskLevel = 'high';
      warningMessage = `⚠️ Cash shortage of ${(nextSevenDaysTotal - safeCash).toFixed(0)} KES in next 7 days`;
    } else if (safeCash < nextThirtyDaysTotal) {
      riskLevel = 'medium';
      warningMessage = `⚠️ Tight cash in next 30 days`;
    }

    return {
      currentCash: safeCash,
      nextSevenDays: nextSevenDaysTotal,
      nextThirtyDays: nextThirtyDaysTotal,
      nextNinetyDays: nextNinetyDaysTotal,
      byCategory,
      riskLevel,
      warningMessage,
    };
  }

  async createBudgetLine(
    farmId: string,
    period: string,
    userId: string,
    dto: CreateBudgetLineDto,
  ): Promise<BudgetLine> {
    const budgetedAmount = this.toNumber(dto.budgetedAmount);
    const line =  await this.budgetRepo.create({
      ...dto,
      farmId,
      period,
      budgetedAmount,
      actualSpent: 0,
      variance: budgetedAmount,
      variancePercent: 0,
      createdBy: userId,
    });
    return  await this.budgetRepo.save(line);
  }

  async getBudgetSummary(farmId: string, period: string): Promise<BudgetSummaryDto> {
    const budgets = await this.budgetRepo.find({ where: { farmId, period } });
    if (budgets.length === 0) throw new NotFoundException(`No budgets for ${period}`);

    const totalBudgeted = budgets.reduce((sum, b) => sum + this.toNumber(b.budgetedAmount), 0);
    const totalActualSpent = budgets.reduce((sum, b) => sum + this.toNumber(b.actualSpent), 0);
    const totalVariance = totalBudgeted - totalActualSpent;
    const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    const onTrack = budgets.filter(b => b.variancePercent >= 0).map(b => b.category);
    const overBudget = budgets.filter(b => b.variancePercent < 0).map(b => ({ category: b.category, overage: b.actualSpent - b.budgetedAmount }));
    const underBudget = budgets.filter(b => b.variancePercent > 0).map(b => ({ category: b.category, savings: b.budgetedAmount - b.actualSpent }));

    return {
      period,
      budgets: budgets.map(b => ({
        id: b.id,
        farmId: b.farmId,
        period: b.period,
        category: b.category,
        budgetedAmount: b.budgetedAmount,
        actualSpent: b.actualSpent,
        remaining: b.budgetedAmount - b.actualSpent,
        variancePercent: b.variancePercent,
        percentOfBudget: b.budgetedAmount > 0 ? (b.actualSpent / b.budgetedAmount) * 100 : 0,
        notes: b.notes,
      })),
      totalBudgeted,
      totalActualSpent,
      totalVariance,
      totalVariancePercent,
      onTrack,
      overBudget,
      underBudget,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────

  private toNumber(value: unknown): number {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const numeric = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  private calculateTrend(current: number, previous: number): number | null {
    const safeCurrent = this.toNumber(current);
    const safePrevious = this.toNumber(previous);
    if (safePrevious === 0) return null;
    const trend = ((safeCurrent - safePrevious) / safePrevious) * 100;
    return Number.isFinite(trend) ? trend : null;
  }

  private calculateCostPerAnimal(
    totalCosts: number,
    animalCounts: { poultry: number; dairy: number; smallRuminants: number },
  ): { poultry?: number; dairy?: number; smallRuminants?: number } | null {
    const safeCosts = this.toNumber(totalCosts);
    if (safeCosts <= 0) return null;

    const result: { poultry?: number; dairy?: number; smallRuminants?: number } = {};
    if (animalCounts.poultry > 0) result.poultry = safeCosts / animalCounts.poultry;
    if (animalCounts.dairy > 0) result.dairy = safeCosts / animalCounts.dairy;
    if (animalCounts.smallRuminants > 0) result.smallRuminants = safeCosts / animalCounts.smallRuminants;
    return Object.keys(result).length > 0 ? result : null;
  }

  private validateSummaryNumbers(summary: FinancialSummary): void {
    const fields: Array<keyof FinancialSummary> = [
      'totalCosts', 'totalRevenue', 'grossProfit', 'profitMargin',
      'cashInflow', 'cashOutflow', 'netCashFlow', 'accountsPayable', 'accountsReceivable', 'version',
    ];

    for (const field of fields) {
      const value = summary[field] as unknown;
      const numeric = this.toNumber(value);
      if (!Number.isFinite(numeric)) {
        this.logger.warn(`Invalid ${String(field)}: ${value}, resetting to 0`);
        (summary as any)[field] = 0;
      } else {
        (summary as any)[field] = numeric;
      }
    }
  }

  private createEmptyFinancialSummary(farmId: string, period: string): FinancialSummaryDto {
    const [year, month] = period.split('-');
    const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const periodEnd = new Date(parseInt(year), parseInt(month), 0);

    return {
      period,
      periodStart,
      periodEnd,
      costsByCategory: [],
      totalCosts: 0,
      revenueByCategory: [],
      totalRevenue: 0,
      grossProfit: 0,
      profitMargin: 0,
      costPerPoultry: null,
      costPerDairyCow: null,
      costPerSmallRuminant: null,
      cashInflow: 0,
      cashOutflow: 0,
      netCashFlow: 0,
      accountsPayable: 0,
      accountsReceivable: 0,
      poultryCount: 0,
      dairyCowCount: 0,
      smallRuminantCount: 0,
    };
  }

  private async getAnimalCounts(farmId: string): Promise<{ poultry: number; dairy: number; smallRuminants: number }> {
    // TODO: Integrate with actual modules
    return { poultry: 0, dairy: 0, smallRuminants: 0 };
  }
}