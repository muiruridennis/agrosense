// src/advisor/advisor.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type  { Response } from 'express';
import { AdvisorService } from './advisor.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

export class ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

export class AdvisorChatDto {
  messages: ChatMessageDto[];
}

@Controller('advisor')
@UseGuards(JwtAuthenticationGuard)
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(
    @Body() dto: AdvisorChatDto,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    // Set SSE headers — keep the connection alive for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if behind proxy
    res.flushHeaders();

    try {
      await this.advisorService.streamChat(dto.messages, res);
    } catch (err) {
      // Send error as SSE event so the client can handle it gracefully
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`);
      res.end();
    }
  }
}