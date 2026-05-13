import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreditProfileService } from './credit-profile.service';

@Controller('credit-profile')
export class CreditProfileController {
  constructor(private readonly creditProfileService: CreditProfileService) {}

  @Post()
  create(@Body() payload: Record<string, unknown>) {
    return this.creditProfileService.create(payload);
  }

  @Get()
  findAll() {
    return this.creditProfileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditProfileService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.creditProfileService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creditProfileService.remove(id);
  }
}
