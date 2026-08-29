// src/components/market/market-table.tsx
"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Activity,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MarketItem {
  id: string;
  product: string;
  category: "eggs" | "broilers" | "layers" | "feed";
  price: number;
  unit: string;
  trend: "up" | "down" | "stable";
  change: number;
  market: string;
  location: string;
  updated: string;
  demand: "high" | "medium" | "low";
  verified: boolean;
  source?: string;
}

interface MarketTableProps {
  initialData: MarketItem[];
  categories?: { id: string; label: string; icon: any }[];
}

export default function MarketTable({
  initialData,
  categories = [],
}: MarketTableProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get unique locations
  const locations = [
    "All Locations",
    ...Array.from(new Set(initialData.map((item) => item.market))),
  ];

  // Filter data
  const filteredData = initialData.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesLocation =
      selectedLocation === "All Locations" || item.market === selectedLocation;
    const matchesSearch =
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.market.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLocation && matchesSearch;
  });

  // Simulate loading on filter change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedLocation, searchQuery]);

  // Category tabs - dynamic from data if not provided
  const categoryOptions =
    categories.length > 0
      ? categories
      : [
          { id: "all", label: "All Products", icon: Activity },
          {
            id: "eggs",
            label: "Eggs",
            icon: ({ className }: any) => <span className={className}>🥚</span>,
          },
          {
            id: "broilers",
            label: "Broilers",
            icon: ({ className }: any) => <span className={className}>🐔</span>,
          },
          {
            id: "layers",
            label: "Layers",
            icon: ({ className }: any) => <span className={className}>🐓</span>,
          },
          {
            id: "feed",
            label: "Feed",
            icon: ({ className }: any) => <span className={className}>🌾</span>,
          },
        ];

  const renderCategoryIcon = (Icon: any) => {
    const isComponent =
      typeof Icon === "function" ||
      (typeof Icon === "object" && Icon !== null && "render" in Icon);

    if (isComponent) {
      return <Icon className="h-4 w-4" />;
    }

    return Icon;
  };

  return (
    <div>
      {/* ========================================
          FILTERS
        ======================================== */}

      <div className="flex flex-col gap-4 mb-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {renderCategoryIcon(Icon)}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Location */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products or markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-border/50 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* ========================================
          TABLE
        ======================================== */}

      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/30 border-b border-border/50 text-xs font-medium text-muted-foreground">
          <div className="col-span-3">Product</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-2">Trend</div>
          <div className="col-span-2">Market</div>
          <div className="col-span-2">Demand</div>
          <div className="col-span-1 text-right">Updated</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/50">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-3 px-4 py-4 animate-pulse"
              >
                <div className="col-span-3 h-4 bg-muted rounded" />
                <div className="col-span-2 h-4 bg-muted rounded" />
                <div className="col-span-2 h-4 bg-muted rounded" />
                <div className="col-span-2 h-4 bg-muted rounded" />
                <div className="col-span-2 h-4 bg-muted rounded" />
                <div className="col-span-1 h-4 bg-muted rounded" />
              </div>
            ))
          ) : filteredData.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No market data found
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-3 px-4 py-4 hover:bg-muted/30 transition-colors items-center"
              >
                {/* Product */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {item.product}
                    </span>
                    {item.verified && (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.unit}
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-2">
                  <span className="text-sm font-semibold text-foreground">
                    KES {item.price.toLocaleString()}
                  </span>
                </div>

                {/* Trend */}
                <div className="col-span-2">
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      item.trend === "up"
                        ? "text-emerald-400"
                        : item.trend === "down"
                          ? "text-red-400"
                          : "text-muted-foreground",
                    )}
                  >
                    {item.trend === "up" && <TrendingUp className="h-3 w-3" />}
                    {item.trend === "down" && (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {item.trend === "stable" && "-"}
                    {item.change !== 0 &&
                      `${item.change > 0 ? "+" : ""}${item.change}%`}
                  </div>
                </div>

                {/* Market */}
                <div className="col-span-2">
                  <div className="text-sm text-foreground">{item.market}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.location}
                  </div>
                </div>

                {/* Demand */}
                <div className="col-span-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      item.demand === "high"
                        ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/5"
                        : item.demand === "medium"
                          ? "border-amber-400/30 text-amber-400 bg-amber-400/5"
                          : "border-red-400/30 text-red-400 bg-red-400/5",
                    )}
                  >
                    {item.demand.charAt(0).toUpperCase() + item.demand.slice(1)}{" "}
                    Demand
                  </Badge>
                </div>

                {/* Updated */}
                <div className="col-span-1 text-right">
                  <span className="text-xs text-muted-foreground">
                    {item.updated}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
