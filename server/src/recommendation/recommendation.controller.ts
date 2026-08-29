// recommendation/recommendation.controller.ts

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';

@Controller('farms/:farmId/flocks/:flockId/recommendations')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
  async getRecommendations(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.recommendationService.generateRecommendations(flockId, farmId);
  }
}