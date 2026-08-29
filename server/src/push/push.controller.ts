import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PushService } from './push.service';
import { RegisterPushTokenDto } from './dtos/register-push-token.dto';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('push/tokens')
@UseGuards(JwtAuthenticationGuard)
export class PushController {
  constructor(private readonly pushService: PushService) {}

  // POST /push/tokens — call after obtaining an FCM token (app start / login / token refresh)
  @Post()
  @HttpCode(HttpStatus.OK)
  async register(
    @Req() req: RequestWithUser,
    @Body() dto: RegisterPushTokenDto,
  ) {
    const record = await this.pushService.registerToken(req.user.id, dto);
    return { success: true, id: record.id };
  }

  // DELETE /push/tokens/:token — call on logout
  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  async unregister(
    @Req() req: RequestWithUser,
    @Param('token') token: string,
  ) {
    await this.pushService.unregisterToken(req.user.id, token);
    return { success: true };
  }
}