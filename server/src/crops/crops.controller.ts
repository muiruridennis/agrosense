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
import { User } from '../users/entities/user.entity';
import { CreateCropCycleDto, UpdateCropCycleDto } from './dto/crop-cycle.dto';
import { CropCyclesService } from './crops.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import  type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthenticationGuard)
@Controller('farms/:farmId')
export class CropCyclesController {
  constructor(private readonly cropCyclesService: CropCyclesService) {}

  // GET /farms/:farmId/crop-cycles — all cycles across all plots in farm
  @Get('crop-cycles')
  findAllByFarm(
    @Req() req : RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ) {
    const { user } = req;
    return this.cropCyclesService.findAllByFarm(farmId, user.id);
  }

  // GET /farms/:farmId/crop-cycles/summary
  @Get('crop-cycles/summary')
  getSummary(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
  ) {
    const { user } = req;
    return this.cropCyclesService.getSummaryByFarm(farmId, user.id);
  }

  // GET /farms/:farmId/plots/:plotId/crop-cycles
  @Get('plots/:plotId/crop-cycles')
  findAll(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
  ) {
    const { user } = req;
    return this.cropCyclesService.findAll(farmId, plotId, user.id);
  }

  // POST /farms/:farmId/plots/:plotId/crop-cycles
  @Post('plots/:plotId/crop-cycles')
  async create(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('plotId', ParseUUIDPipe) plotId: string,
    @Body() dto: CreateCropCycleDto,
  ) {
    const { user } = req;
    return  await this.cropCyclesService.create(farmId, plotId, user.id, dto);
  }

  // GET /farms/:farmId/crop-cycles/:id
  @Get('crop-cycles/:id')
  findOne(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { user } = req;
    return this.cropCyclesService.findOne(id, farmId, user.id);
  }

  // PATCH /farms/:farmId/crop-cycles/:id
  @Patch('crop-cycles/:id')
  update(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCropCycleDto,
  ) {
    const { user } = req;
    return this.cropCyclesService.update(id, farmId, user.id, dto);
  }

  // DELETE /farms/:farmId/crop-cycles/:id
  @Delete('crop-cycles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: RequestWithUser,
    @Param('farmId', ParseUUIDPipe) farmId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const { user } = req;
    return this.cropCyclesService.remove(id, farmId, user.id);
  }
}