import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ruminant } from './entities/ruminant.entity';
import { GrowthRecord } from './entities/growth-record.entity';
import { BreedingRecord } from './entities/breeding-record.entity';
import { SmallRuminantsService } from './smallruminants.service';
import { SmallRuminantsController } from './smallruminants.controller';
import { FarmsModule } from '../farms/farms.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';
import { HealthEventModule } from '../health-event/health-event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ruminant,
      GrowthRecord,
      BreedingRecord,
    ]),
    FarmsModule,
    FarmMembersModule,
    HealthEventModule
  ],
  controllers: [SmallRuminantsController],
  providers: [SmallRuminantsService],
  exports: [SmallRuminantsService],
})
export class SmallRuminantsModule {}