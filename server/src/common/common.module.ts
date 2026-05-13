import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { BaseEntity } from './entities/base.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BaseEntity])],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
