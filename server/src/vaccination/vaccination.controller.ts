import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { VaccinationService } from './vaccination.service';

import { CreateVaccinationRecordDto } from './dto/create-vaccination-record.dto';
import { UpdateVaccinationRecordDto } from './dto/update-vaccination-record.dto';
import { CreateVaccinationScheduleDto } from './dto/create-vaccination-schedule.dto';
import { UpdateVaccinationScheduleDto } from './dto/update-vaccination-schedule.dto';

import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard, RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';

/**
 * FIXED: this controller previously had NO class-level guards and never
 * extracted farmId at all — every service call went straight to
 * flockService.getFlock(flockId) with no farm-ownership check, meaning
 * any authenticated user who could guess a flockId could read/write
 * vaccination records for ANY farm. That's the single highest-priority
 * fix in this pass — everything else is data-quality by comparison.
 */
@Controller('farms/:farmId/flocks/:flockId/vaccinations')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class VaccinationController {
  constructor(private readonly vaccinationService: VaccinationService) {}

  // ============================================================
  // RECORDS
  // ============================================================

  @Post('records')
  createRecord(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Body() dto: CreateVaccinationRecordDto,
  ) {
    return this.vaccinationService.createRecord(flockId, farmId, dto);
  }

  @Get('records')
  findRecords(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.vaccinationService.findRecords(flockId, farmId);
  }

  @Get('records/:recordId')
  findRecord(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.vaccinationService.findRecord(flockId, farmId, recordId);
  }

  @Patch('records/:recordId')
  updateRecord(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateVaccinationRecordDto,
  ) {
    return this.vaccinationService.updateRecord(flockId, farmId, recordId, dto);
  }

  /** Restricted — deleting a vaccination record (and reverting its linked schedule) is destructive enough to gate */
  @Delete('records/:recordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  deleteRecord(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.vaccinationService.deleteRecord(flockId, farmId, recordId);
  }

  // ============================================================
  // SCHEDULES
  // ============================================================

  @Post('schedules')
  createSchedule(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Body() dto: CreateVaccinationScheduleDto,
  ) {
    return this.vaccinationService.createSchedule(flockId, farmId, dto);
  }

  @Get('schedules')
  findSchedules(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.vaccinationService.findSchedules(flockId, farmId);
  }

  @Get('schedules/upcoming')
  getUpcomingSchedules(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Query('days', new ParseIntPipe({ optional: true }))
    days = 7,
  ) {
    return this.vaccinationService.getUpcomingSchedules(flockId, farmId, days);
  }

  @Get('schedules/overdue')
  getOverdueSchedules(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.vaccinationService.getOverdueSchedules(flockId, farmId);
  }

  @Get('schedules/:scheduleId')
  findSchedule(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.vaccinationService.findSchedule(flockId, farmId, scheduleId);
  }

  @Patch('schedules/:scheduleId')
  updateSchedule(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateVaccinationScheduleDto,
  ) {
    return this.vaccinationService.updateSchedule(
      flockId,
      farmId,
      scheduleId,
      dto,
    );
  }

  @Post('schedules/:scheduleId/missed')
  markScheduleMissed(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.vaccinationService.markScheduleMissed(
      flockId,
      farmId,
      scheduleId,
    );
  }

  @Post('schedules/:scheduleId/cancel')
  cancelSchedule(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.vaccinationService.cancelSchedule(flockId, farmId, scheduleId);
  }
}
