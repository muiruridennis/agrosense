import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthenticationGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Req() req: RequestWithUser) {
    const { user } = req;
    return this.notificationsService.findByUser(user.id);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: RequestWithUser) {
    const { user } = req;
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @Req() req :RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { user } = req;
    return this.notificationsService.markRead(id, user.id);
  }
}