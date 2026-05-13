import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import  type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Farm } from '../farms/entities/farm.entity';

export interface WeatherCondition {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  temperatureMean: number;
  humidity: number; // relative humidity %
  precipitation: number; // mm
  windSpeed: number; // km/h
  uvIndex: number;
  weatherCode: number; // WMO code
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  current: WeatherCondition;
  daily: WeatherCondition[]; // 7 days
  fetchedAt: string;
}

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly http: HttpService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getForecast(farm: Farm): Promise<WeatherForecast | null> {
    if (!farm.geoPoint) {
      this.logger.warn(`Farm ${farm.id} has no geoPoint — skipping weather`);
      return null;
    }

    const [lng, lat] = farm.geoPoint.coordinates;
    const cacheKey = `weather:${lat.toFixed(3)}:${lng.toFixed(3)}`;

    const cached = await this.cache.get<WeatherForecast>(cacheKey);
    if (cached) return cached;

    const forecast = await this.fetchFromApi(lat, lng, farm.timezone ?? 'UTC');

    await this.cache.set(cacheKey, forecast, CACHE_TTL_SECONDS);
    return forecast;
  }

  async getForecastByCoords(
    latitude: number,
    longitude: number,
    timezone = 'UTC',
  ): Promise<WeatherForecast> {
    const cacheKey = `weather:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
    const cached = await this.cache.get<WeatherForecast>(cacheKey);
    if (cached) return cached;

    const forecast = await this.fetchFromApi(latitude, longitude, timezone);
    await this.cache.set(cacheKey, forecast, CACHE_TTL_SECONDS);
    return forecast;
  }

  private async fetchFromApi(
    latitude: number,
    longitude: number,
    timezone: string,
  ): Promise<WeatherForecast> {
    const params = {
      latitude,
      longitude,
      timezone,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'relative_humidity_2m_max',
        'precipitation_sum',
        'wind_speed_10m_max',
        'uv_index_max',
        'weather_code',
      ].join(','),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'wind_speed_10m',
        'weather_code',
      ].join(','),
      forecast_days: 7,
    };

    const { data } = await firstValueFrom(
      this.http.get(OPEN_METEO_URL, { params }),
    );

    return this.parseResponse(data);
  }

  private parseResponse(data: any): WeatherForecast {
    const daily: WeatherCondition[] = data.daily.time.map(
      (date: string, i: number) => ({
        date,
        temperatureMin: data.daily.temperature_2m_min[i],
        temperatureMax: data.daily.temperature_2m_max[i],
        temperatureMean: data.daily.temperature_2m_mean[i],
        humidity: data.daily.relative_humidity_2m_max[i],
        precipitation: data.daily.precipitation_sum[i],
        windSpeed: data.daily.wind_speed_10m_max[i],
        uvIndex: data.daily.uv_index_max[i],
        weatherCode: data.daily.weather_code[i],
      }),
    );

    const c = data.current;
    const current: WeatherCondition = {
      date: new Date().toISOString().split('T')[0],
      temperatureMin: c.temperature_2m,
      temperatureMax: c.temperature_2m,
      temperatureMean: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      windSpeed: c.wind_speed_10m,
      uvIndex: 0,
      weatherCode: c.weather_code,
    };

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      current,
      daily,
      fetchedAt: new Date().toISOString(),
    };
  }
}