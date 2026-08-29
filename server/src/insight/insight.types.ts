// insight/insight.types.ts

/**
 * Insight Module - Type Definitions
 *
 * The Insight layer is responsible for DESCRIBING what the data shows.
 * It does NOT make recommendations or decisions.
 *
 * An Insight answers: "What does the data show?"
 * A Recommendation answers: "What should the farmer do?"
 *
 * These are separate concerns.
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export enum InsightCategory {
  PRODUCTION = 'production',
  FEED = 'feed',
  HEALTH = 'health',
  GROWTH = 'growth',
  ENVIRONMENT = 'environment',
  FINANCIAL = 'financial',
  WATER = 'water',
  MORTALITY = 'mortality',
  UNIFORMITY = 'uniformity',
}

export enum InsightSeverity {
  INFO = 'info', // Informational, no action needed
  LOW = 'low', // Monitor, no immediate action
  MEDIUM = 'medium', // Action recommended
  HIGH = 'high', // Action required soon
  CRITICAL = 'critical', // Immediate action required
}

export enum InsightStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

// ─── INTERFACES ──────────────────────────────────────────────────────────────

export interface InsightData {
  /** The actual measured value */
  actual: number | string;

  /** The expected or target value */
  expected?: number | string;

  /** Optional range for benchmarked expectations */
  expectedRange?: {
    min: number;
    max: number;
  };

  /** Optional display-friendly expected format */
  expectedDisplay?: string;

  /** Unit of measurement (%, kg, g/bird, etc.) */
  unit?: string;

  /** Previous value for trend comparison */
  previous?: number | string;

  /** Percent change from previous value */
  percentChange?: number;

  /** The date of the data point */
  dataDate?: Date | string;
}

export interface InsightContext {
  /** Flock breed */
  breed?: string;

  /** Flock age in days */
  age?: number;

  /** Flock stage (placed, growing, laying_peak, etc.) */
  stage?: string;

  /** Flock type (layers, broilers, kienyeji, breeders) */
  type?: string;

  /** Date of placement */
  placementDate?: Date;

  /** Farm ID */
  farmId?: string;

  /** House ID */
  houseId?: string;
}

export interface Insight {
  /** Unique identifier (can be generated) */
  id: string;

  /** Category of the insight */
  category: InsightCategory;

  /** Severity level */
  severity: InsightSeverity;

  /** Current status */
  status: InsightStatus;

  /** Short, descriptive title */
  title: string;

  /** Detailed description of what the data shows */
  description: string;

  /** The actual data behind the insight */
  data: InsightData;

  /** Context about the flock */
  context: InsightContext;

  /** When the insight was generated */
  timestamp: Date;

  /** When the data was recorded (if different from timestamp) */
  dataTimestamp?: Date;

  /** Whether this insight is actionable (requires action) */
  isActionable: boolean;

  /** Source of the insight (which metric triggered it) */
  sourceMetric?: string;

  /** Confidence level (0-100) - how certain is this insight */
  confidence?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ─── INSIGHT COLLECTION ─────────────────────────────────────────────────────

export interface InsightCollection {
  /** All insights for the flock */
  insights: Insight[];

  /** Summary counts by severity */
  summary: {
    total: number;
    bySeverity: Record<InsightSeverity, number>;
    byCategory: Record<InsightCategory, number>;
    actionable: number;
  };

  /** The highest severity insight */
  highestSeverity: InsightSeverity | null;

  /** When the collection was generated */
  generatedAt: Date;

  /** Flock ID this collection belongs to */
  flockId: string;

  /** Data freshness */
  dataFreshness: {
    daysSinceLastRecord: number;
    hasTodayRecord: boolean;
    lastRecordDate: Date | null;
  };
}

// ─── BENCHMARK TYPES ────────────────────────────────────────────────────────

export interface ProductionBenchmarks {
  /** Peak production rate (%) */
  peak: number;

  /** Good production rate (%) */
  good: number;

  /** Minimum acceptable production rate (%) */
  minimum: number;

  /** Production drop threshold (%) */
  dropThreshold: number;
}

export interface FeedBenchmarks {
  /** Minimum feed intake (g/bird/day) */
  min: number;

  /** Maximum feed intake (g/bird/day) */
  max: number;

  /** Target feed intake (g/bird/day) */
  target: number;
}

export interface HealthBenchmarks {
  /** Maximum acceptable mortality (%) */
  mortalityThreshold: number;

  /** Maximum acceptable culling (%) */
  cullingThreshold: number;

  /** Mortality spike threshold (x times baseline) */
  mortalitySpikeThreshold: number;

  /** Sick bird threshold (count) */
  sickBirdThreshold: number;
}

export interface GrowthBenchmarks {
  /** Minimum weight (kg) at age */
  minWeight: number;

  /** Maximum weight (kg) at age */
  maxWeight: number;

  /** Target weight (kg) at age */
  targetWeight: number;

  /** Minimum daily gain (kg/day) */
  minDailyGain: number;

  /** Uniformity target (%) */
  uniformityTarget: number;
}

export interface WaterBenchmarks {
  /** Minimum water intake (litres/bird/day) */
  min: number;

  /** Maximum water intake (litres/bird/day) */
  max: number;

  /** Water to feed ratio minimum */
  waterToFeedRatioMin: number;

  /** Water to feed ratio maximum */
  waterToFeedRatioMax: number;
}

export interface FlockBenchmarks {
  /** Production benchmarks */
  production: ProductionBenchmarks;

  /** Feed benchmarks */
  feed: FeedBenchmarks;

  /** Health benchmarks */
  health: HealthBenchmarks;

  /** Growth benchmarks */
  growth: GrowthBenchmarks;

  /** Water benchmarks */
  water: WaterBenchmarks;

  /** Benchmark version */
  version: string;

  /** Date these benchmarks were set */
  effectiveDate: Date;

  /** Whether these benchmarks are the defaults or customized */
  isCustom: boolean;
}
