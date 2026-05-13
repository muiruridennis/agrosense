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
import {
  CreateFarmDto,
  UpdateFarmDto,
  
} from './dto/create-farm.dto';
import { FarmsService } from './farms.service';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@UseGuards(JwtAuthenticationGuard) // All routes require auth
@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  create(@Req() req: RequestWithUser, @Body() dto: CreateFarmDto) {
    return this.farmsService.create(req.user.id, dto);
  }
  
  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.farmsService.findAllByOwner(req.user.id);
  }

  @Get(':id')
  findOne(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.farmsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFarmDto,
  ) {
    return this.farmsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.farmsService.remove(id, req.user.id);
  }

}