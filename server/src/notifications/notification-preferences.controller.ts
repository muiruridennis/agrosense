import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationPreferencesService } from './notification-preferences.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { UpdateCategoryDto, UpdatePreferencesDto } from './dtos';

@Controller('preferences')
@UseGuards(JwtAuthenticationGuard)
export class NotificationPreferencesController {
  constructor(
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  // GET /notifications/preferences/defaults
  @Get('defaults')
  async getDefaults() {
    return this.preferencesService.getDefaultPreferences();
  }

  // GET /notifications/preferences/farm/:farmId
  @Get('farm/:farmId')
  async getFarmPreferences(
    @Param('farmId') farmId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.preferencesService.getFarmPreferences(req.user.id, farmId);
  }

  // ⭐ This endpoint is missing
  // GET /notifications/preferences
  @Get()
  async getPreferences(@Req() req: RequestWithUser) {
    return this.preferencesService.getUserPreferences(req.user.id);
  }

  @Put()
  async updatePreferences(
    @Body() dto: UpdatePreferencesDto,
    @Req() req: RequestWithUser,
  ) {
    return this.preferencesService.updatePreferences(req.user.id, dto);
  }

  @Patch('channels')
  async updateChannels(
    @Body() channels: Record<string, boolean>,
    @Req() req: RequestWithUser,
  ) {
    return this.preferencesService.updateChannels(req.user.id, channels);
  }

  @Patch('quiet-hours')
  async updateQuietHours(
    @Body() quietHours: any,
    @Req() req: RequestWithUser,
  ) {
    return this.preferencesService.updateQuietHours(
      req.user.id,
      quietHours,
    );
  }

  // @Patch('categories/:category')
  // async updateCategory(
  //   @Param('category') category: string,
  //   @Body() dto: UpdateCategoryDto,
  //   @Req() req: RequestWithUser,
  // ) {
  //   return this.preferencesService.updateCategory(
  //     req.user.id,
  //     category,
  //     dto,
  //   );
  // }

  @Put('reset')
  async resetPreferences(@Req() req: RequestWithUser) {
    return this.preferencesService.resetPreferences(req.user.id);
  }
}