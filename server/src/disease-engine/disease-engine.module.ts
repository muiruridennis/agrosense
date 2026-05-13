import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiseaseRule } from './entities/disease-rule.entity';
import { DiseaseAlert } from './entities/disease-alert.entity';
import { DiseaseEngineService } from './disease-engine.service';
import { AlertsController } from './disease-engine.controller';
import { WeatherModule } from '../weather/weather.module';
import { FarmsModule } from '../farms/farms.module';
import { DairyModule } from '../dairy/dairy.module';
import { SmallRuminantsModule } from '../smallruminants/smallruminants.module';
import { PoultryModule } from '../poultry/poultry.module';
import { HealthEventModule } from '../health-event/health-event.module';
import { CropsModule } from '../crops/crops.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiseaseRule, DiseaseAlert]),
    WeatherModule,
    FarmsModule,
    DairyModule,
    SmallRuminantsModule,
    PoultryModule,
    HealthEventModule,
    CropsModule,
  ],
  providers: [DiseaseEngineService],
  controllers: [AlertsController],
  exports: [DiseaseEngineService],
})
export class DiseaseEngineModule {}
