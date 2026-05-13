import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';

@UseGuards(JwtAuthenticationGuard)
@Controller('farms/:farmId/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ) {
    return this.recommendationsService.findByFarm(farmId);
  }

  @Get('unread-count')
  getUnreadCount(
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ) {
    return this.recommendationsService.getUnreadCount(farmId);
  }

  @Patch(':id/read')
  markRead(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recommendationsService.markRead(id, farmId);
  }

  @Delete(':id/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  dismiss(
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.recommendationsService.dismiss(id, farmId);
  }
}