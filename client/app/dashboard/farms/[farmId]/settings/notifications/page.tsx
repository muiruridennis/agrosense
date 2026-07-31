// app/dashboard/farms/[farmId]/settings/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useFarmRole } from "@/providers/FarmRoleContext";
// import { useNotificationPreferences, useUpdateNotificationPreferences } from "../hooks/useNotificationPreferences";
import {
  Bell,
  BellOff,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Settings,
  User,
  Users,
  Calendar,
  TrendingUp,
  Droplet,
  Thermometer,
  Activity,
  Pill,
  Truck,
  DollarSign,
  Shield,
  Moon,
  Sun,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  BellRing,
  BellDot,
  Volume2,
  VolumeX,
  Clock as ClockIcon,
  CalendarDays,
  ListChecks,
  Megaphone,
  AlarmClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, formatDate } from "@/utils/date";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationPreference {
  id: string;
  category: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  frequency: 'instant' | 'daily' | 'weekly';
  priority: 'low' | 'medium' | 'high' | 'critical';
  escalation?: {
    enabled: boolean;
    afterMinutes: number;
    escalateTo: string[];
  };
}

interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm format
  end: string; // HH:mm format
  days: string[]; // ['monday', 'tuesday', ...]
  overrideForCritical: boolean;
}

interface EscalationRule {
  id: string;
  notificationId: string;
  condition: 'unacknowledged' | 'unresolved' | 'critical';
  afterMinutes: number;
  escalateTo: ('owner' | 'manager' | 'all' | 'custom')[];
  customUsers?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION CATEGORIES & CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const NOTIFICATION_CATEGORIES = {
  health: {
    label: "Animal Health & Welfare",
    description: "Critical health alerts, disease outbreaks, and welfare monitoring",
    icon: AlertCircle,
    color: "rose",
  },
  production: {
    label: "Production & Performance",
    description: "Production targets, yield alerts, and performance metrics",
    icon: TrendingUp,
    color: "emerald",
  },
  environment: {
    label: "Environmental Monitoring",
    description: "Temperature, humidity, water quality, and weather alerts",
    icon: Thermometer,
    color: "blue",
  },
  inventory: {
    label: "Inventory & Supplies",
    description: "Feed, medication, and supply level alerts",
    icon: Package,
    color: "amber",
  },
  financial: {
    label: "Financial & Sales",
    description: "Sales, payments, and financial threshold alerts",
    icon: DollarSign,
    color: "emerald",
  },
  task: {
    label: "Tasks & Activities",
    description: "Scheduled tasks, vaccinations, and treatment reminders",
    icon: ListChecks,
    color: "purple",
  },
  team: {
    label: "Team & Collaboration",
    description: "Team member activities and notifications",
    icon: Users,
    color: "blue",
  },
  system: {
    label: "System & Integrations",
    description: "System updates, integrations, and maintenance alerts",
    icon: Settings,
    color: "gray",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TEMPLATES - Real Operational Alerts
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_NOTIFICATIONS: NotificationPreference[] = [
  // ── Animal Health ──
  {
    id: "disease_outbreak",
    category: "health",
    label: "Disease Outbreak Alert",
    description: "Immediate notification of potential disease outbreak in your flock/herd",
    icon: AlertTriangle,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: true },
    frequency: 'instant',
    priority: 'critical',
    escalation: {
      enabled: true,
      afterMinutes: 15,
      escalateTo: ['owner', 'manager'],
    },
  },
  {
    id: "mortality_spike",
    category: "health",
    label: "Mortality Spike Alert",
    description: "Unusual increase in mortality rates across any animal group",
    icon: AlertCircle,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: false },
    frequency: 'instant',
    priority: 'high',
    escalation: {
      enabled: true,
      afterMinutes: 30,
      escalateTo: ['manager'],
    },
  },
  {
    id: "health_check_reminder",
    category: "health",
    label: "Health Check Reminder",
    description: "Scheduled health checks and wellness monitoring reminders",
    icon: Activity,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'daily',
    priority: 'medium',
  },
  
  // ── Production ──
  {
    id: "production_target",
    category: "production",
    label: "Production Target Alert",
    description: "Notify when production falls below or exceeds targets (eggs, milk, weight gain)",
    icon: TrendingUp,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'daily',
    priority: 'medium',
  },
  {
    id: "feed_conversion",
    category: "production",
    label: "Feed Conversion Alert",
    description: "Abnormal feed conversion ratio indicating potential issues",
    icon: Package,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'instant',
    priority: 'high',
  },
  {
    id: "laying_cycle",
    category: "production",
    label: "Laying Cycle Alert",
    description: "Significant drops or changes in egg production patterns",
    icon: Egg,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: false },
    frequency: 'instant',
    priority: 'high',
  },
  
  // ── Environment ──
  {
    id: "temperature_alert",
    category: "environment",
    label: "Temperature Alert",
    description: "Extreme temperature variations in poultry houses or livestock pens",
    icon: Thermometer,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: true },
    frequency: 'instant',
    priority: 'high',
  },
  {
    id: "humidity_alert",
    category: "environment",
    label: "Humidity Alert",
    description: "Abnormal humidity levels affecting animal comfort and health",
    icon: Droplet,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'instant',
    priority: 'medium',
  },
  {
    id: "water_quality",
    category: "environment",
    label: "Water Quality Alert",
    description: "Poor water quality or water supply issues",
    icon: Droplet,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: false },
    frequency: 'instant',
    priority: 'high',
  },
  {
    id: "weather_alert",
    category: "environment",
    label: "Weather Advisory",
    description: "Severe weather warnings affecting farm operations",
    icon: Cloud,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: true },
    frequency: 'instant',
    priority: 'high',
  },
  
  // ── Inventory & Supplies ──
  {
    id: "feed_low_stock",
    category: "inventory",
    label: "Low Feed Stock Alert",
    description: "Feed inventory below threshold - prevent running out",
    icon: Package,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: true },
    frequency: 'instant',
    priority: 'critical',
  },
  {
    id: "medication_low_stock",
    category: "inventory",
    label: "Medication & Vaccine Low Stock",
    description: "Essential medications and vaccines running low",
    icon: Pill,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: false },
    frequency: 'instant',
    priority: 'high',
  },
  {
    id: "supply_reorder",
    category: "inventory",
    label: "Supply Reorder Reminder",
    description: "Schedule and reminder for recurring supply orders",
    icon: Truck,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'daily',
    priority: 'medium',
  },
  
  // ── Financial ──
  {
    id: "sales_alert",
    category: "financial",
    label: "Sales & Revenue Alert",
    description: "Large sales, revenue milestones, or unusual transaction alerts",
    icon: DollarSign,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: true },
    frequency: 'instant',
    priority: 'medium',
  },
  {
    id: "payment_reminder",
    category: "financial",
    label: "Payment Reminder",
    description: "Reminders for pending payments and receivables",
    icon: DollarSign,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: true },
    frequency: 'daily',
    priority: 'medium',
  },
  {
    id: "cost_threshold",
    category: "financial",
    label: "Cost Threshold Alert",
    description: "Production costs exceeding budget thresholds",
    icon: AlertTriangle,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'weekly',
    priority: 'medium',
  },
  
  // ── Tasks & Activities ──
  {
    id: "vaccination_reminder",
    category: "task",
    label: "Vaccination Reminder",
    description: "Scheduled vaccinations due for your livestock",
    icon: Pill,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: true },
    frequency: 'instant',
    priority: 'high',
  },
  {
    id: "treatment_reminder",
    category: "task",
    label: "Treatment Reminder",
    description: "Follow-up treatments and medication schedules",
    icon: Activity,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: false },
    frequency: 'instant',
    priority: 'high',
  },
  {
    id: "task_overdue",
    category: "task",
    label: "Overdue Task Alert",
    description: "Missed or overdue farm tasks",
    icon: AlarmClock,
    enabled: true,
    channels: { inApp: true, email: true, sms: true, whatsapp: false },
    frequency: 'instant',
    priority: 'high',
  },
  
  // ── Team ──
  {
    id: "team_assignment",
    category: "team",
    label: "Task Assignment Notification",
    description: "When you're assigned a new task or responsibility",
    icon: User,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'instant',
    priority: 'medium',
  },
  {
    id: "team_activity",
    category: "team",
    label: "Team Activity Feed",
    description: "Updates on team member activities and record changes",
    icon: Users,
    enabled: false,
    channels: { inApp: true, email: false, sms: false, whatsapp: false },
    frequency: 'daily',
    priority: 'low',
  },
  
  // ── System ──
  {
    id: "system_update",
    category: "system",
    label: "System Updates",
    description: "Platform updates, maintenance, and new features",
    icon: Settings,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'weekly',
    priority: 'low',
  },
  {
    id: "integration_alert",
    category: "system",
    label: "Integration Alerts",
    description: "Connected service status and integration issues",
    icon: Zap,
    enabled: true,
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    frequency: 'instant',
    priority: 'medium',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function NotificationSettingsPage() {
  const { farmId } = useParams();
  const { role, isOwner, isManager } = useFarmRole();
  
  const [notifications, setNotifications] = useState<NotificationPreference[]>(DEFAULT_NOTIFICATIONS);
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    start: "22:00",
    end: "06:00",
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    overrideForCritical: true,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.keys(NOTIFICATION_CATEGORIES).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Group notifications by category
  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.category]) {
      acc[notification.category] = [];
    }
    acc[notification.category].push(notification);
    return acc;
  }, {} as Record<string, NotificationPreference[]>);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, enabled: !n.enabled } : n
      )
    );
    setHasChanges(true);
  };

  const toggleChannel = (id: string, channel: keyof NotificationPreference['channels']) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, channels: { ...n.channels, [channel]: !n.channels[channel] } } : n
      )
    );
    setHasChanges(true);
  };

  const changeFrequency = (id: string, frequency: NotificationPreference['frequency']) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, frequency } : n
      )
    );
    setHasChanges(true);
  };

  const toggleQuietHours = () => {
    setQuietHours(prev => ({ ...prev, enabled: !prev.enabled }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // API call to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Notification preferences saved successfully");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setNotifications(DEFAULT_NOTIFICATIONS);
    setQuietHours({
      enabled: false,
      start: "22:00",
      end: "06:00",
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      overrideForCritical: true,
    });
    setHasChanges(false);
    toast.info("Preferences reset to defaults");
  };

  const getCategoryStats = (category: string) => {
    const items = groupedNotifications[category] || [];
    const total = items.length;
    const enabled = items.filter(n => n.enabled).length;
    return { total, enabled };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-rose-600 bg-rose-50 dark:bg-rose-950/20';
      case 'high': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
      case 'medium': return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'instant': return 'Instant';
      case 'daily': return 'Daily Digest';
      case 'weekly': return 'Weekly Summary';
      default: return frequency;
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'instant': return BellRing;
      case 'daily': return CalendarDays;
      case 'weekly': return Calendar;
      default: return Bell;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'inApp': return 'In-app';
      case 'email': return 'Email';
      case 'sms': return 'SMS';
      case 'whatsapp': return 'WhatsApp';
      default: return channel;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'inApp': return Bell;
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'whatsapp': return MessageSquare;
      default: return Bell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how you receive alerts and updates for this farm
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Role-based Access Info */}
      {!isOwner && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {isManager ? "Manager Access" : "Team Member Access"}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400/70">
                {isManager 
                  ? "You can manage all notification settings for this farm"
                  : "You can only configure your personal notification preferences"
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickStat
          label="Active Notifications"
          value={`${notifications.filter(n => n.enabled).length}/${notifications.length}`}
          icon={Bell}
          color="blue"
        />
        <QuickStat
          label="Critical Alerts"
          value={notifications.filter(n => n.priority === 'critical' && n.enabled).length}
          icon={AlertCircle}
          color="rose"
        />
        <QuickStat
          label="SMS Enabled"
          value={notifications.filter(n => n.channels.sms && n.enabled).length}
          icon={MessageSquare}
          color="green"
        />
        <QuickStat
          label="Quiet Hours"
          value={quietHours.enabled ? `${quietHours.start} - ${quietHours.end}` : 'Off'}
          icon={Moon}
          color="purple"
        />
      </div>

      {/* Quiet Hours */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Moon className="h-4 w-4" />
                Quiet Hours
              </CardTitle>
              <CardDescription>
                Silence non-critical notifications during specified hours
              </CardDescription>
            </div>
            <Switch
              checked={quietHours.enabled}
              onCheckedChange={toggleQuietHours}
            />
          </div>
        </CardHeader>
        {quietHours.enabled && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-sm">Start Time</Label>
                <div className="flex items-center gap-2 mt-1">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={quietHours.start}
                    onChange={(e) => {
                      setQuietHours(prev => ({ ...prev, start: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">End Time</Label>
                <div className="flex items-center gap-2 mt-1">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={quietHours.end}
                    onChange={(e) => {
                      setQuietHours(prev => ({ ...prev, end: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">Days</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                    const isActive = quietHours.days.includes(dayNames[index]);
                    return (
                      <Button
                        key={day}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => {
                          const dayName = dayNames[index];
                          setQuietHours(prev => ({
                            ...prev,
                            days: prev.days.includes(dayName)
                              ? prev.days.filter(d => d !== dayName)
                              : [...prev.days, dayName]
                          }));
                          setHasChanges(true);
                        }}
                      >
                        {day}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Switch
                checked={quietHours.overrideForCritical}
                onCheckedChange={(checked) => {
                  setQuietHours(prev => ({ ...prev, overrideForCritical: checked }));
                  setHasChanges(true);
                }}
                id="override-critical"
              />
              <Label htmlFor="override-critical" className="text-sm text-muted-foreground">
                Allow critical alerts to override quiet hours
              </Label>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notification Categories */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(NOTIFICATION_CATEGORIES).map(([key, category]) => {
              const stats = getCategoryStats(key);
              if (stats.total === 0) return null;
              return (
                <TabsTrigger key={key} value={key} className="gap-1">
                  <category.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{category.label.split(' ')[0]}</span>
                  <Badge variant="secondary" className="h-4 w-4 p-0 text-[9px] flex items-center justify-center">
                    {stats.enabled}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const allEnabled = notifications.every(n => n.enabled);
                setNotifications(prev => 
                  prev.map(n => ({ ...n, enabled: !allEnabled }))
                );
                setHasChanges(true);
              }}
            >
              {notifications.every(n => n.enabled) ? (
                <>Disable All</>
              ) : (
                <>Enable All</>
              )}
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="space-y-6">
            {Object.entries(NOTIFICATION_CATEGORIES).map(([categoryId, category]) => {
              const items = groupedNotifications[categoryId] || [];
              if (items.length === 0) return null;
              const stats = getCategoryStats(categoryId);

              return (
                <NotificationCategory
                  key={categoryId}
                  category={category}
                  categoryId={categoryId}
                  items={items}
                  stats={stats}
                  isExpanded={expandedCategories[categoryId]}
                  onToggle={() => toggleCategory(categoryId)}
                  onToggleNotification={toggleNotification}
                  onToggleChannel={toggleChannel}
                  onChangeFrequency={changeFrequency}
                  getPriorityColor={getPriorityColor}
                  getFrequencyLabel={getFrequencyLabel}
                  getFrequencyIcon={getFrequencyIcon}
                  getChannelLabel={getChannelLabel}
                  getChannelIcon={getChannelIcon}
                />
              );
            })}
          </div>
        </TabsContent>

        {Object.keys(NOTIFICATION_CATEGORIES).map((categoryId) => {
          const items = groupedNotifications[categoryId] || [];
          if (items.length === 0) return null;
          const category = NOTIFICATION_CATEGORIES[categoryId];
          const stats = getCategoryStats(categoryId);

          return (
            <TabsContent key={categoryId} value={categoryId} className="mt-0">
              <NotificationCategory
                category={category}
                categoryId={categoryId}
                items={items}
                stats={stats}
                isExpanded={true}
                onToggle={() => {}}
                onToggleNotification={toggleNotification}
                onToggleChannel={toggleChannel}
                onChangeFrequency={changeFrequency}
                getPriorityColor={getPriorityColor}
                getFrequencyLabel={getFrequencyLabel}
                getFrequencyIcon={getFrequencyIcon}
                getChannelLabel={getChannelLabel}
                getChannelIcon={getChannelIcon}
              />
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Preview Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Notification Preview
          </CardTitle>
          <CardDescription>
            See how notifications will appear to recipients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <NotificationPreview
              title="🚨 Disease Outbreak Alert"
              message="High mortality detected in House 3 - Layer flock. 47 deaths reported in the last 6 hours. Immediate action required."
              type="critical"
              channel="SMS"
              time="2 min ago"
            />
            <NotificationPreview
              title="⚠️ Temperature Alert"
              message="Temperature in House 2 has exceeded 35°C. Ventilation systems may need adjustment."
              type="warning"
              channel="In-app"
              time="15 min ago"
            />
            <NotificationPreview
              title="📋 Daily Digest"
              message="Summary: 3 tasks completed, 2 pending, 1 overdue. 45 eggs collected. Feed stock at 65%."
              type="info"
              channel="Email"
              time="Today, 6:00 AM"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION CATEGORY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface NotificationCategoryProps {
  category: typeof NOTIFICATION_CATEGORIES[keyof typeof NOTIFICATION_CATEGORIES];
  categoryId: string;
  items: NotificationPreference[];
  stats: { total: number; enabled: number };
  isExpanded: boolean;
  onToggle: () => void;
  onToggleNotification: (id: string) => void;
  onToggleChannel: (id: string, channel: keyof NotificationPreference['channels']) => void;
  onChangeFrequency: (id: string, frequency: NotificationPreference['frequency']) => void;
  getPriorityColor: (priority: string) => string;
  getFrequencyLabel: (frequency: string) => string;
  getFrequencyIcon: (frequency: string) => React.ElementType;
  getChannelLabel: (channel: string) => string;
  getChannelIcon: (channel: string) => React.ElementType;
}

function NotificationCategory({
  category,
  categoryId,
  items,
  stats,
  isExpanded,
  onToggle,
  onToggleNotification,
  onToggleChannel,
  onChangeFrequency,
  getPriorityColor,
  getFrequencyLabel,
  getFrequencyIcon,
  getChannelLabel,
  getChannelIcon,
}: NotificationCategoryProps) {
  const Icon = category.icon;

  return (
    <Card className="overflow-hidden">
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted/10 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-full p-2",
            `bg-${category.color}-50 dark:bg-${category.color}-950/20`
          )}>
            <Icon className={cn(
              "h-4 w-4",
              `text-${category.color}-600 dark:text-${category.color}-400`
            )} />
          </div>
          <div>
            <h3 className="font-medium">{category.label}</h3>
            <p className="text-xs text-muted-foreground">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">
            {stats.enabled}/{stats.total} enabled
          </Badge>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-border">
          {items.map((notification) => (
            <div key={notification.id} className="p-4 hover:bg-muted/5 transition-colors">
              <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <notification.icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{notification.label}</span>
                        <Badge className={cn("text-[9px] px-1.5 py-0", getPriorityColor(notification.priority))}>
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notification.enabled}
                    onCheckedChange={() => onToggleNotification(notification.id)}
                  />
                </div>

                {/* Controls */}
                {notification.enabled && (
                  <div className="flex flex-wrap items-center gap-4 pl-7 pt-2">
                    {/* Channels */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Channels:</span>
                      {Object.entries(notification.channels).map(([channel, enabled]) => {
                        const ChannelIcon = getChannelIcon(channel);
                        return (
                          <Button
                            key={channel}
                            variant={enabled ? "default" : "outline"}
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => onToggleChannel(notification.id, channel as keyof NotificationPreference['channels'])}
                          >
                            <ChannelIcon className="h-3 w-3" />
                            {getChannelLabel(channel)}
                          </Button>
                        );
                      })}
                    </div>

                    {/* Frequency */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Frequency:</span>
                      <Select
                        value={notification.frequency}
                        onValueChange={(value: NotificationPreference['frequency']) =>
                          onChangeFrequency(notification.id, value)
                        }
                      >
                        <SelectTrigger className="h-7 w-[130px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">⚡ Instant</SelectItem>
                          <SelectItem value="daily">📅 Daily Digest</SelectItem>
                          <SelectItem value="weekly">📊 Weekly Summary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Escalation */}
                    {notification.escalation && notification.escalation.enabled && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>Escalate after {notification.escalation.afterMinutes}min to:</span>
                        <Badge variant="outline" className="text-[9px]">
                          {notification.escalation.escalateTo.join(', ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK STAT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function QuickStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
    rose: "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400",
    green: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
    purple: "bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400",
    amber: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400",
  };

  return (
    <div className={cn("rounded-xl p-3 text-center", colors[color as keyof typeof colors])}>
      <Icon className="h-4 w-4 mx-auto mb-1 opacity-60" />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION PREVIEW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function NotificationPreview({
  title,
  message,
  type,
  channel,
  time,
}: {
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  channel: string;
  time: string;
}) {
  const colors = {
    critical: "border-l-rose-500 bg-rose-50 dark:bg-rose-950/20",
    warning: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
    info: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
    success: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
  };

  return (
    <div className={cn("rounded-lg border-l-4 p-3", colors[type])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {message}
          </p>
        </div>
        <div className="flex flex-col items-end text-[10px] text-muted-foreground whitespace-nowrap">
          <Badge variant="outline" className="text-[9px]">
            {channel}
          </Badge>
          <span className="mt-1">{time}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSING IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

import { Cloud, Package, Egg } from "lucide-react";