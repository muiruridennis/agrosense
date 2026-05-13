import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { FarmsService } from '../farms/farms.service';
import { User } from '../users/entities/user.entity';
import { WeatherService } from './weather.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthenticationGuard)
@Controller('farms/:farmId/weather')
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly farmsService: FarmsService,
  ) {}

  @Get()
  async getForecast(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ) {
    const farm = await this.farmsService.findOne(farmId, user.id);
    return this.weatherService.getForecast(farm);
  }
}