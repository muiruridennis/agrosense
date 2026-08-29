// recommendation/recommendation.service.ts

import { Injectable } from '@nestjs/common';
import { InsightService } from '../insight/insight.service';
import {
  Insight,
  InsightCategory,
  InsightSeverity,
} from '../insight/insight.types';
import {
  Recommendation,
  RecommendationAction,
  RecommendationCategory,
  RecommendationPriority,
  RecommendationSource,
  RecommendationStatus,
  RecommendationUrgency,
} from './recommendation.types';

@Injectable()
export class RecommendationService {
  constructor(private readonly insightService: InsightService) {}

  async generateRecommendations(
    flockId: string,
    farmId: string,
  ): Promise<Recommendation[]> {
    const insights = await this.insightService.generateInsights(
      flockId,
      farmId,
    );

    const recommendations: Recommendation[] = [];

    for (const insight of insights) {
      // InsightService is the source of truth for actionability.
      if (!insight.isActionable) {
        continue;
      }

      const recommendation = this.translateInsightToRecommendation(insight);

      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSLATION
  // ═══════════════════════════════════════════════════════════════════════

  private translateInsightToRecommendation(
    insight: Insight,
  ): Recommendation | null {
    switch (insight.category) {
      case InsightCategory.PRODUCTION:
        return this.handleProductionInsight(insight);

      case InsightCategory.FEED:
        return this.handleFeedInsight(insight);

      case InsightCategory.HEALTH:
        return this.handleHealthInsight(insight);

      default:
        return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMMON HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  private createAction(
    description: string,
    order: number,
  ): RecommendationAction {
    return {
      description,
      required: true,
      order,
    };
  }

  private createRecommendationBase(
    insight: Insight,
    category: RecommendationCategory,
    priority: RecommendationPriority,
    title: string,
    description: string,
    actions: RecommendationAction[],
  ): Recommendation {
    const now = new Date();

    const expectedValue = Number(insight.data.expected ?? 0);
    const actualValue = Number(insight.data.actual ?? 0);

    let comparison: 'equal' | 'above' | 'below';

    if (actualValue === expectedValue) {
      comparison = 'equal';
    } else if (actualValue > expectedValue) {
      comparison = 'above';
    } else {
      comparison = 'below';
    }

    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,

      insightId: insight.id,

      category,

      priority,

      urgency: this.getUrgency(priority),

      status: RecommendationStatus.PENDING,

      source: RecommendationSource.INSIGHT,

      title,

      description,

      actions,

      impact: null,

      evidence: {
        insightId: insight.id,

        dataPoints: [
          {
            metric: insight.sourceMetric ?? insight.title,
            value: actualValue,
            threshold: expectedValue,
            comparison,
          },
        ],

        confidence: insight.confidence ?? 80,

        notes: insight.description,
      },

      generatedAt: now,

      updatedAt: now,

      dueDate: this.getDueDate(priority),

      actedAt: null,

      acknowledged: false,

      acknowledgedAt: null,

      metadata: {
        sourceCategory: insight.category,
        severity: insight.severity,
      },
    };
  }

  private getUrgency(
    priority: RecommendationPriority,
  ): RecommendationUrgency {
    switch (priority) {
      case RecommendationPriority.CRITICAL:
        return RecommendationUrgency.NOW;

      case RecommendationPriority.HIGH:
        return RecommendationUrgency.TODAY;

      case RecommendationPriority.MEDIUM:
        return RecommendationUrgency.THIS_WEEK;

      default:
        return RecommendationUrgency.OPTIONAL;
    }
  }

  private getDueDate(
    priority: RecommendationPriority,
  ): Date | null {
    const now = new Date();

    switch (priority) {
      case RecommendationPriority.CRITICAL:
        return new Date(now.getTime() + 6 * 60 * 60 * 1000);

      case RecommendationPriority.HIGH:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);

      case RecommendationPriority.MEDIUM:
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUCTION
  // ═══════════════════════════════════════════════════════════════════════

  private handleProductionInsight(
    insight: Insight,
  ): Recommendation | null {
    switch (insight.severity) {
      case InsightSeverity.LOW:
        return this.createRecommendationBase(
          insight,
          RecommendationCategory.PRODUCTION,
          RecommendationPriority.MEDIUM,
          'Monitor Production Performance',
          `Production is ${insight.data.actual}%, at the minimum expected threshold. Monitor the flock closely for further decline.`,
          [
            this.createAction(
              'Review recent feed intake and feed quality',
              1,
            ),
            this.createAction(
              'Verify water availability and quality',
              2,
            ),
            this.createAction(
              'Monitor birds for signs of illness or stress',
              3,
            ),
            this.createAction(
              'Review recent management changes',
              4,
            ),
          ],
        );

      case InsightSeverity.MEDIUM:
        return this.createRecommendationBase(
          insight,
          RecommendationCategory.PRODUCTION,
          RecommendationPriority.HIGH,
          'Production Below Target',
          `Production is ${insight.data.actual}%, which is below the expected minimum of ${insight.data.expected}%. The flock requires attention.`,
          [
            this.createAction(
              'Check feed quality and formulation',
              1,
            ),
            this.createAction(
              'Verify lighting schedule',
              2,
            ),
            this.createAction(
              'Inspect birds for signs of disease or stress',
              3,
            ),
            this.createAction(
              'Review recent management changes',
              4,
            ),
          ],
        );

      case InsightSeverity.HIGH:
      case InsightSeverity.CRITICAL:
        return this.createRecommendationBase(
          insight,
          RecommendationCategory.PRODUCTION,
          RecommendationPriority.CRITICAL,
          'Critical Production Decline',
          `Production has dropped to ${insight.data.actual}%. Immediate attention is required.`,
          [
            this.createAction(
              'Conduct an urgent health inspection',
              1,
            ),
            this.createAction(
              'Check feed quality and availability',
              2,
            ),
            this.createAction(
              'Check water supply and quality',
              3,
            ),
            this.createAction(
              'Review vaccination and health records',
              4,
            ),
            this.createAction(
              'Contact a veterinarian if health problems are suspected',
              5,
            ),
          ],
        );

      default:
        return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FEED
  // ═══════════════════════════════════════════════════════════════════════

  private handleFeedInsight(
    insight: Insight,
  ): Recommendation | null {
    const actual = Number(insight.data.actual ?? 0);
    const minimum = Number(insight.data.expectedRange?.min ?? 0);
    const maximum = Number(insight.data.expectedRange?.max ?? 0);

    const isLow = actual < minimum;
    const isZero = actual === 0;

    if (
      insight.severity === InsightSeverity.CRITICAL ||
      isZero
    ) {
      return this.createRecommendationBase(
        insight,
        RecommendationCategory.FEED,
        RecommendationPriority.CRITICAL,
        'Critical Feed Intake Problem',
        'The flock has recorded zero feed consumption. This requires immediate verification.',
        [
          this.createAction(
            'Verify that feed is available',
            1,
          ),
          this.createAction(
            'Check feeder accessibility and condition',
            2,
          ),
          this.createAction(
            'Verify that birds have access to the feeders',
            3,
          ),
          this.createAction(
            'Check water availability',
            4,
          ),
          this.createAction(
            'Inspect birds for signs of illness or stress',
            5,
          ),
        ],
      );
    }

    if (insight.severity === InsightSeverity.MEDIUM) {
      if (isLow) {
        return this.createRecommendationBase(
          insight,
          RecommendationCategory.FEED,
          RecommendationPriority.MEDIUM,
          'Low Feed Intake Detected',
          `Feed intake is ${actual.toFixed(1)}g/bird/day, below the expected minimum of ${minimum}g/bird/day.`,
          [
            this.createAction(
              'Check feeder accessibility and spacing',
              1,
            ),
            this.createAction(
              'Verify feed quality and freshness',
              2,
            ),
            this.createAction(
              'Observe bird behavior during feeding',
              3,
            ),
            this.createAction(
              'Check for signs of illness affecting appetite',
              4,
            ),
          ],
        );
      }

      return this.createRecommendationBase(
        insight,
        RecommendationCategory.FEED,
        RecommendationPriority.MEDIUM,
        'High Feed Intake Detected',
        `Feed intake is ${actual.toFixed(1)}g/bird/day, above the expected maximum of ${maximum}g/bird/day.`,
        [
          this.createAction(
            'Check for feed spillage and wastage',
            1,
          ),
          this.createAction(
            'Verify feed formulation',
            2,
          ),
          this.createAction(
            'Adjust feeder settings to reduce waste',
            3,
          ),
          this.createAction(
            'Review bird weight and body condition',
            4,
          ),
        ],
      );
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HEALTH
  // ═══════════════════════════════════════════════════════════════════════

  private handleHealthInsight(
    insight: Insight,
  ): Recommendation | null {
    if (insight.severity === InsightSeverity.HIGH) {
      return this.createRecommendationBase(
        insight,
        RecommendationCategory.HEALTH,
        RecommendationPriority.CRITICAL,
        'Elevated Mortality Detected',
        `Mortality is ${insight.data.actual}%, exceeding the expected threshold of ${insight.data.expected}%. Immediate investigation is recommended.`,
        [
          this.createAction(
            'Conduct a thorough health inspection of the flock',
            1,
          ),
          this.createAction(
            'Review recent mortality and health records',
            2,
          ),
          this.createAction(
            'Review vaccination records and schedule',
            3,
          ),
          this.createAction(
            'Check temperature, ventilation, and humidity',
            4,
          ),
          this.createAction(
            'Separate visibly sick birds according to farm veterinary protocols',
            5,
          ),
          this.createAction(
            'Contact a veterinarian',
            6,
          ),
        ],
      );
    }

    if (insight.severity === InsightSeverity.MEDIUM) {
      return this.createRecommendationBase(
        insight,
        RecommendationCategory.HEALTH,
        RecommendationPriority.MEDIUM,
        'Health Alert: Mortality Rising',
        `Mortality is ${insight.data.actual}%, above the acceptable range. The flock should be monitored closely.`,
        [
          this.createAction(
            'Increase observation frequency',
            1,
          ),
          this.createAction(
            'Review biosecurity protocols',
            2,
          ),
          this.createAction(
            'Check birds for signs of illness',
            3,
          ),
          this.createAction(
            'Review recent mortality records',
            4,
          ),
          this.createAction(
            'Consider consulting a veterinarian',
            5,
          ),
        ],
      );
    }

    return null;
  }
}
