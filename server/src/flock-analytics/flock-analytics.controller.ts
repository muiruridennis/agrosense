import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { FlockAnalyticsService } from './flock-analytics.service';

import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';

/**
 * All routes here are read-only, so unlike FlockController's write routes
 * this doesn't add FarmRoleGuard — any farm member can view analytics for
 * a flock they already have access to.
 */
@Controller('farms/:farmId/flocks/:flockId')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class FlockAnalyticsController {
  constructor(private readonly analyticsService: FlockAnalyticsService) {}

  @Get('summary')
  getSummary(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.analyticsService.getFlockSummary(flockId, farmId);
  }

  @Get('mortality-breakdown')
  getMortalityBreakdown(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.analyticsService.getMortalityBreakdown(flockId, farmId);
  }

  @Get('feed-efficiency')
  getFeedEfficiency(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.analyticsService.getFeedEfficiency(flockId, farmId);
  }

  /** GET .../egg-production-trend?days=7 */
  @Get('egg-production-trend')
  getEggProductionTrend(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getEggProductionTrend(
      flockId,
      farmId,
      days ? +days : undefined,
    );
  }

  /** GET .../growth-trend?days=14 */
  @Get('growth-trend')
  getGrowthTrend(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getGrowthTrend(
      flockId,
      farmId,
      days ? +days : undefined,
    );
  }

  /** GET .../forecast?targetWeightKg=2.5 */
  @Get('forecast')
  getForecast(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Query('targetWeightKg') targetWeightKg?: string,
  ) {
    if (!targetWeightKg) {
      throw new BadRequestException(
        'targetWeightKg query param is required to forecast growth',
      );
    }
    return this.analyticsService.forecastGrowth(
      flockId,
      farmId,
      parseFloat(targetWeightKg),
    );
  }
}
