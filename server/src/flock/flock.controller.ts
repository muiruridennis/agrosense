import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { FlockService } from './flock.service';

import {
  CloseFlockDto,
  CreateFlockDto,
  UpdateFlockDto,
} from './dtos/flock.dto';

import {
  FlockStage,
  FlockStatus,
} from './enums';

import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import {
  FarmRoleGuard,
} from '../auth/guards/roles.guard';

@Controller('farms/:farmId')
@UseGuards(
  JwtAuthenticationGuard,
  FarmAccessGuard,
)
export class FlockController {
  constructor(
    private readonly flockService: FlockService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE FLOCK IN HOUSE
  // ═══════════════════════════════════════════════════════════════════════

  @Post('poultry/houses/:houseId/flocks')
  async create(
    @Param('farmId') farmId: string,
    @Param('houseId') houseId: string,
    @Body() dto: CreateFlockDto,
  ) {
    return this.flockService.createFlock(
      farmId,
      houseId,
      dto,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GET FLOCKS
  // ═══════════════════════════════════════════════════════════════════════

  @Get('flocks')
  @UseGuards(FarmRoleGuard)
  async findAll(
    @Param('farmId') farmId: string,
    @Query('status') status?: FlockStatus,
  ) {
    return this.flockService.getFlocks(
      farmId,
      status,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GET ONE FLOCK
  // ═══════════════════════════════════════════════════════════════════════

  @Get('flocks/:flockId')
  async findOne(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.flockService.getFlock(
      flockId,
      farmId,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════

  @Patch('flocks/:flockId')
  async update(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Body() dto: UpdateFlockDto,
  ) {
    return this.flockService.updateFlock(
      flockId,
      farmId,
      dto,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE
  // ═══════════════════════════════════════════════════════════════════════

  @Patch('flocks/:flockId/stage')
  async updateStage(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Body('stage') stage: FlockStage,
  ) {
    return this.flockService.updateStage(
      flockId,
      farmId,
      stage,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SUSPEND
  // ═══════════════════════════════════════════════════════════════════════

  @Post('flocks/:flockId/suspend')
  async suspend(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.flockService.suspendFlock(
      flockId,
      farmId,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REACTIVATE
  // ═══════════════════════════════════════════════════════════════════════

  @Post('flocks/:flockId/reactivate')
  async reactivate(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.flockService.reactivateFlock(
      flockId,
      farmId,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CLOSE
  // ═══════════════════════════════════════════════════════════════════════

  @Post('flocks/:flockId/close')
  async close(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Body() dto: CloseFlockDto,
  ) {
    return this.flockService.closeFlock(
      flockId,
      farmId,
      dto,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════════════════

  @Delete('flocks/:flockId')
  async remove(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ): Promise<void> {
    await this.flockService.deleteFlock(
      flockId,
      farmId,
    );
  }
}