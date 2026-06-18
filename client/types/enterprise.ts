// lib/types/enterprise.ts
 export interface ModuleRiskAssessment {
  key: "poultry" | "dairy" | "crops" | "inventory";
  
  // Revenue impact
  revenueContribution: number; // 0.60 = 60% of total
  revenueMonth: number;
  revenueTarget: number;
  revenueVariance: number; // -0.08 = 8% below target
  
  // Operational health
  operationalStatus: "healthy" | "warning" | "critical";
  riskFactors: Array<{
    factor: string; // "mortality_spike" | "feed_low" | "temperature_high"
    severity: "low" | "medium" | "high";
    impact: string; // "Could reduce revenue by 5% if not resolved"
    action: string; // "Isolate 200 birds" or "Reorder feed"
  }>;
  
  // Key metrics for this module
  keyMetrics: Array<{
    name: string;
    current: number;
    target: number;
    unit: string;
    status: "green" | "amber" | "red";
  }>;
  
  // Alerts and incidents
  activeAlerts: number;
  recentIncidents: Array<{ time: string; description: string }>;
}

interface DashboardRiskSummary {
  modules: ModuleRiskAssessment[];
  businessImpact: {
    projectedRevenueChange: number; // -0.15 = 15% revenue impact
    projectedMarginChange: number; // -0.08 = 8 percentage points
    criticalPathItems: string[]; // "Feed supply" | "Bird health" | etc
  };
}