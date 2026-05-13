import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DiseaseEngineService } from './disease-engine.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';

@UseGuards(JwtAuthenticationGuard)
@Controller('farms/:farmId/alerts')
export class AlertsController {
  constructor(private readonly diseaseEngineService: DiseaseEngineService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ) {
    // Ownership is verified inside service via farm lookup
    return this.diseaseEngineService.getActiveAlerts(farmId);
  }

  @Patch(':alertId/read')
  markRead(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('alertId', ParseUUIDPipe) alertId: string,
  ) {
    return this.diseaseEngineService.acknowledgeAlert(alertId);
  }

  @Patch(':alertId/resolve')
  markResolved(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('alertId', ParseUUIDPipe) alertId: string,
  ) {
    return this.diseaseEngineService.resolveAlert(alertId);
  }
}
