import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreateRecordDto,
  RecordsFilterDto,
  UpdateRecordDto,
} from './dto/record.dto';
import { RecordsService } from './records.service';
import { IsDateString, IsOptional } from 'class-validator';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

class SeasonQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}

@UseGuards(JwtAuthenticationGuard)
@Controller('farms/:farmId/records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  create(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: CreateRecordDto,
  ) {
    const { user } = req;
    return this.recordsService.create(farmId, user.id, dto);
  }

  @Get()
  findAll(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Query() filter: RecordsFilterDto,
  ) {
        const { user } = req;

    return this.recordsService.findAll(farmId, user.id, filter);
  }

  @Get('season-summary')
  getSeasonSummary(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Query() query: SeasonQueryDto,
  ) {
        const { user } = req;

    return this.recordsService.getSeasonSummary(
      farmId,
      user.id,
      query.from,
      query.to,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
        const { user } = req;

    return this.recordsService.findOne(id, farmId, user.id);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRecordDto,
  ) {
        const { user } = req;

    return this.recordsService.update(id, farmId, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
        const { user } = req;

    return this.recordsService.remove(id, farmId, user.id);
  }
}