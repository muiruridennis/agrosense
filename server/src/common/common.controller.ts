import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CommonService } from './common.service';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post()
  create(@Body() payload: Record<string, unknown>) {
    return this.commonService.create(payload);
  }

  @Get()
  findAll() {
    return this.commonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commonService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.commonService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commonService.remove(id);
  }
}
