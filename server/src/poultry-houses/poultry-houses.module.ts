
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoultryHouse } from './entities/poultry-house.entity';
import { PoultryHousesService } from './poultry-houses.service';
import { PoultryHousesController } from './poultry-houses.controller';
import { FarmsModule } from '../farms/farms.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';

/**
 * PoultryHousesModule
 *
 * Owns infrastructure only — no knowledge of flocks, production,
 * or KPIs. A house exists whether or not anything is currently
 * placed in it, and closing a flock never touches this module.
 *
 * No dependency on FlockModule, FlockRecordsModule, or PricingModule —
 * this is the one module in the poultry domain that should never need
 * to change when flock or record business rules change.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PoultryHouse]),
    FarmsModule,
    FarmMembersModule,
  ],
  controllers: [PoultryHousesController],
  providers: [PoultryHousesService],
  exports: [PoultryHousesService],
})
export class PoultryHousesModule {}