// insight/insight.controller.ts

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InsightService } from './insight.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';

@Controller('farms/:farmId/flocks/:flockId/insights')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class InsightController {
  constructor(private readonly insightService: InsightService) {}

  @Get()
  async getInsights(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.insightService.generateInsights(flockId, farmId);
  }
}