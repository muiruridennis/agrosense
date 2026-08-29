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
  Req,
  UseGuards,
} from '@nestjs/common';

import { MedicationService } from './medication.service';
import { CreateMedicationRecordDto } from './dtos/create-medication-record.dto';
import {
  CancelMedicationDto,
  CompleteMedicationDto,
  UpdateMedicationRecordDto,
} from './dtos/update-medication-record.dto';

import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard, RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('farms/:farmId/flocks/:flockId/medications')
@UseGuards(JwtAuthenticationGuard, FarmAccessGuard)
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Get()
  getRecords(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
  ) {
    return this.medicationService.getRecords(flockId, farmId);
  }

  @Post()
  createRecord(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Body() dto: CreateMedicationRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.medicationService.createRecord(
      flockId,
      farmId,
      req.user.id,
      dto,
    );
  }

  @Get(':medicationId')
  getRecord(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('medicationId') medicationId: string,
  ) {
    return this.medicationService.getRecord(medicationId, flockId);
  }

  @Patch(':medicationId')
  updateRecord(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('medicationId') medicationId: string,
    @Body() dto: UpdateMedicationRecordDto,
  ) {
    return this.medicationService.updateRecord(
      medicationId,
      flockId,
      farmId,
      dto,
    );
  }

  @Patch(':medicationId/complete')
  @HttpCode(HttpStatus.OK)
  completeMedication(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('medicationId') medicationId: string,
    @Body() dto: CompleteMedicationDto,
  ) {
    return this.medicationService.completeMedication(
      medicationId,
      flockId,
      farmId,
      dto,
    );
  }

  @Patch(':medicationId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelMedication(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('medicationId') medicationId: string,
    @Body() dto: CancelMedicationDto,
  ) {
    return this.medicationService.cancelMedication(
      medicationId,
      flockId,
      farmId,
      dto,
    );
  }

  /** Restricted — deleting even an active medication record is destructive enough to gate */
  @Delete(':medicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.OWNER, FarmMemberRole.MANAGER)
  deleteRecord(
    @Param('farmId') farmId: string,
    @Param('flockId') flockId: string,
    @Param('medicationId') medicationId: string,
  ) {
    return this.medicationService.deleteRecord(medicationId, flockId, farmId);
  }
}
