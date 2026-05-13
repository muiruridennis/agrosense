// src/financial/finance.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard, RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateCostEntryDto,
  CreateRevenueEntryDto,
  RecordPaymentDto,
  CreateCashFlowForecastDto,
  CreateBudgetLineDto,
} from './dtos/finance.dto';
import { CostCategory } from './enums/cost-category.enum';
import { RevenueCategory } from './enums/revenue-category.enum';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('finance')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // COST TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record a cost entry (feed, medication, labor, etc)
   * Requires: MANAGER or OWNER
   */
  @Post('farms/:farmId/costs')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async recordCost(
    @Param('farmId') farmId: string,
    @Body() dto: CreateCostEntryDto,
    @Req() req: RequestWithUser,
  ) {
    const { user } = req;
    return await this.financeService.recordCost(farmId, user.id, dto);
  }

  /**
   * Get all costs for a farm in a date range
   * Requires: Any authenticated farm member
   */
  @Get('farms/:farmId/costs')
  async getCosts(
    @Param('farmId') farmId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('category') category?: CostCategory,
  ) {
    return await this.financeService.getCosts(
      farmId,
      new Date(startDate),
      new Date(endDate),
      category,
    );
  }

  /**
   * Record payment for a cost entry
   * Requires: MANAGER or OWNER
   */
  @Patch('farms/:farmId/costs/:costId/pay')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async recordCostPayment(
    @Param('farmId') farmId: string,
    @Param('costId') costId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return  await this.financeService.recordCostPayment(farmId, costId, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUE TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record revenue (egg sales, milk sales, animal sales, etc)
   * Requires: MANAGER or OWNER
   */
  @Post('farms/:farmId/revenue')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async recordRevenue(
    @Param('farmId') farmId: string,
    @Body() dto: CreateRevenueEntryDto,
    @Req() req: RequestWithUser,
  ) {
    return  await this.financeService.recordRevenue(farmId, req.user.id, dto);
  }

  /**
   * Get all revenue for a farm in a date range
   * Requires: Any authenticated farm member
   */
  @Get('farms/:farmId/revenue')
  async getRevenue(
    @Param('farmId') farmId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('category') category?: RevenueCategory,
  ) {
    return await  this.financeService.getRevenue(
      farmId,
      new Date(startDate),
      new Date(endDate),
      category,
    );
  }

  /**
   * Record payment for revenue
   * Requires: MANAGER or OWNER
   */
  @Patch('farms/:farmId/revenue/:revenueId/pay')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async recordRevenuePayment(
    @Param('farmId') farmId: string,
    @Param('revenueId') revenueId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return  await this.financeService.recordRevenuePayment(
      farmId,
      revenueId,
      dto,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCIAL SUMMARIES & REPORTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get financial summary for a specific period
   * Requires: Any authenticated farm member
   */
  @Get('farms/:farmId/summary/:period')
  async getFinancialSummary(
    @Param('farmId') farmId: string,
    @Param('period') period: string, // "2025-01"
  ) {
    return  await this.financeService.getFinancialSummary(farmId, period);
  }

  /**
   * Compare two financial periods
   * Requires: MANAGER or OWNER
   */
  @Get('farms/:farmId/compare')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async comparePeriods(
    @Param('farmId') farmId: string,
    @Query('current') currentPeriod: string,
    @Query('previous') previousPeriod: string,
  ) {
    return  await this.financeService.compareFinancialPeriods(
      farmId,
      currentPeriod,
      previousPeriod,
    );
  }

  /**
   * Get Profit & Loss statement
   * Requires: MANAGER or OWNER
   */
  @Get('farms/:farmId/pl/:period')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async getProfitAndLoss(
    @Param('farmId') farmId: string,
    @Param('period') period: string,
  ) {
    return await  this.financeService.getProfitAndLoss(farmId, period);
  }

  /**
   * Get financial health assessment
   * Requires: OWNER only (sensitive financial data)
   */
  @Get('farms/:farmId/health')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  async getFinancialHealth(
    @Param('farmId') farmId: string,
    @Query('currentCash') currentCash?: string,
  ) {
    const cash = currentCash ? parseFloat(currentCash) : 0;
    return  await this.financeService.getFinancialHealth(farmId, cash);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CASH FLOW MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a cash flow forecast
   * Requires: MANAGER or OWNER
   */
  @Post('farms/:farmId/cashflow/forecast')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async createCashFlowForecast(
    @Param('farmId') farmId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateCashFlowForecastDto,
  ) {
    const { user } = req;
    return  await this.financeService.createCashFlowForecast(farmId, user.id, dto);
  }

  /**
   * Get cash flow summary (next 7, 30, 90 days)
   * Requires: MANAGER or OWNER
   */
  @Get('farms/:farmId/cashflow/summary')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async getCashFlowSummary(
    @Param('farmId') farmId: string,
    @Query('currentCash') currentCash?: string,
  ) {
    const cash = currentCash ? parseFloat(currentCash) : 0;
    return  await this.financeService.getCashFlowSummary(farmId, cash);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUDGETING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a budget line
   * Requires: OWNER only (setting budgets)
   */
  @Post('farms/:farmId/budgets/:period')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  async createBudgetLine(
    @Param('farmId') farmId: string,
    @Param('period') period: string,
    @Req() req: RequestWithUser,

    @Body() dto: CreateBudgetLineDto,
  ) {
    const { user } = req;
    return  await this.financeService.createBudgetLine(farmId, period, user.id, dto);
  }

  /**
   * Get budget summary for a period
   * Requires: MANAGER or OWNER
   */
  @Get('farms/:farmId/budgets/:period')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async getBudgetSummary(
    @Param('farmId') farmId: string,
    @Param('period') period: string,
  ) {
    return this.financeService.getBudgetSummary(farmId, period);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Trigger manual recalculation of financial summary
   * Requires: OWNER only
   */
  @Post('farms/:farmId/recalculate')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  async recalculateSummary(
    @Param('farmId') farmId: string,
    @Query('date') date: string,
  ) {
    return this.financeService.recalculateFinancialSummary(
      farmId,
      new Date(date),
    );
  }

  /**
   * Get available cost categories
   * Public metadata endpoint
   */
  @Get('categories/costs')
  async getCostCategories() {
    return Object.values(CostCategory);
  }

  /**
   * Get available revenue categories
   * Public metadata endpoint
   */
  @Get('categories/revenue')
  async getRevenueCategories() {
    return Object.values(RevenueCategory);
  }
}
