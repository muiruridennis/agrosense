"use client";

import { useMemo, useState } from "react";
import {
  TrendingDown,
  AlertTriangle,
  Zap,
  Plus,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ModuleRiskAssessment } from "@/types/enterprise";

interface EnterpriseModulesProProps {
  modules: ModuleRiskAssessment[];
  businessImpact: {
    projectedRevenueChange: number;
    projectedMarginChange: number;
    criticalPathItems: string[];
  };
  role: "owner" | "manager" | "worker";
}

export function EnterpriseModulesPro({
  modules,
  businessImpact,
  role,
}: EnterpriseModulesProProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Sort by revenue contribution (what matters to owner)
  const sortedModules = useMemo(
    () =>
      [...modules].sort(
        (a, b) => b.revenueContribution - a.revenueContribution,
      ),
    [modules],
  );

  // Identify the "critical path" - what's blocking profit
  const criticalModule = sortedModules.find(
    (m) => m.operationalStatus === "critical",
  );
  const warningModules = sortedModules.filter(
    (m) => m.operationalStatus === "warning",
  );

  return (
    <div className="space-y-4">
      {/* Business Impact Summary */}
      <BusinessImpactBar
        projectedRevenueChange={businessImpact.projectedRevenueChange}
        projectedMarginChange={businessImpact.projectedMarginChange}
        criticalPathItems={businessImpact.criticalPathItems}
      />

      {/* Critical Module (if any) */}
      {criticalModule && (
        <ModuleRiskCard
          module={criticalModule}
          priority="critical"
          isExpanded={expandedModule === criticalModule.key}
          onToggle={() =>
            setExpandedModule(
              expandedModule === criticalModule.key ? null : criticalModule.key,
            )
          }
          role={role}
        />
      )}

      {/* Warning Modules */}
      {warningModules.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Modules needing attention
          </h4>
          {warningModules.map((module) => (
            <ModuleRiskCard
              key={module.key}
              module={module}
              priority="warning"
              isExpanded={expandedModule === module.key}
              onToggle={() =>
                setExpandedModule(
                  expandedModule === module.key ? null : module.key,
                )
              }
              role={role}
            />
          ))}
        </div>
      )}

      {/* Healthy Modules (Collapsed by default) */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
          Healthy operations
        </h4>
        {sortedModules
          .filter((m) => m.operationalStatus === "healthy")
          .map((module) => (
            <ModuleRiskCard
              key={module.key}
              module={module}
              priority="healthy"
              isExpanded={expandedModule === module.key}
              onToggle={() =>
                setExpandedModule(
                  expandedModule === module.key ? null : module.key,
                )
              }
              role={role}
              compact={true}
            />
          ))}
      </div>
    </div>
  );
}

/**
 * Business Impact Summary
 * Shows owner: "If you don't act on X, you'll lose Y% revenue and Z% margin"
 */
function BusinessImpactBar({
  projectedRevenueChange,
  projectedMarginChange,
  criticalPathItems,
}: {
  projectedRevenueChange: number;
  projectedMarginChange: number;
  criticalPathItems: string[];
}) {
  const revenueImpact = Math.abs(projectedRevenueChange * 100);
  const marginImpact = Math.abs(projectedMarginChange * 100);
  const isNegative = projectedRevenueChange < 0;

  if (revenueImpact < 1) {
    // No significant impact
    return null;
  }

  return (
    <Card
      className={`border-l-4 p-4 ${
        isNegative
          ? "border-l-red-500 bg-red-50 dark:bg-red-950/20"
          : "border-l-green-500 bg-green-50 dark:bg-green-950/20"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {isNegative ? (
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          )}
          <p className="font-semibold">
            {isNegative ? "⚠ Business impact: " : "✓ Opportunity: "}
            {revenueImpact.toFixed(1)}% revenue at risk
            {marginImpact > 0 ? ` (${marginImpact.toFixed(1)}pp margin)` : ""}
          </p>
        </div>

        {criticalPathItems.length > 0 && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Critical path:</strong> {criticalPathItems.join(" → ")}
          </p>
        )}

        <p className="text-xs text-gray-600 dark:text-gray-400">
          Address the issues below to recover this impact.
        </p>
      </div>
    </Card>
  );
}

/**
 * Module Risk Card
 * Shows: Module status, revenue contribution, key risks, drill-down
 * FIXED: No nested buttons - using div with onClick instead of button
 */
interface ModuleRiskCardProps {
  module: ModuleRiskAssessment;
  priority: "critical" | "warning" | "healthy";
  isExpanded: boolean;
  onToggle: () => void;
  role: string;
  compact?: boolean;
}

function ModuleRiskCard({
  module,
  priority,
  isExpanded,
  onToggle,
  role,
  compact = false,
}: ModuleRiskCardProps) {
  const moduleMeta = {
    poultry: { icon: "🐔", label: "Poultry" },
    dairy: { icon: "🐄", label: "Dairy" },
    crops: { icon: "🌾", label: "Crops" },
    inventory: { icon: "📦", label: "Inventory" },
  }[module.key];

  const bgColor = {
    critical: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    warning:
      "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    healthy:
      "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
  }[priority];

  const textColor = {
    critical: "text-red-700 dark:text-red-400",
    warning: "text-amber-700 dark:text-amber-400",
    healthy: "text-green-700 dark:text-green-400",
  }[priority];

  const revenueVariancePercent = (module.revenueVariance * 100).toFixed(1);
  const isRevenueDown = module.revenueVariance < 0;

  return (
    <Card className={`border transition-all ${bgColor}`}>
      {/* Clickable header div - NOT a button */}
      <div
        onClick={onToggle}
        className="w-full p-4 text-left cursor-pointer hover:opacity-80 transition-opacity"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            {/* Left: Icon + Title + Status */}
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl mt-1">{moduleMeta?.icon}</span>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-base">
                    {moduleMeta?.label}
                  </h4>
                  <Badge
                    variant={
                      priority === "critical"
                        ? "destructive"
                        : priority === "warning"
                          ? "secondary"
                          : "outline"
                    }
                    className="capitalize text-xs"
                  >
                    {priority}
                  </Badge>
                  {module.activeAlerts > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-100 dark:bg-red-900/30"
                    >
                      {module.activeAlerts} alert
                      {module.activeAlerts > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {/* Revenue contribution + variance */}
                <div className="flex items-baseline gap-2 text-sm flex-wrap">
                  <span className={textColor}>
                    {(module.revenueContribution * 100).toFixed(0)}% of revenue
                  </span>
                  <span
                    className={
                      isRevenueDown
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }
                  >
                    ({isRevenueDown ? "−" : "+"}
                    {revenueVariancePercent}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Chevron Icon - not a button */}
            <div className="mt-1 text-muted-foreground">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </div>

          {/* Risk Factor Row (Summary) */}
          {module.riskFactors.length > 0 && !compact && (
            <div className="flex gap-2 flex-wrap">
              {module.riskFactors.slice(0, 2).map((factor, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`text-xs ${
                    factor.severity === "high"
                      ? "bg-red-100 dark:bg-red-900/30"
                      : factor.severity === "medium"
                        ? "bg-amber-100 dark:bg-amber-900/30"
                        : "bg-gray-100 dark:bg-gray-800/30"
                  }`}
                >
                  {factor.factor.replace(/_/g, " ")}
                </Badge>
              ))}
              {module.riskFactors.length > 2 && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  +{module.riskFactors.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Details - No buttons inside the clickable area */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t mt-2">
          <ModuleDetailPanel module={module} role={role} />
        </div>
      )}
    </Card>
  );
}

/**
 * Module Detail Panel
 * Shows when user expands a module card
 * Buttons are safe here because they're not inside the clickable header
 */
function ModuleDetailPanel({
  module,
  role,
}: {
  module: ModuleRiskAssessment;
  role: string;
}) {
  const handleNavigate = (path: string) => {
    // Navigation logic here
    console.log(`Navigate to ${path}`);
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Key Metrics */}
      {module.keyMetrics.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            Key Metrics
          </h5>
          <div className="grid grid-cols-2 gap-3">
            {module.keyMetrics.slice(0, 4).map((metric, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {metric.name}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      metric.status === "green"
                        ? "text-green-600 dark:text-green-400"
                        : metric.status === "amber"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {metric.current}
                    {metric.unit}
                  </span>
                </div>
                <Progress
                  value={(metric.current / metric.target) * 100}
                  className={`h-1.5 ${
                    metric.status === "green"
                      ? "bg-green-200 dark:bg-green-800/30"
                      : metric.status === "amber"
                        ? "bg-amber-200 dark:bg-amber-800/30"
                        : "bg-red-200 dark:bg-red-800/30"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors with Actions */}
      {module.riskFactors.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            Risk Factors
          </h5>
          <div className="space-y-2">
            {module.riskFactors.map((factor, i) => (
              <div
                key={i}
                className={`rounded-md border p-3 space-y-1.5 ${
                  factor.severity === "high"
                    ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                    : factor.severity === "medium"
                      ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10"
                      : "border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/10"
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {factor.factor.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {factor.impact}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleNavigate(factor.actionLink || "#")}
                >
                  {factor.action} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      {module.recentIncidents.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
            Recent Activity
          </h5>
          <div className="space-y-1 text-sm">
            {module.recentIncidents.slice(0, 3).map((incident, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 text-xs">
                <span className="text-gray-500 dark:text-gray-500 flex-shrink-0 min-w-12">
                  {incident.time}
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {incident.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Drill-Down Link */}
      <Button
        variant="outline"
        className="w-full h-9 text-sm"
        onClick={() => handleNavigate(`/dashboard/${module.key}`)}
      >
        View full {module.key} dashboard{" "}
        <ArrowRight className="h-3.5 w-3.5 ml-2" />
      </Button>
    </div>
  );
}
