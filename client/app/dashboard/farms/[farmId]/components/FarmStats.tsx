"use client";

import { DollarSign, TrendingUp, Users, Sprout, Droplets, Package } from "lucide-react";
// import { KpiCard } from "/components/cards/KpiCard";
import type { DashboardIntegratedData } from "@/lib/hooks/useIntegratedDashboard";
import type { Farm } from "../../../types";
import { KpiCard } from "./KpiCard";

interface FarmStatsProps {
  dashboard: DashboardIntegratedData;
  farm: Farm;
}

export function FarmStats({ dashboard, farm }: FarmStatsProps) {
  console.log("Dashboard data in FarmStats:", farm);
  const stats = [
    {
      title: "Monthly Revenue",
      value: `KES ${(dashboard.totalRevenue || 0).toLocaleString()}`,
      subtitle: "Current month",
      icon: DollarSign,
      trend: { value: 12, isPositive: true },
      color: "teal" as const,
    },
    {
      title: "Profit Margin",
      value: `${(dashboard.avgProfitMargin || 0).toFixed(1)}%`,
      subtitle: "Gross margin",
      icon: TrendingUp,
      trend: { value: 5, isPositive: (dashboard.avgProfitMargin || 0) > 0 },
      color: "emerald" as const,
    },
    {
      title: "Active Animals",
      value: `${(dashboard.totalBirds || 0) + (dashboard.dairy?.totalAnimals || 0)}`,
      subtitle: `${dashboard.totalBirds || 0} birds · ${dashboard.dairy?.totalAnimals || 0} cattle`,
      icon: Users,
      color: "blue" as const,
    },
    {
      title: "Farm Members",
      value: `${farm.members?.length || 0}`,
      subtitle: "Total members",
      icon: Users,
      color: "green" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <KpiCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}