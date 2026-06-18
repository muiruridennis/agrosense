"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  ArrowRight,
  Crown,
  Shield,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OperationalIntelligenceProps {
  poultry: any;
  dairy: any;
  crops: any;
  finance: any;
  inventory: any;
}

export function OperationalIntelligence({ 
  poultry, 
  dairy, 
  crops, 
  finance, 
  inventory 
}: OperationalIntelligenceProps) {
  
  // Calculate insights based on data
  const insights = {
    topPerformer: {
      name: "Poultry",
      metric: "97% margin",
      insight: "Your most profitable enterprise. Consider expanding capacity.",
      action: "View Poultry Analytics",
      icon: Crown,
      color: "emerald",
    },
    biggestRisk: {
      name: "Feed Costs",
      metric: "↑15% this month",
      insight: "Feed costs are rising faster than revenue. Bulk purchasing could save 10-15%.",
      action: "Review Suppliers",
      icon: TrendingDown,
      color: "rose",
    },
    opportunity: {
      name: "Dairy Margin",
      metric: "78% vs 97%",
      insight: "Dairy margin is 19% below poultry. Optimize feeding schedule to improve.",
      action: "View Recommendations",
      icon: Lightbulb,
      color: "amber",
    },
  };

  const hasInventoryAlert = inventory?.lowStock > 0;
  const hasHealthAlert = poultry?.alerts > 0 || dairy?.alerts > 0;

  return (
    <div className="space-y-4">
      {/* Main Insight Banner */}
      <Card className="overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-primary">Operational Intelligence</h3>
                <Badge variant="outline" className="text-[10px]">AI-Powered</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your poultry enterprise is outperforming all others with a <strong className="text-primary">97% profit margin</strong>. 
                Feed costs have increased 15% this month - consider bulk purchasing to protect margins.
                {hasInventoryAlert && ` ${inventory.lowStock} inventory items need reordering.`}
              </p>
              <button className="mt-2 text-xs text-primary hover:underline flex items-center gap-1">
                View detailed analysis
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Three Insight Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Top Performer Card */}
        <InsightCard
          {...insights.topPerformer}
          badge="Top Performer"
          badgeColor="emerald"
        />

        {/* Biggest Risk Card */}
        <InsightCard
          {...insights.biggestRisk}
          badge="Watch Out"
          badgeColor="rose"
        />

        {/* Opportunity Card */}
        <InsightCard
          {...insights.opportunity}
          badge="Opportunity"
          badgeColor="amber"
        />
      </div>

      {/* Health Alerts Row */}
      {(hasHealthAlert || hasInventoryAlert) && (
        <div className="flex flex-wrap gap-3">
          {hasHealthAlert && (
            <div className="flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span className="text-xs font-medium">Health alerts: {poultry?.alerts + dairy?.alerts}</span>
            </div>
          )}
          {hasInventoryAlert && (
            <div className="flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-medium">Low stock: {inventory.lowStock} items</span>
            </div>
          )}
          {finance?.totalCosts > finance?.totalRevenue * 0.7 && (
            <div className="flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-medium">Costs are high relative to revenue</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface InsightCardProps {
  name: string;
  metric: string;
  insight: string;
  action: string;
  icon: any;
  color: string;
  badge: string;
  badgeColor: string;
}

function InsightCard({ name, metric, insight, action, icon: Icon, color, badge, badgeColor }: InsightCardProps) {
  const colorClasses = {
    emerald: "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20",
    rose: "border-rose-200 bg-rose-50/30 dark:bg-rose-950/20",
    amber: "border-amber-200 bg-amber-50/30 dark:bg-amber-950/20",
    blue: "border-blue-200 bg-blue-50/30 dark:bg-blue-950/20",
  };

  const badgeClasses = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/50",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/50",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/50",
  };

  const iconColors = {
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
  };

  return (
    <Card className={cn("overflow-hidden border-l-4", colorClasses[color as keyof typeof colorClasses])}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", iconColors[color as keyof typeof iconColors])} />
            <span className="text-sm font-medium">{name}</span>
          </div>
          <Badge className={cn("text-[10px]", badgeClasses[badgeColor as keyof typeof badgeClasses])}>
            {badge}
          </Badge>
        </div>
        
        <p className="text-2xl font-bold mb-1">{metric}</p>
        <p className="text-xs text-muted-foreground mb-3">{insight}</p>
        
        <button className="text-xs font-medium hover:underline flex items-center gap-1">
          {action}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}