import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoultryHouse } from './entities/poultry-house.entity';
import { Flock } from './entities/flock.entity';
import { FlockRecord } from './entities/flock-record.entity';
import { PoultryService } from './poultry.service';
import { PoultryController } from './poultry.controller';
import { FarmsModule } from '../farms/farms.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoultryHouse, Flock, FlockRecord]),
    FarmsModule,
    FarmMembersModule,
    PricingModule
  ],
  controllers: [PoultryController],
  providers: [PoultryService],
  exports: [PoultryService],
})
export class PoultryModule {}
