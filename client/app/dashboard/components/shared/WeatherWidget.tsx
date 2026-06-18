"use client";

import { useWeather } from "@/lib/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, CloudRain, Sun, Wind, Droplets, Thermometer } from "lucide-react";

interface WeatherWidgetProps {
  farmId: string;
}

export function WeatherWidget({ farmId }: WeatherWidgetProps) {
  const { data: weather, isLoading } = useWeather(farmId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  const getWeatherIcon = (condition: string) => {
    const lower = condition?.toLowerCase() || "";
    if (lower.includes("rain")) return <CloudRain className="h-10 w-10 text-blue-500" />;
    if (lower.includes("cloud")) return <Cloud className="h-10 w-10 text-gray-500" />;
    return <Sun className="h-10 w-10 text-amber-500" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Weather</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.condition)}
            <div>
              <p className="text-2xl font-bold">{weather.temperature}°C</p>
              <p className="text-sm text-muted-foreground capitalize">
                {weather.condition}
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{weather.location}</p>
            <p>Feels like {weather.feelsLike}°C</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <span>{weather.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span>{weather.humidity}% humidity</span>
          </div>
        </div>

        {weather.forecast && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">Tomorrow</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm capitalize">{weather.forecast.condition}</span>
              <span className="text-sm font-medium">
                {weather.forecast.high}° / {weather.forecast.low}°
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}