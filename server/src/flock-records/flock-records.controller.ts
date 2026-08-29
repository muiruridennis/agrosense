import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { FlockRecordsService } from './flock-records.service';
import { CreateFlockRecordDto } from './dtos/create-flock-record.dto';
import { UpdateFlockRecordDto } from './dtos/update-flock-record.dto';

import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { toFlockRecordResponse } from './flock-records.mapper';
@Controller('farms/:farmId/flocks/:flockId/records')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class FlockRecordsController {
  constructor(private readonly flockRecordsService: FlockRecordsService) {}

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════

  @Post()
  async create(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Body() dto: CreateFlockRecordDto,
  ) {
    const record = await this.flockRecordsService.createRecord(
      flockId,
      farmId,
      dto,
    );
    return toFlockRecordResponse(record);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READ MANY
  // ═══════════════════════════════════════════════════════════════════════

  @Get()
  async findAll(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    const records = await this.flockRecordsService.getRecords(flockId, farmId);
    return records.map(toFlockRecordResponse);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READ ONE
  // ═══════════════════════════════════════════════════════════════════════

  @Get(':recordId')
  async findOne(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('recordId') recordId: string,
  ) {
    const record = await this.flockRecordsService.getRecord(recordId, flockId);
    return toFlockRecordResponse(record);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════

  @Patch(':recordId')
  async update(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateFlockRecordDto,
  ) {
    const record = await this.flockRecordsService.updateRecord(
      recordId,
      flockId,
      farmId,
      dto,
    );
    return toFlockRecordResponse(record);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════════════════

  @Delete(':recordId')
  async remove(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('recordId') recordId: string,
  ): Promise<{ message: string }> {
    return await this.flockRecordsService.deleteRecord(
      recordId,
      flockId,
      farmId,
    );
  }
}
