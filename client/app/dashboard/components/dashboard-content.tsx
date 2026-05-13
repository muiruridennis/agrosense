'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Sprout,
 Rabbit,
  BookOpen,
  CloudSun,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Droplets,
  Wind,
  Thermometer,
  ChevronRight,
  Leaf,
  Activity,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useFarms,
  useAlerts,
  useRecommendations,
  useRecentRecords,
  useWeather,
} from '@/lib/hooks/useDashboard';
import { getWeatherInfo, formatCurrency, timeAgo, formatDate } from '@/utils';
import { useAuth } from '@/providers/auth-provider';

// ── Severity config ────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  low:      { label: 'Low',      class: 'bg-green-50  text-green-700  border-green-200' },
  medium:   { label: 'Medium',   class: 'bg-amber-50  text-amber-700  border-amber-200' },
  high:     { label: 'High',     class: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', class: 'bg-red-50    text-red-700    border-red-200' },
} as const;

const PRIORITY_CONFIG = {
  low:    { class: 'bg-secondary text-secondary-foreground' },
  medium: { class: 'bg-amber-50 text-amber-700 border-amber-200' },
  high:   { class: 'bg-orange-50 text-orange-700 border-orange-200' },
  urgent: { class: 'bg-red-50 text-red-700 border-red-200' },
} as const;

const RECORD_TYPE_CONFIG: Record<string, { color: string; sign: string }> = {
  income:    { color: 'text-emerald-600', sign: '+' },
  harvest:   { color: 'text-emerald-600', sign: '+' },
  expense:   { color: 'text-red-500',     sign: '-' },
  treatment: { color: 'text-red-500',     sign: '-' },
  feed:      { color: 'text-red-500',     sign: '-' },
  labor:     { color: 'text-red-500',     sign: '-' },
  equipment: { color: 'text-red-500',     sign: '-' },
};

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  href,
  count,
}: {
  title: string;
  href?: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count != null && count > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  accent?: string;
}) {
  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-sm">
      {/* Accent stripe */}
      <div className={cn('absolute inset-y-0 left-0 w-0.5', accent)} />
      <CardContent className="pt-5 pb-4 pl-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className={cn('rounded-lg p-2', accent?.replace('bg-', 'bg-').replace('/100', '/10'))}>
            <Icon className={cn('h-4 w-4', accent?.includes('emerald') ? 'text-emerald-600' : accent?.includes('amber') ? 'text-amber-600' : accent?.includes('blue') ? 'text-blue-600' : accent?.includes('rose') ? 'text-rose-600' : 'text-primary')} />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            {trend.positive ? (
              <TrendingUp className="h-3 w-3 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trend.positive ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}% vs last season
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Weather card ──────────────────────────────────────────────────────────────

function WeatherCard({ farmId }: { farmId: string }) {
  const { data: weather, isPending } = useWeather(farmId);

  if (isPending) {
    return (
      <Card>
        <CardContent className="pt-5">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card>
        <CardContent className="pt-5 text-center">
          <p className="text-xs text-muted-foreground">
            Set a GPS location on your farm to see weather
          </p>
        </CardContent>
      </Card>
    );
  }

  const { icon: WeatherIcon, label, color } = getWeatherInfo(
    weather.current.weatherCode,
  );

  return (
    <Card className="overflow-hidden">
      {/* Current conditions header */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Current conditions
            </p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                {Math.round(weather.current.temperatureMean)}°C
              </span>
              <span className="mb-0.5 text-sm text-muted-foreground">{label}</span>
            </div>
          </div>
          <WeatherIcon className={cn('h-10 w-10', color)} />
        </div>

        {/* Weather stats */}
        <div className="mt-3 flex gap-4">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs text-muted-foreground">
              {weather.current.humidity}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-muted-foreground">
              {Math.round(weather.current.windSpeed)} km/h
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Thermometer className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs text-muted-foreground">
              {weather.current.precipitation}mm
            </span>
          </div>
        </div>
      </div>

      {/* 5-day forecast */}
      <CardContent className="px-5 py-3">
        <div className="grid grid-cols-5 gap-1">
          {weather.daily.slice(0, 5).map((day) => {
            const { icon: DayIcon, color: dayColor } = getWeatherInfo(
              day.weatherCode,
            );
            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1 rounded-md py-2"
              >
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(day.date, { weekday: 'short' })}
                </span>
                <DayIcon className={cn('h-4 w-4', dayColor)} />
                <span className="text-xs font-medium text-foreground">
                  {Math.round(day.temperatureMax)}°
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(day.temperatureMin)}°
                </span>
                {day.precipitation > 0 && (
                  <span className="text-[10px] text-blue-500">
                    {day.precipitation}mm
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Alert item ────────────────────────────────────────────────────────────────

function AlertItem({
  alert,
  farmId,
}: {
  alert: import('@/types').DiseaseAlertItem;
  farmId: string;
}) {
  const sev = SEVERITY_CONFIG[alert.severity];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
        !alert.isRead && 'bg-muted/40',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
          alert.severity === 'critical' || alert.severity === 'high'
            ? 'bg-red-100'
            : 'bg-amber-100',
        )}
      >
        <ShieldAlert
          className={cn(
            'h-3.5 w-3.5',
            alert.severity === 'critical' || alert.severity === 'high'
              ? 'text-red-600'
              : 'text-amber-600',
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-snug">
            {alert.diseaseName}
          </p>
          <Badge
            variant="outline"
            className={cn('flex-shrink-0 text-[10px] px-1.5 py-0', sev.class)}
          >
            {sev.label}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground capitalize">
          {alert.hostType} · {alert.hostTarget}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {timeAgo(alert.triggeredAt)}
        </p>
      </div>
    </div>
  );
}

// ── Record item ───────────────────────────────────────────────────────────────

function RecordItem({ record }: { record: import('@/types').RecentRecord }) {
  const config = RECORD_TYPE_CONFIG[record.recordType] ?? {
    color: 'text-foreground',
    sign: '',
  };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {record.description ?? record.category.replace(/_/g, ' ')}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {record.recordType} · {formatDate(record.recordedAt)}
        </p>
      </div>
      <span className={cn('flex-shrink-0 text-sm font-semibold', config.color)}>
        {config.sign}
        {formatCurrency(record.amount, record.currency)}
      </span>
    </div>
  );
}

// ── Farm selector pill ─────────────────────────────────────────────────────────

function FarmPill({
  farm,
  selected,
  onClick,
}: {
  farm: import('@/types').FarmSummary;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
      )}
    >
      <MapPin className="h-3 w-3" />
      {farm.name}
    </button>
  );
}

// ── Dashboard content ──────────────────────────────────────────────────────────

export default  function DashboardContent() {
  const { user } = useAuth();
  const { data: farms = [], isPending: farmsLoading } = useFarms();

  // Active farm — first farm by default
  const activeFarm = farms[1];

  const { data: alerts = [], isPending: alertsLoading } = useAlerts(activeFarm?.id);
  const { data: recommendations = [] } = useRecommendations(activeFarm?.id);
  const { data: records = [] } = useRecentRecords(activeFarm?.id);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const unreadAlerts = alerts.filter((a) => !a.isRead).length;
  const criticalAlerts = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'high',
  ).length;

  // ── Computed KPIs from available data ─────────────────────────────────────

  const totalIncome = records
    .filter((r) => r.recordType === 'income' || r.recordType === 'harvest')
    .reduce((s, r) => s + Number(r.amount), 0);

  const totalExpenses = records
    .filter((r) => r.recordType !== 'income' && r.recordType !== 'harvest')
    .reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-6">

      {/* ── Hero greeting ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-KE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {activeFarm && (
              <>
                {' · '}
                <span className="text-foreground font-medium">
                  {activeFarm.name}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Critical alert banner */}
        {criticalAlerts > 0 && (
          <Link href="/dashboard/alerts">
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 transition-colors hover:bg-red-100">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} need attention
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-red-500" />
            </div>
          </Link>
        )}
      </div>

      {/* ── Farm selector ──────────────────────────────────────────────────── */}
      {farms.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {farms.map((farm) => (
            <FarmPill
              key={farm.id}
              farm={farm}
              selected={farm.id === activeFarm?.id}
              onClick={() => {}}
            />
          ))}
        </div>
      )}

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Active plots"
          value={activeFarm?.plots.length ?? '—'}
          sub={`${activeFarm?.areaHectares ?? 0} ha total area`}
          icon={Sprout}
          accent="bg-emerald-100"
        />
        <KpiCard
          label="Livestock"
          value={activeFarm?.animals.length ?? '—'}
          sub="Animals on farm"
          icon={Rabbit}
          accent="bg-orange-100"
        />
        <KpiCard
          label="Season income"
          value={totalIncome > 0 ? formatCurrency(totalIncome) : '—'}
          sub="Recent records"
          icon={TrendingUp}
          accent="bg-blue-100"
          trend={totalIncome > 0 ? { value: 12, positive: true } : undefined}
        />
        <KpiCard
          label="Disease alerts"
          value={unreadAlerts > 0 ? unreadAlerts : alerts.length}
          sub={unreadAlerts > 0 ? `${unreadAlerts} unread` : 'All reviewed'}
          icon={ShieldAlert}
          accent="bg-rose-100"
        />
      </div>

      {/* ── Main content grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left column: alerts + recommendations ─────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Disease alerts */}
          <div>
            <SectionHeader
              title="Disease alerts"
              href={activeFarm ? `/dashboard/alerts` : undefined}
              count={unreadAlerts}
            />
            {alertsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                    <Activity className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No active alerts
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your farm is looking healthy. AgroAdvisor checks daily at 6am.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 4).map((alert) => (
                  <AlertItem key={alert.id} alert={alert} farmId={activeFarm?.id ?? ''} />
                ))}
                {alerts.length > 4 && (
                  <Link href="/dashboard/alerts">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View {alerts.length - 4} more alerts
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* AgroAdvisor recommendations */}
          {recommendations.length > 0 && (
            <div>
              <SectionHeader
                title="Recommendations"
                href="/dashboard/advisor"
                count={recommendations.filter((r) => r.priority === 'high' || r.priority === 'urgent').length}
              />
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((rec) => {
                  const pConfig = PRIORITY_CONFIG[rec.priority];
                  return (
                    <Card key={rec.id} className="transition-shadow hover:shadow-sm">
                      <CardContent className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {rec.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                              {rec.message.split('\n')[0]}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn('flex-shrink-0 text-[10px] capitalize', pConfig.class)}
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        {rec.expiresAt && (
                          <p className="mt-2 text-[10px] text-muted-foreground/60">
                            Expires {formatDate(rec.expiresAt)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent FarmLedger records */}
          <div>
            <SectionHeader
              title="Recent records"
              href={activeFarm ? `/dashboard/ledger` : undefined}
            />
            {records.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No records yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Start logging expenses and income to build your farm ledger.
                  </p>
                  <Link href="/dashboard/ledger" className="mt-3">
                    <Button size="sm" variant="outline" className="text-xs">
                      Add first record
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="px-4 py-1">
                  {records.slice(0, 5).map((record: any) => (
                    <RecordItem key={record.id} record={record} />
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Right column: weather + quick actions + farm card ──────────── */}
        <div className="space-y-6">

          {/* Weather */}
          {activeFarm ? (
            <div>
              <SectionHeader title="Weather forecast" href="/dashboard/advisor" />
              <WeatherCard farmId={activeFarm.id} />
            </div>
          ) : null}

          {/* Quick actions */}
          <div>
            <SectionHeader title="Quick actions" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Log expense',   href: '/dashboard/ledger/new?type=expense',   icon: BookOpen,  color: 'text-amber-600',   bg: 'bg-amber-50' },
                { label: 'Add animal',    href: '/dashboard/livestock/new',              icon:Rabbit,       color: 'text-orange-600',  bg: 'bg-orange-50' },
                { label: 'New crop cycle', href: '/dashboard/crops/new',                 icon: Sprout,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'View advisory', href: '/dashboard/advisor',                    icon: CloudSun,  color: 'text-blue-600',    bg: 'bg-blue-50' },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-sm hover:border-border">
                    <CardContent className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                      <div className={cn('rounded-lg p-2', action.bg)}>
                        <action.icon className={cn('h-4 w-4', action.color)} />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">
                        {action.label}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Farm overview card */}
          {activeFarm && (
            <div>
              <SectionHeader title="Farm overview" href="/dashboard/farms" />
              <Card>
                <CardContent className="pt-4 pb-4 px-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Leaf className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {activeFarm.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activeFarm.region}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-border rounded-lg border">
                    {[
                      { label: 'Area', value: `${activeFarm.areaHectares}ha` },
                      { label: 'Plots',   value: activeFarm.activePlots },
                      { label: 'Animals', value: activeFarm.activeAnimals },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center py-3"
                      >
                        <span className="text-base font-semibold text-foreground">
                          {stat.value}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/dashboard/farms/${activeFarm.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                    >
                      View farm details
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty state — no farms yet */}
          {!farmsLoading && farms.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Register your first farm
                </p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[180px]">
                  Add a farm to start tracking crops, livestock, and records.
                </p>
                <Link href="/dashboard/farms/new" className="mt-4">
                  <Button size="sm" className="text-xs">
                    Add farm
                    <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}