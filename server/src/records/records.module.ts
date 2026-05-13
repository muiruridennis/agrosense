import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmRecord } from './entities/farm-record.entity';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [TypeOrmModule.forFeature([FarmRecord]), FarmsModule],
  providers: [RecordsService],
  controllers: [RecordsController],
  exports: [RecordsService],
})
export class RecordsModule {}