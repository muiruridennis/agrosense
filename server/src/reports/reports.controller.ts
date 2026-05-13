import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type  { Response } from 'express';
import { IsDateString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';

class SeasonQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}

@UseGuards(JwtAuthenticationGuard)
@Controller('farms/:farmId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('season-pdf')
  async downloadSeasonPdf(
    @CurrentUser() user: User,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Query() query: SeasonQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.generateSeasonPdf(
      farmId,
      user,
      query.from,
      query.to,
    );

    const filename = `agrosense-report-${farmId}-${query.from}-${query.to}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}