import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { FarmsModule } from '../farms/farms.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [HttpModule, FarmsModule,  CacheModule.register(),],
  providers: [WeatherService],
  controllers: [WeatherController],
  exports: [WeatherService],
})
export class WeatherModule {}