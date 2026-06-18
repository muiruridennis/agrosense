import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PoultryService } from './poultry.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard, RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import {
  CreatePoultryHouseDto,
  UpdatePoultryHouseDto,
  CreateFlockDto,
  UpdateFlockDto,
  CreateFlockRecordDto,
  UpdateFlockRecordDto,
  ReviewFlockRecordDto,
  RecordBirdSaleDto,
} from './dto/poultry.dto';

/**
 * PoultryController
 *
 * All routes are farm-scoped under /farms/:farmId/poultry.
 *
 * ⚠️ ROUTE ORDERING IS CRITICAL:
 *   Specific routes (e.g., /flocks/:id/summary) MUST come before
 *   dynamic routes (e.g., /flocks/:id) to prevent nesting conflicts.
 *
 * Authorization layers applied to every request:
 *   1. JwtAuthenticationGuard  — valid token required
 *   2. FarmAccessGuard         — user must be an active member of :farmId
 *   3. FarmRoleGuard           — write/sensitive routes require OWNER or MANAGER
 *   4. Service ownership check — houseId / flockId / recordId must belong to :farmId
 */
@Controller('farms/:farmId/poultry')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class PoultryController {
  constructor(private readonly poultryService: PoultryService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // HOUSES
  // ═══════════════════════════════════════════════════════════════════════════

  /** GET /farms/:farmId/poultry/houses */
  @Get('houses')
  getHouses(@Param('farmId') farmId: string) {
    return this.poultryService.getHouses(farmId);
  }

  /** POST /farms/:farmId/poultry/houses */
  @Post('houses')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  createHouse(
    @Param('farmId') farmId: string,
    @Body() dto: CreatePoultryHouseDto,
  ) {
    return this.poultryService.createHouse(farmId, dto);
  }

  /** GET /farms/:farmId/poultry/houses/:houseId */
  @Get('houses/:houseId')
  getHouse(@Param('houseId') houseId: string) {
    return this.poultryService.getHouse(houseId);
  }

  /** PATCH /farms/:farmId/poultry/houses/:houseId */
  @Patch('houses/:houseId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  updateHouse(
    @Param('houseId') houseId: string,
    @Body() dto: UpdatePoultryHouseDto,
  ) {
    return this.poultryService.updateHouse(houseId, dto);
  }

  /** DELETE /farms/:farmId/poultry/houses/:houseId */
  @Delete('houses/:houseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  deleteHouse(@Param('houseId') houseId: string) {
    return this.poultryService.deleteHouse(houseId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOCKS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // ⚠️ ORDER MATTERS: Specific routes FIRST, then dynamic routes.
  //    /flocks/:id/summary → BEFORE → /flocks/:id
  //

  /** GET /farms/:farmId/poultry/houses/:houseId/flocks */
  @Get('houses/:houseId/flocks')
  getFlocks(@Param('houseId') houseId: string) {
    return this.poultryService.getFlocks(houseId);
  }

  /** POST /farms/:farmId/poultry/houses/:houseId/flocks */
  @Post('houses/:houseId/flocks')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  createFlock(
    @Param('houseId') houseId: string,
    @Body() dto: CreateFlockDto,
  ) {
    return this.poultryService.createFlock(houseId, dto);
  }

  // ── Flock specific routes (must come before /flocks/:id) ────────────────

  /** GET /farms/:farmId/poultry/flocks/:flockId/summary */
  @Get('flocks/:flockId/summary')
  getFlockSummary(@Param('flockId') flockId: string) {
    return this.poultryService.getFlockSummary(flockId);
  }

  @Get('flocks/:flockId/forecast')
  getFlockForecast(@Param('flockId') flockId: string) {
    return this.poultryService.forecastFlockPerformance(flockId);
  }

  /** GET /farms/:farmId/poultry/flocks/:flockId/performance */
  @Get('flocks/:flockId/performance')
  getFlockPerformance(@Param('flockId') flockId: string) {
    return this.poultryService.benchmarkFlockPerformance(flockId);
  }

  /** PATCH /farms/:farmId/poultry/flocks/:flockId/close */
  @Patch('flocks/:flockId/close')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  closeFlock(@Param('flockId') flockId: string) {
    return this.poultryService.closeFlock(flockId);
  }

  /** POST /farms/:farmId/poultry/flocks/:flockId/sales */
  @Post('flocks/:flockId/sales')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  recordBirdSale(
    @Param('flockId') flockId: string,
    @Body() dto: RecordBirdSaleDto,
  ) {
    return this.poultryService.recordBirdSale(flockId, {
      ...dto,
      saleDate: new Date(dto.saleDate),
    });
  }

  // ── Flock dynamic routes (must come AFTER all specific routes) ─────────

  /** GET /farms/:farmId/poultry/flocks/:flockId */
  @Get('flocks/:flockId')
  getFlock(@Param('farmId') farmId: string, @Param('flockId') flockId: string) {
    return this.poultryService.getFlock(flockId);
  }

  /** PATCH /farms/:farmId/poultry/flocks/:flockId */
  @Patch('flocks/:flockId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  updateFlock(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Body() dto: UpdateFlockDto,
  ) {
    return this.poultryService.updateFlock(flockId, dto);
  }

  /** DELETE /farms/:farmId/poultry/flocks/:flockId */
  @Delete('flocks/:flockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  deleteFlock(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.poultryService.deleteFlock(flockId, farmId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOCK RECORDS
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // ⚠️ ORDER MATTERS: Specific routes FIRST, then dynamic routes.
  //    /records/:id/submit → BEFORE → /records/:id
  //

  /** GET /farms/:farmId/poultry/flocks/:flockId/records */
  @Get('flocks/:flockId/records')
  getRecords(
    @Param('flockId') flockId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.poultryService.getRecords(flockId, +page, +limit);
  }

  /** POST /farms/:farmId/poultry/flocks/:flockId/records */
  @Post('flocks/:flockId/records')
  createRecord(
    @Param('flockId') flockId: string,
    @Body() dto: CreateFlockRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.poultryService.createRecord(flockId, req.user.id, dto);
  }

  /** GET /farms/:farmId/poultry/flocks/:flockId/records/today */
  @Get('flocks/:flockId/records/today')
  async hasTodayRecord(@Param('flockId') flockId: string) {
    const { records } = await this.poultryService.getRecords(flockId, 1, 1);

    if (!records || records.length === 0) {
      return { exists: false, record: null, status: null };
    }

    const rec = records[0];
    const recDate = new Date(rec.recordDate).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const exists = recDate === today;

    return {
      exists,
      record: exists ? rec : null,
      status: exists ? rec.status : null,
    };
  }

  /** GET /farms/:farmId/poultry/flocks/:flockId/records/pending-review */
  @Get('flocks/:flockId/records/pending-review')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  async getPendingReviewRecords(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.poultryService.getPendingReviewRecords(flockId, +page, +limit);
  }

  // ── Record specific routes (must come before /records/:id) ─────────────

  /** PATCH /farms/:farmId/poultry/records/:recordId/submit */
  @Patch('records/:recordId/submit')
  @HttpCode(HttpStatus.OK)
  submitRecord(
    @Param('recordId') recordId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.poultryService.submitRecord(recordId, req.user.id);
  }

  /** PATCH /farms/:farmId/poultry/records/:recordId/review */
  @Patch('records/:recordId/review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  reviewRecord(
    @Param('recordId') recordId: string,
    @Body() dto: ReviewFlockRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.poultryService.reviewRecord(recordId, req.user.id, dto);
  }

  // ── Record dynamic routes (must come AFTER all specific routes) ────────

  /** GET /farms/:farmId/poultry/records/:recordId */
  @Get('records/:recordId')
  getRecord(@Param('recordId') recordId: string) {
    return this.poultryService.getRecords(recordId);
  }

  /** PATCH /farms/:farmId/poultry/records/:recordId */
  @Patch('records/:recordId')
  updateRecord(
    @Param('recordId') recordId: string,
    @Body() dto: UpdateFlockRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.poultryService.updateRecord(recordId, req.user.id, dto);
  }

  /** DELETE /farms/:farmId/poultry/records/:recordId */
  @Delete('records/:recordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  deleteRecord(@Param('recordId') recordId: string) {
    return this.poultryService.deleteRecord(recordId);
  }
}
