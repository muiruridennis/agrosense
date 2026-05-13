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
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlotsService } from './plots.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePlotDto, UpdatePlotDto } from './dto/plot.dto';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';

@UseGuards(JwtAuthenticationGuard)
@Controller('plots')
export class PlotsController {
  constructor(private readonly plotsService: PlotsService) {}

  @Post(':farmId')
  async createPlot(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Body() dto: CreatePlotDto,
  ) {
    const { user } = req;
    return await this.plotsService.create(farmId, user.id, dto);
  }

  @Get(':farmId')
  async findPlots(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ) {
    const { user } = req;
    return await this.plotsService.findAll(farmId, user.id);
  }

  @Get(':farmId/:plotId')
  async findPlot(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
  ) {
    const { user } = req;
    return await this.plotsService.findOne(farmId, plotId, user.id);
  }

  @Patch(':farmId/:plotId')
  async updatePlot(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: UpdatePlotDto,
  ) {
    const { user } = req;
    return await this.plotsService.update(farmId, plotId, user.id, dto);
  }

  @Delete(':farmId/plots/:plotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePlot(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
  ) {
    const { user } = req;
    return await this.plotsService.remove(farmId, plotId, user.id);
  }
}
