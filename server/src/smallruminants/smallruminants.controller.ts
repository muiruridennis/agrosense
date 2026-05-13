import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SmallRuminantsService } from './smallruminants.service';
import {
  CreateRuminantDto,
  UpdateRuminantDto,
  CreateGrowthRecordDto,
  UpdateGrowthRecordDto,
  CreateBreedingRecordDto,
  UpdateBreedingRecordDto,
  ConfirmBreedingPregnancyDto,
  UpdateHealthEventDto,
  ResolveHealthEventDto,
} from './dto/smallruminants.dto';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { CreateHealthEventDto } from '../health-event/dto//create-health-event.dto';
import { AnimalType } from '../health-event/entities/health-event.entity';

@UseGuards(JwtAuthenticationGuard)
@Controller('smallruminants')
export class SmallRuminantsController {
  constructor(private readonly smallRuminantsService: SmallRuminantsService) {}

  // ── RUMINANT MANAGEMENT ────────────────────────────────────────────────────

  /**
   * POST /smallruminants/farms/:farmId/ruminants
   * Create a new goat or sheep on the farm.
   */
  @Post('farms/:farmId/ruminants')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  createRuminant(
    @Param('farmId') farmId: string,
    @Body() dto: CreateRuminantDto,
  ) {
    return this.smallRuminantsService.createRuminant(farmId, dto);
  }

  /**
   * GET /smallruminants/farms/:farmId/ruminants
   * List all ruminants on a farm.
   */
  @Get('farms/:farmId/ruminants')
  @UseGuards(FarmAccessGuard)
  getRuminants(@Param('farmId') farmId: string) {
    return this.smallRuminantsService.getRuminants(farmId);
  }

  /**
   * GET /smallruminants/ruminants/:ruminantId
   * Get a single ruminant with full details.
   */
  @Get('ruminants/:ruminantId')
  getRuminant(
    @Param('ruminantId') ruminantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.getRuminant(ruminantId, req.user.id);
  }

  /**
   * PATCH /smallruminants/ruminants/:ruminantId
   * Update ruminant details.
   */
  @Patch('ruminants/:ruminantId')
  updateRuminant(
    @Param('ruminantId') ruminantId: string,
    @Body() dto: UpdateRuminantDto,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.updateRuminant(
      ruminantId,
      req.user.id,
      dto,
    );
  }

  /**
   * DELETE /smallruminants/ruminants/:ruminantId
   * Remove a ruminant (soft delete via status).
   */
  @Delete('ruminants/:ruminantId')
  removeRuminant(
    @Param('ruminantId') ruminantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.removeRuminant(ruminantId, req.user.id);
  }

  // ── GROWTH RECORDS ─────────────────────────────────────────────────────────

  /**
   * POST /smallruminants/ruminants/:ruminantId/growth
   * Record a weighing (growth record).
   */
  @Post('ruminants/:ruminantId/growth')
  recordGrowth(
    @Param('ruminantId') ruminantId: string,
    @Body() dto: CreateGrowthRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.recordGrowth(
      ruminantId,
      req.user.id,
      dto,
    );
  }

  /**
   * GET /smallruminants/ruminants/:ruminantId/growth
   * Get all growth records for a ruminant.
   */
  @Get('ruminants/:ruminantId/growth')
  getGrowthRecords(
    @Param('ruminantId') ruminantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.getGrowthRecords(ruminantId, req.user.id);
  }

  /**
   * GET /smallruminants/ruminants/:ruminantId/growth-trend
   * Get growth trend for specified period (days parameter).
   */
  @Get('ruminants/:ruminantId/growth-trend')
  getGrowthTrend(
    @Param('ruminantId') ruminantId: string,
    @Query('days') days?: string,
    @Req() req?: RequestWithUser,
  ) {
    return this.smallRuminantsService.getGrowthTrend(
      ruminantId,
      req!.user.id,
      days ? parseInt(days) : 30,
    );
  }

  // ── BREEDING RECORDS ───────────────────────────────────────────────────────

  /**
   * POST /smallruminants/ruminants/:ruminantId/breeding
   * Record a mating/breeding event.
   */
  @Post('ruminants/:ruminantId/breeding')
  recordBreeding(
    @Param('ruminantId') ruminantId: string,
    @Body() dto: CreateBreedingRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.recordBreeding(
      ruminantId,
      req.user.id,
      dto,
    );
  }

  /**
   * GET /smallruminants/ruminants/:ruminantId/breeding
   * Get breeding history for a ruminant.
   */
  @Get('ruminants/:ruminantId/breeding')
  getBreedingRecords(
    @Param('ruminantId') ruminantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.getBreedingRecords(
      ruminantId,
      req.user.id,
    );
  }

  /**
   * PATCH /smallruminants/breeding/:recordId/confirm
   * Confirm pregnancy (after palpation/scan).
   */
  @Patch('breeding/:recordId/confirm')
  confirmBreedingPregnancy(
    @Param('recordId') recordId: string,
    @Body() dto: ConfirmBreedingPregnancyDto,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.confirmBreedingPregnancy(
      recordId,
      req.user.id,
      dto,
    );
  }

  /**
   * PATCH /smallruminants/breeding/:recordId/unsuccessful
   * Mark breeding as unsuccessful (came back in heat).
   */
  @Patch('breeding/:recordId/unsuccessful')
  markBreedingUnsuccessful(
    @Param('recordId') recordId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.markBreedingUnsuccessful(
      recordId,
      req.user.id,
    );
  }

  // ── HEALTH EVENTS ──────────────────────────────────────────────────────────

  /**
   * POST /smallruminants/ruminants/:ruminantId/health-events
   * Log a health issue (parasites, lameness, injury, etc).
   */
  @Post('ruminants/:ruminantId/health-events')
  async recordHealthEvent(
    @Param('ruminantId') ruminantId: string,
    @Body() dto: CreateHealthEventDto,
    @Req() req: RequestWithUser,
  ) {
    // Ensure animalType is set to SMALL_RUMINANT before delegating to service
    const dtoWithType: CreateHealthEventDto = {
      ...dto,
      animalType: AnimalType.RUMINANT,
      animalId: ruminantId,
    };
    return this.smallRuminantsService.recordHealthEvent(
      req.user.id,
      req.user.id,
      dtoWithType,
    );
  }

  /**
   * GET /smallruminants/ruminants/:ruminantId/health-events
   * Get health history for a ruminant.
   */
  @Get('ruminants/:ruminantId/health-events')
  getHealthEvents(
    @Param('ruminantId') ruminantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.getHealthEvents(
      AnimalType.RUMINANT,
      ruminantId,
    );
  }

  /**
   * PATCH /smallruminants/health-events/:eventId/resolve
   * Mark a health issue as resolved.
   */
  @Patch('health-events/:eventId/resolve')
  resolveHealthEvent(
    @Param('eventId') eventId: string,
    @Body() dto: ResolveHealthEventDto,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.resolveHealthEvent(
      eventId,
      req.user.id,
      dto,
    );
  }

  // ── DASHBOARDS & SUMMARIES ────────────────────────────────────────────────

  /**
   * GET /smallruminants/ruminants/:ruminantId/summary
   * Get comprehensive summary for a single ruminant.
   */
  @Get('ruminants/:ruminantId/summary')
  getRuminantSummary(
    @Param('ruminantId') ruminantId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.getRuminantSummary(
      ruminantId,
      req.user.id,
    );
  }

  /**
   * GET /smallruminants/farms/:farmId/summary
   * Get farm-wide small ruminants overview (dashboard).
   */
  @Get('farms/:farmId/summary')
  getFarmSmallRuminantsSummary(
    @Param('farmId') farmId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.getFarmSmallRuminantsSummary(
      farmId,
      req.user.id,
    );
  }

  /**
   * GET /smallruminants/farms/:farmId/breeding-calendar
   * Get breeding calendar (upcoming heats, births, checks).
   */
  @Get('farms/:farmId/breeding-calendar')
  getBreedingCalendar(
    @Param('farmId') farmId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.smallRuminantsService.getBreedingCalendar(farmId, req.user.id);
  }
}
