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
  UseGuards,
} from '@nestjs/common';
import { PoultryHousesService } from './poultry-houses.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard, RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';
import { HouseStatus } from './enums';
import {
  CreatePoultryHouseDto,
  UpdateHouseStatusDto,
  UpdatePoultryHouseDto,
} from './dto/poultry-house.dto';

/**
 * PoultryHousesController
 *
 * All routes are farm-scoped under /farms/:farmId/poultry/houses.
 * Occupancy (status=occupied) is never set through this controller — it's
 * driven entirely by FlockService via markOccupied/markVacated. This
 * controller only exposes the transitions a farmer actually makes by hand.
 */
@Controller('farms/:farmId/poultry/houses')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class PoultryHousesController {
  constructor(private readonly housesService: PoultryHousesService) {}

  /** GET /farms/:farmId/poultry/houses?status=available */
  @Get()
  getHouses(
    @Param('farmId') farmId: string,
    @Query('status') status?: HouseStatus,
  ) {
    return this.housesService.getHouses(farmId, status);
  }

  /** POST /farms/:farmId/poultry/houses */
  @Post()
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  createHouse(
    @Param('farmId') farmId: string,
    @Body() dto: CreatePoultryHouseDto,
  ) {
    return this.housesService.createHouse(farmId, dto);
  }

  /** GET /farms/:farmId/poultry/houses/:houseId */
  @Get(':houseId')
  getHouse(
    @Param('farmId') farmId: string,
    @Param('houseId') houseId: string,
  ) {
    return this.housesService.getHouse(houseId, farmId);
  }

  /** PATCH /farms/:farmId/poultry/houses/:houseId */
  @Patch(':houseId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  updateHouse(
    @Param('farmId') farmId: string,
    @Param('houseId') houseId: string,
    @Body() dto: UpdatePoultryHouseDto,
  ) {
    return this.housesService.updateHouse(houseId, farmId, dto);
  }

  /** PATCH /farms/:farmId/poultry/houses/:houseId/status — maintenance / available / decommissioned only */
  @Patch(':houseId/status')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  updateHouseStatus(
    @Param('farmId') farmId: string,
    @Param('houseId') houseId: string,
    @Body() dto: UpdateHouseStatusDto,
  ) {
    return this.housesService.updateStatus(houseId, farmId, dto);
  }

  /** DELETE /farms/:farmId/poultry/houses/:houseId — only if it's never hosted a flock */
  @Delete(':houseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER)
  deleteHouse(
    @Param('farmId') farmId: string,
    @Param('houseId') houseId: string,
  ) {
    return this.housesService.deleteHouse(houseId, farmId);
  }
}