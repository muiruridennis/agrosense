import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PoultryService } from './poultry.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/guards/roles.guard';
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
} from './dto/poultry.dto';

@UseGuards(JwtAuthenticationGuard)
@Controller()
export class PoultryController {
  constructor(private readonly poultryService: PoultryService) {}

  // ── Houses ────────────────────────────────────────────────────────────────

  /** POST /farms/:farmId/poultry/houses */
  @Post('farms/:farmId/poultry/houses')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  createHouse(
    @Param('farmId') farmId: string,
    @Body() dto: CreatePoultryHouseDto,
  ) {
    return this.poultryService.createHouse(farmId, dto);
  }

  /** GET /farms/:farmId/poultry/houses */
  @Get('farms/:farmId/poultry/houses')
  @UseGuards(FarmAccessGuard)
  getHouses(@Param('farmId') farmId: string) {
    return this.poultryService.getHouses(farmId);
  }

  @Get('poultry/houses/:houseId')
  getHouse(@Param('houseId') houseId: string) {
    return this.poultryService.getHouse(houseId);
  }

  @Patch('poultry/houses/:houseId')
  updateHouse(
    @Param('houseId') houseId: string,
    @Body() dto: UpdatePoultryHouseDto,
  ) {
    return this.poultryService.updateHouse(houseId, dto);
  }

  // ── Flocks ────────────────────────────────────────────────────────────────

  @Post('poultry/houses/:houseId/flocks')
  createFlock(
    @Param('houseId') houseId: string,
    @Body() dto: CreateFlockDto,
  ) {
    return this.poultryService.createFlock(houseId, dto);
  }

  @Get('poultry/houses/:houseId/flocks')
  getFlocks(@Param('houseId') houseId: string,) {
    return this.poultryService.getFlocks(houseId);
  }

  /** PATCH /poultry/flocks/:flockId/close */
  @Patch('poultry/flocks/:flockId/close')
  @HttpCode(HttpStatus.OK)
  closeFlock(@Param('flockId') flockId: string,) {
    return this.poultryService.closeFlock(flockId);
  }

  /** GET /poultry/flocks/:flockId/summary */
  @Get('poultry/flocks/:flockId/summary')
  getFlockSummary(@Param('flockId') flockId: string) {
    return this.poultryService.getFlockSummary(flockId);
  }


  @Post('poultry/flocks/:flockId/records')
  createRecord(
    @Param('flockId') flockId: string,
    @Body() dto: CreateFlockRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.poultryService.createRecord(flockId, req.user.id, dto);
  }

  @Get('poultry/flocks/:flockId/records')
  getRecords(
    @Param('flockId') flockId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 30,
  ) {
    return this.poultryService.getRecords(flockId, +page, +limit);
  }

  @Patch('poultry/records/:recordId')
  updateRecord(
    @Param('recordId') recordId: string,
    @Body() dto: UpdateFlockRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.poultryService.updateRecord(recordId, req.user.id, dto);
  }

  /** PATCH /poultry/records/:recordId/submit */
  @Patch('poultry/records/:recordId/submit')
  @HttpCode(HttpStatus.OK)
  submitRecord(
    @Param('recordId') recordId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.poultryService.submitRecord(recordId, req.user.id);
  }

  @Patch('poultry/records/:recordId/review')
  @HttpCode(HttpStatus.OK)
  reviewRecord(
    @Param('recordId') recordId: string,
    @Body() dto: ReviewFlockRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.poultryService.reviewRecord(recordId, req.user.id, dto);
  }
}
