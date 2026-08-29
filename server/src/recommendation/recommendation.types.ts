// recommendation/recommendation.types.ts

/**
 * Recommendation Module - Type Definitions
 *
 * The Recommendation layer is responsible for suggesting ACTIONS to the farmer.
 * It takes Insights as input and generates actionable recommendations.
 *
 * An Insight answers: "What does the data show?"
 * A Recommendation answers: "What should the farmer do?"
 *
 * These are separate concerns.
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export enum RecommendationPriority {
  INFO = 'info',         // Informational, no urgent action
  LOW = 'low',           // Can be done when convenient
  MEDIUM = 'medium',     // Should be done soon
  HIGH = 'high',         // Should be done promptly
  CRITICAL = 'critical', // Immediate action required
}

export enum RecommendationCategory {
  PRODUCTION = 'production',
  FEED = 'feed',
  HEALTH = 'health',
  GROWTH = 'growth',
  ENVIRONMENT = 'environment',
  FINANCIAL = 'financial',
  WATER = 'water',
  MORTALITY = 'mortality',
  UNIFORMITY = 'uniformity',
  MANAGEMENT = 'management',
  MARKETING = 'marketing',
  BIOSECURITY = 'biosecurity',
}

export enum RecommendationStatus {
  PENDING = 'pending',         // Not yet acted upon
  IN_PROGRESS = 'in_progress', // Farmer is working on it
  IMPLEMENTED = 'implemented', // Completed
  DISMISSED = 'dismissed',     // Farmer chose to ignore
  EXPIRED = 'expired',         // No longer relevant
  AUTO_CLOSED = 'auto_closed', // Automatically closed by system
}

export enum RecommendationSource {
  INSIGHT = 'insight',           // Generated from an Insight
  ALERT = 'alert',               // Generated from an Alert
  SCHEDULED = 'scheduled',       // Scheduled check (e.g., vaccination)
  SYSTEM = 'system',             // System-generated
  FARMER = 'farmer',             // Farmer-created
  VETERINARIAN = 'veterinarian', // Vet-created
}

export enum RecommendationUrgency {
  NOW = 'now',           // Do immediately
  TODAY = 'today',       // Do before end of day
  THIS_WEEK = 'this_week', // Do this week
  THIS_MONTH = 'this_month', // Do this month
  NEXT_MONTH = 'next_month', // Do next month
  OPTIONAL = 'optional', // Nice to do, not urgent
}

// ─── INTERFACES ──────────────────────────────────────────────────────────────

export interface RecommendationAction {
  /** Description of the action */
  description: string;

  /** Who should perform this action */
  assignedTo?: 'farmer' | 'veterinarian' | 'worker' | 'manager';

  /** Estimated time to complete (minutes) */
  estimatedMinutes?: number;

  /** Is this action required or optional? */
  required: boolean;

  /** Order of execution (for multiple actions) */
  order: number;
}

export interface RecommendationImpact {
  /** Financial impact (KES) */
  financialImpact?: {
    estimated: number;
    type: 'positive' | 'negative' | 'neutral';
    description: string;
  };

  /** Production impact */
  productionImpact?: {
    estimated: number;
    unit: string;
    description: string;
  };

  /** Health impact */
  healthImpact?: {
    severity: 'low' | 'medium' | 'high';
    description: string;
  };
}

export interface RecommendationEvidence {
  /** The Insight that triggered this recommendation */
  insightId?: string;

  /** Supporting data points */
  dataPoints: Array<{
    metric: string;
    value: number | string;
    threshold: number | string;
    comparison: 'above' | 'below' | 'equal' | 'within';
  }>;

  /** Confidence level (0-100) */
  confidence: number;

  /** Additional notes */
  notes?: string;
}

export interface Recommendation {
  /** Unique identifier */
  id: string;

  /** ID of the insight that generated this (if applicable) */
  insightId: string | null;

  /** Category of the recommendation */
  category: RecommendationCategory;

  /** Priority level */
  priority: RecommendationPriority;

  /** Urgency timeline */
  urgency: RecommendationUrgency;

  /** Current status */
  status: RecommendationStatus;

  /** Source of the recommendation */
  source: RecommendationSource;

  /** Short, action-oriented title */
  title: string;

  /** Detailed description of what to do */
  description: string;

  /** Specific actions to take */
  actions: RecommendationAction[];

  /** Expected impact of following this recommendation */
  impact: RecommendationImpact | null;

  /** Evidence supporting this recommendation */
  evidence: RecommendationEvidence;

  /** When the recommendation was generated */
  generatedAt: Date;

  /** When the recommendation was last updated */
  updatedAt: Date;

  /** When the recommendation should be completed by */
  dueDate: Date | null;

  /** When it was acted upon */
  actedAt: Date | null;

  /** How it was resolved (if implemented) */
  resolutionNotes?: string;

  /** Whether the farmer has acknowledged this recommendation */
  acknowledged: boolean;

  /** Acknowledgement timestamp */
  acknowledgedAt: Date | null;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

// ─── RECOMMENDATION COLLECTION ────────────────────────────────────────────

export interface RecommendationCollection {
  /** All recommendations for the flock */
  recommendations: Recommendation[];

  /** Summary counts by priority */
  summary: {
    total: number;
    byPriority: Record<RecommendationPriority, number>;
    byCategory: Record<RecommendationCategory, number>;
    byStatus: Record<RecommendationStatus, number>;
    actionable: number; // Recommendations with priority >= MEDIUM
    urgent: number; // Recommendations with urgency >= TODAY
  };

  /** The highest priority recommendation */
  highestPriority: RecommendationPriority | null;

  /** The most urgent recommendation */
  mostUrgent: RecommendationUrgency | null;

  /** When the collection was generated */
  generatedAt: Date;

  /** Flock ID this collection belongs to */
  flockId: string;
}

// ─── RECOMMENDATION REQUEST ──────────────────────────────────────────────

export interface GenerateRecommendationsRequest {
  /** Flock ID */
  flockId: string;

  /** Farm ID */
  farmId: string;

  /** Whether to include dismissed recommendations */
  includeDismissed?: boolean;

  /** Whether to regenerate all recommendations */
  regenerateAll?: boolean;

  /** Max recommendations to generate */
  maxRecommendations?: number;

  /** Minimum priority to include */
  minPriority?: RecommendationPriority;
}

// ─── RECOMMENDATION RESPONSE ─────────────────────────────────────────────

export interface RecommendationResponse {
  /** The recommendation */
  recommendation: Recommendation;

  /** Whether the recommendation was successfully applied */
  success: boolean;

  /** Any error messages */
  errors: string[];

  /** Warnings */
  warnings: string[];
}

// ─── RECOMMENDATION RULE ──────────────────────────────────────────────────

export interface RecommendationRule {
  /** Unique rule ID */
  id: string;

  /** Rule name */
  name: string;

  /** Rule description */
  description: string;

  /** Category of recommendations this rule generates */
  category: RecommendationCategory;

  /** Priority of recommendations this rule generates */
  priority: RecommendationPriority;

  /** Urgency of recommendations this rule generates */
  urgency: RecommendationUrgency;

  /** Condition that triggers this rule (evaluated against insights) */
  condition: {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in';
    value: any;
    value2?: any; // For 'between' operator
  };

  /** Actions to recommend */
  actions: RecommendationAction[];

  /** Expected impact */
  impact: RecommendationImpact | null;

  /** Whether this rule is enabled */
  enabled: boolean;

  /** When the rule was created */
  createdAt: Date;

  /** When the rule was last updated */
  updatedAt: Date;
}

// ─── RECOMMENDATION HISTORY ──────────────────────────────────────────────

export interface RecommendationHistory {
  /** Recommendation ID */
  recommendationId: string;

  /** Old status */
  oldStatus: RecommendationStatus;

  /** New status */
  newStatus: RecommendationStatus;

  /** Who performed the change */
  changedBy: string;

  /** Why the change was made */
  reason?: string;

  /** When the change occurred */
  changedAt: Date;
}

// ─── CONVENIENCE HELPERS ──────────────────────────────────────────────────

/**
 * Check if a recommendation is actionable (needs attention)
 */
export function isRecommendationActionable(recommendation: Recommendation): boolean {
  return (
    recommendation.status === RecommendationStatus.PENDING &&
    (recommendation.priority === RecommendationPriority.HIGH ||
     recommendation.priority === RecommendationPriority.CRITICAL ||
     recommendation.urgency === RecommendationUrgency.NOW ||
     recommendation.urgency === RecommendationUrgency.TODAY)
  );
}

/**
 * Check if a recommendation is overdue
 */
export function isRecommendationOverdue(recommendation: Recommendation): boolean {
  if (!recommendation.dueDate) return false;
  return new Date() > recommendation.dueDate && 
         recommendation.status === RecommendationStatus.PENDING;
}

/**
 * Get the highest priority recommendation from a collection
 */
export function getHighestPriority(
  recommendations: Recommendation[],
): Recommendation | null {
  const priorityOrder: Record<RecommendationPriority, number> = {
    [RecommendationPriority.CRITICAL]: 5,
    [RecommendationPriority.HIGH]: 4,
    [RecommendationPriority.MEDIUM]: 3,
    [RecommendationPriority.LOW]: 2,
    [RecommendationPriority.INFO]: 1,
  };

  return recommendations
    .filter(r => r.status === RecommendationStatus.PENDING)
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])[0] || null;
}

/**
 * Get the most urgent recommendation from a collection
 */
export function getMostUrgent(
  recommendations: Recommendation[],
): Recommendation | null {
  const urgencyOrder: Record<RecommendationUrgency, number> = {
    [RecommendationUrgency.NOW]: 5,
    [RecommendationUrgency.TODAY]: 4,
    [RecommendationUrgency.THIS_WEEK]: 3,
    [RecommendationUrgency.THIS_MONTH]: 2,
    [RecommendationUrgency.NEXT_MONTH]: 1,
    [RecommendationUrgency.OPTIONAL]: 0,
  };

  return recommendations
    .filter(r => r.status === RecommendationStatus.PENDING)
    .sort((a, b) => urgencyOrder[b.urgency] - urgencyOrder[a.urgency])[0] || null;
}

/**
 * Group recommendations by category
 */
export function groupByCategory(
  recommendations: Recommendation[],
): Record<RecommendationCategory, Recommendation[]> {
  return recommendations.reduce((acc, rec) => {
    if (!acc[rec.category]) {
      acc[rec.category] = [];
    }
    acc[rec.category].push(rec);
    return acc;
  }, {} as Record<RecommendationCategory, Recommendation[]>);
}

/**
 * Group recommendations by priority
 */
export function groupByPriority(
  recommendations: Recommendation[],
): Record<RecommendationPriority, Recommendation[]> {
  return recommendations.reduce((acc, rec) => {
    if (!acc[rec.priority]) {
      acc[rec.priority] = [];
    }
    acc[rec.priority].push(rec);
    return acc;
  }, {} as Record<RecommendationPriority, Recommendation[]>);
}