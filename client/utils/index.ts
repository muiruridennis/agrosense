import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Wind,
  type LucideIcon,
} from 'lucide-react';

interface WeatherInfo {
  label: string;
  icon: LucideIcon;
  color: string;
}

export function getWeatherInfo(code: number): WeatherInfo {
  if (code === 0) return { label: 'Clear sky', icon: Sun, color: 'text-amber-400' };
  if (code <= 2) return { label: 'Partly cloudy', icon: Cloud, color: 'text-gray-400' };
  if (code === 3) return { label: 'Overcast', icon: Cloud, color: 'text-gray-500' };
  if (code <= 49) return { label: 'Foggy', icon: Wind, color: 'text-gray-400' };
  if (code <= 59) return { label: 'Drizzle', icon: CloudDrizzle, color: 'text-blue-400' };
  if (code <= 69) return { label: 'Rain', icon: CloudRain, color: 'text-blue-500' };
  if (code <= 79) return { label: 'Snow', icon: CloudSnow, color: 'text-blue-200' };
  if (code <= 84) return { label: 'Rain showers', icon: CloudRain, color: 'text-blue-500' };
  if (code <= 99) return { label: 'Thunderstorm', icon: CloudLightning, color: 'text-yellow-500' };
  return { label: 'Unknown', icon: Sun, color: 'text-gray-400' };
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    ...opts,
  });
}

export function formatCurrency(amount: number, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}