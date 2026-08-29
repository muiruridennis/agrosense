import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { SendNotificationDto } from './dtos';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('notifications')
@UseGuards(JwtAuthenticationGuard)
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async send(
    @Req() req: RequestWithUser,
    @Body() dto: SendNotificationDto,
  ) {
    return this.notificationService.send(req.user.id, dto);
  }

  /**
   * GET /notifications/user
   */
  @Get('user')
  @HttpCode(HttpStatus.OK)
  async getUserNotifications(@Req() req: RequestWithUser) {
    return this.notificationService.getUserNotifications(req.user.id);
  }

  /**
   * GET /notifications/admin/stats
   */
  @Get('admin/stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    return this.notificationService.getDeliveryStats();
  }

  /**
   * GET /notifications/:id/status
   */
  @Get(':id/status')
  @HttpCode(HttpStatus.OK)
  async getStatus(@Param('id') id: string) {
    return this.notificationService.getDeliveryStatus(id);
  }

  /**
   * GET /notifications/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getNotification(@Param('id') id: string) {
    return this.notificationService.getNotification(id);
  }

  /**
   * DELETE /notifications/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    await this.notificationService.cancel(id);
    return {
      success: true,
      message: `Notification ${id} cancelled`,
    };
  }
}