import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { WeatherModule } from '../weather/weather.module';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recommendation]),
    WeatherModule,
    FarmsModule,
  ],
  providers: [RecommendationsService],
  controllers: [RecommendationsController],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}