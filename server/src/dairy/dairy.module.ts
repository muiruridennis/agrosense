import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cow } from './entities/cow.entity';
import { LactationCycle } from './entities/lactation-cycle.entity';
import { LactationRecord } from './entities/lactation-record.entity';
import { BreedingRecord } from './entities/breeding-record.entity';
import { DairyService } from './dairy.service';
import { DairyController } from './dairy.controller';
import { FarmsModule } from '../farms/farms.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';
import { HealthEventModule } from '../health-event/health-event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cow,
      LactationCycle,
      LactationRecord,
      BreedingRecord,
    ]),
    FarmsModule,
    FarmMembersModule,
    HealthEventModule,
  ],
  controllers: [DairyController],
  providers: [DairyService],
  exports: [DairyService],
})
export class DairyModule {}