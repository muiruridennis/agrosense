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
import { DairyService } from './dairy.service';
import {
  CreateCowDto,
  UpdateCowDto,
  CreateLactationRecordDto,
  UpdateLactationRecordDto,
  ReviewLactationRecordDto,
  CreateBreedingRecordDto,
  UpdateBreedingRecordDto,
  ConfirmPregnancyDto,
  ResolveHealthEventDto,
} from './dto/dairy.dto';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { CreateHealthEventDto } from '../health-event/dto/create-health-event.dto';
import { AnimalType } from '../health-event/entities/health-event.entity';

/**
 * DairyController
 *
 * All authorization is handled by guards, not the service.
 * Service receives only farmId, cowId, userId (for audit trail)
 *
 * Guard hierarchy:
 * - JwtAuthenticationGuard: Verify token, load user
 * - FarmAccessGuard: Verify user has access to farm
 * - FarmRoleGuard + @RequiredRoles: Verify user has required role
 */
@UseGuards(JwtAuthenticationGuard)
@Controller('dairy')
export class DairyController {
  constructor(private readonly dairyService: DairyService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // COW MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /dairy/farms/:farmId/cows
   * Create a new cow on the farm
   * Only MANAGER/OWNER
   */
  @Post('farms/:farmId/cows')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async createCow(@Param('farmId') farmId: string, @Body() dto: CreateCowDto) {
    return this.dairyService.createCow(farmId, dto);
  }

  /**
   * GET /dairy/farms/:farmId/cows
   * List all cows on a farm
   * Any farm member
   */
  @Get('farms/:farmId/cows')
  @UseGuards(FarmAccessGuard)
  async getCows(@Param('farmId') farmId: string) {
    return this.dairyService.getCows(farmId);
  }

  /**
   * GET /dairy/cows/:cowId
   * Get a single cow with full details
   * Any farm member
   */
  @Get('cows/:cowId')
  @UseGuards(FarmAccessGuard)
  async getCow(@Param('cowId') cowId: string) {
    return this.dairyService.getCow(cowId);
  }

  /**
   * PATCH /dairy/cows/:cowId
   * Update cow details (name, breed, weight, etc)
   * Only MANAGER/OWNER
   */
  @Patch('cows/:cowId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async updateCow(@Param('cowId') cowId: string, @Body() dto: UpdateCowDto) {
    return this.dairyService.updateCow(cowId, dto);
  }

  /**
   * DELETE /dairy/cows/:cowId
   * Remove a cow (soft delete via status change)
   * Only MANAGER/OWNER
   */
  @Delete('cows/:cowId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async removeCow(@Param('cowId') cowId: string) {
    return this.dairyService.removeCow(cowId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LACTATION MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /dairy/cows/:cowId/start-lactation
   * Begin a new lactation cycle (cow freshened/gave birth)
   * Body: { freshenDate: "2025-11-15" }
   * Only MANAGER/OWNER
   */
  @Post('cows/:cowId/start-lactation')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async startLactation(
    @Param('cowId') cowId: string,
    @Body('freshenDate') freshenDate: string,
  ) {
    return this.dairyService.startLactation(cowId, freshenDate);
  }

  /**
   * POST /dairy/cows/:cowId/lactation-records
   * Record a day's milk yield (worker entry)
   * WORKER/MANAGER/OWNER
   */
  @Post('cows/:cowId/lactation-records')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(
    FarmMemberRole.WORKER,
    FarmMemberRole.MANAGER,
    FarmMemberRole.OWNER,
  )
  async recordMilk(
    @Param('cowId') cowId: string,
    @Body() dto: CreateLactationRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.dairyService.recordMilk(cowId, req.user.id, dto);
  }

  /**
   * GET /dairy/cows/:cowId/lactation-records
   * Get all milk records for a cow (paginated)
   * Any farm member
   */
  @Get('cows/:cowId/lactation-records')
  @UseGuards(FarmAccessGuard)
  async getLactationRecords(
    @Param('cowId') cowId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dairyService.getLactationRecords(
      cowId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 30,
    );
  }

  /**
   * PATCH /dairy/lactation-records/:recordId
   * Update a milk record (worker edits draft)
   * Worker can edit their own records
   */
  @Patch('lactation-records/:recordId')
  @UseGuards(FarmAccessGuard)
  async updateLactationRecord(
    @Param('recordId') recordId: string,
    @Body() dto: UpdateLactationRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.dairyService.updateLactationRecord(recordId, req.user.id, dto);
  }

  /**
   * PATCH /dairy/lactation-records/:recordId/submit
   * Submit milk record for manager review
   * Worker submits their own record
   */
  @Patch('lactation-records/:recordId/submit')
  @UseGuards(FarmAccessGuard)
  async submitLactationRecord(
    @Param('recordId') recordId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.dairyService.submitLactationRecord(recordId, req.user.id);
  }

  /**
   * PATCH /dairy/lactation-records/:recordId/review
   * Manager reviews and approves or flags record
   * Only MANAGER/OWNER
   */
  @Patch('lactation-records/:recordId/review')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async reviewLactationRecord(
    @Param('recordId') recordId: string,
    @Body() dto: ReviewLactationRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.dairyService.reviewLactationRecord(recordId, req.user.id, dto);
  }

  /**
   * PATCH /dairy/lactation-cycles/:cycleId/end
   * End a lactation cycle (dry off)
   * Only MANAGER/OWNER
   */
  @Patch('lactation-cycles/:cycleId/end')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async endLactation(
    @Param('cycleId') cycleId: string,
    @Body('dryOffDate') dryOffDate: string,
  ) {
    return this.dairyService.endLactation(cycleId, dryOffDate);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BREEDING MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /dairy/cows/:cowId/breeding
   * Record an insemination or mating
   * Only MANAGER/OWNER
   */
  @Post('cows/:cowId/breeding')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async recordBreeding(
    @Param('cowId') cowId: string,
    @Body() dto: CreateBreedingRecordDto,
  ) {
    return this.dairyService.recordBreeding(cowId, dto);
  }

  /**
   * GET /dairy/cows/:cowId/breeding
   * Get breeding history for a cow
   * Any farm member
   */
  @Get('cows/:cowId/breeding')
  @UseGuards(FarmAccessGuard)
  async getBreedingRecords(@Param('cowId') cowId: string) {
    return this.dairyService.getBreedingRecords(cowId);
  }

  /**
   * PATCH /dairy/breeding/:recordId
   * Update a breeding record
   * Only MANAGER/OWNER
   */
  @Patch('breeding/:recordId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async updateBreeding(
    @Param('recordId') recordId: string,
    @Body() dto: UpdateBreedingRecordDto,
  ) {
    return this.dairyService.updateBreeding(recordId, dto);
  }

  /**
   * PATCH /dairy/breeding/:recordId/confirm
   * Confirm pregnancy (after palpation/scan)
   * Only MANAGER/OWNER
   */
  @Patch('breeding/:recordId/confirm')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async confirmPregnancy(
    @Param('recordId') recordId: string,
    @Body() dto: ConfirmPregnancyDto,
  ) {
    return this.dairyService.confirmPregnancy(recordId, dto);
  }

  /**
   * PATCH /dairy/breeding/:recordId/unsuccessful
   * Mark breeding as unsuccessful (cow came back in heat)
   * Only MANAGER/OWNER
   */
  @Patch('breeding/:recordId/unsuccessful')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async markBreedingUnsuccessful(@Param('recordId') recordId: string) {
    return this.dairyService.markBreedingUnsuccessful(recordId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HEALTH MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /dairy/cows/:cowId/health-events
   * Log a health issue (mastitis, lameness, injury, etc)
   * WORKER/MANAGER/OWNER
   */
  @Post('farms/:farmId/cows/:cowId/health-events')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(
    FarmMemberRole.WORKER,
    FarmMemberRole.MANAGER,
    FarmMemberRole.OWNER,
  )
  async recordHealthEvent(
    @Param('farmId') farmId: string,
    @Param('cowId') cowId: string,
    @Body() dto: CreateHealthEventDto,
    @Req() req: RequestWithUser,
  ) {
    // Now you have farmId directly
    return await this.dairyService.recordHealthEvent(
      farmId,
      cowId,
      req.user.id,
      dto,
    );
  }

  /**
   * GET /dairy/cows/:cowId/health-events
   * Get health history for a cow
   * Any farm member
   */
  @Get('cows/:cowId/health-events')
  // @UseGuards(FarmAccessGuard)
  async getHealthEvents(@Param('cowId') cowId: string) {
    return this.dairyService.getHealthEvents(cowId);
  }

  /**
   * PATCH /dairy/health-events/:eventId/resolve
   * Mark a health issue as resolved
   * WORKER/MANAGER/OWNER
   */
  @Patch('health-events/:eventId/resolve')
  @UseGuards(FarmAccessGuard)
  async resolveHealthEvent(
    @Param('eventId') eventId: string,
    @Body() dto: ResolveHealthEventDto,
    @Req() req: RequestWithUser,
  ) {
    return this.dairyService.resolveHealthEvent(eventId, req.user.id, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARDS & SUMMARIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /dairy/cows/:cowId/summary
   * Get comprehensive summary for a single cow
   * Any farm member
   */
  @Get('cows/:cowId/summary')
  @UseGuards(FarmAccessGuard)
  async getCowSummary(@Param('cowId') cowId: string) {
    return this.dairyService.getCowSummary(cowId);
  }

  /**
   * GET /dairy/farms/:farmId/summary
   * Get farm-wide dairy overview (dashboard)
   * Any farm member
   */
  @Get('farms/:farmId/summary')
  @UseGuards(FarmAccessGuard)
  async getDairyFarmSummary(@Param('farmId') farmId: string) {
    return this.dairyService.getDairyFarmSummary(farmId);
  }

  /**
   * GET /dairy/farms/:farmId/breeding-calendar
   * Get breeding calendar (upcoming heats, births, pregnancy checks)
   * Any farm member
   */
  @Get('farms/:farmId/breeding-calendar')
  @UseGuards(FarmAccessGuard)
  async getBreedingCalendar(@Param('farmId') farmId: string) {
    return this.dairyService.getBreedingCalendar(farmId);
  }
}
