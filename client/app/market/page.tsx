import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Egg,
  Bird,
  Droplet,
  BarChart3,
  Activity,
  Eye, Bell, Download, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import  MarketTable  from "./components/market-table";

// ───────────────────────────────────────────────────────────────
// SEO METADATA
// ───────────────────────────────────────────────────────────────

export const metadata = {
  title: "Poultry Market Prices Kenya | Live Egg, Broiler & Feed Prices",
  description: "Track live poultry market prices across Kenya. Compare egg prices, broiler prices, layer prices, and feed costs across major markets.",
  keywords: "poultry market prices Kenya, egg prices Kenya, broiler prices Kenya, layer prices Kenya, poultry feed prices",
  openGraph: {
    title: "Poultry Market Prices Kenya | AgroSense",
    description: "Track live poultry market prices across Kenya.",
    url: "https://agrosense.com/market",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Poultry Market Prices Kenya | AgroSense",
    description: "Track live poultry market prices across Kenya.",
  },
};

// ───────────────────────────────────────────────────────────────
// DATA
// ───────────────────────────────────────────────────────────────

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
}

// Sample market data
const marketData: MarketItem[] = [
  {
    id: "1",
    product: "Eggs (tray)",
    category: "eggs",
    price: 430,
    unit: "per tray",
    trend: "up",
    change: 4.2,
    market: "Nairobi",
    location: "Wakulima Market",
    updated: "2 min ago",
    demand: "high",
    verified: true,
  },
  {
    id: "2",
    product: "Eggs (tray)",
    category: "eggs",
    price: 415,
    unit: "per tray",
    trend: "stable",
    change: 0,
    market: "Kisumu",
    location: "Kibuye Market",
    updated: "15 min ago",
    demand: "medium",
    verified: true,
  },
  {
    id: "3",
    product: "Eggs (tray)",
    category: "eggs",
    price: 425,
    unit: "per tray",
    trend: "up",
    change: 1.8,
    market: "Mombasa",
    location: "Kongowea Market",
    updated: "1 hour ago",
    demand: "high",
    verified: true,
  },
  {
    id: "4",
    product: "Broilers",
    category: "broilers",
    price: 395,
    unit: "per kg",
    trend: "down",
    change: -1.2,
    market: "Nairobi",
    location: "Wakulima Market",
    updated: "2 min ago",
    demand: "medium",
    verified: true,
  },
  {
    id: "5",
    product: "Broilers",
    category: "broilers",
    price: 380,
    unit: "per kg",
    trend: "down",
    change: -2.5,
    market: "Kisumu",
    location: "Kibuye Market",
    updated: "30 min ago",
    demand: "low",
    verified: true,
  },
  {
    id: "6",
    product: "Layers (pullet)",
    category: "layers",
    price: 850,
    unit: "per bird",
    trend: "stable",
    change: 0,
    market: "Nairobi",
    location: "Wakulima Market",
    updated: "1 hour ago",
    demand: "medium",
    verified: true,
  },
  {
    id: "7",
    product: "Layer Feed",
    category: "feed",
    price: 68,
    unit: "per kg",
    trend: "up",
    change: 2.3,
    market: "Nairobi",
    location: "Wakulima Market",
    updated: "45 min ago",
    demand: "high",
    verified: true,
  },
  {
    id: "8",
    product: "Layer Feed",
    category: "feed",
    price: 65,
    unit: "per kg",
    trend: "up",
    change: 1.5,
    market: "Nakuru",
    location: "Central Market",
    updated: "2 hours ago",
    demand: "high",
    verified: false,
  },
];

const categories = [
  { id: "all", label: "All Products", icon: Activity },
  { id: "eggs", label: "Eggs", icon: Egg },
  { id: "broilers", label: "Broilers", icon: Bird },
  { id: "layers", label: "Layers", icon: Bird },
  { id: "feed", label: "Feed", icon: Droplet },
];

export default function MarketPage() {
  const avgEggPrice = marketData
    .filter(item => item.category === "eggs")
    .reduce((acc, item) => acc + item.price, 0) / marketData.filter(item => item.category === "eggs").length;

  const avgBroilerPrice = marketData
    .filter(item => item.category === "broilers")
    .reduce((acc, item) => acc + item.price, 0) / marketData.filter(item => item.category === "broilers").length;

  return (
    <div className="py-8 md:py-12 bg-background min-h-screen">
      <div className="container-custom">
        {/* ========================================
            PAGE HEADER
        ======================================== */}

        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Badge className="mb-3 border-amber-400/20 bg-amber-400/10 text-amber-400">
                Market Intelligence
              </Badge>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                Poultry Market Prices
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Track poultry prices, trends, and market insights across Kenya
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Updated weekly
                </span>
                <span className="hidden h-3 w-px bg-border sm:block" />
                <span>Based on {marketData.length} price points</span>
                <span className="hidden h-3 w-px bg-border sm:block" />
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400/70" />
                  Verified prices
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Bell className="h-4 w-4" />
                Set Alerts
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================
            MARKET SUMMARY CARDS
        ======================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Egg className="h-4 w-4" />
              Average Egg Price
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold">KES {avgEggPrice.toFixed(0)}</span>
              <span className="text-xs text-muted-foreground">indicative</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              +2.4% this week
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bird className="h-4 w-4" />
              Average Broiler Price
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold">KES {avgBroilerPrice.toFixed(0)}</span>
              <span className="text-xs text-muted-foreground">indicative</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-red-400">
              <TrendingDown className="h-3 w-3" />
              -1.8% this week
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Markets Covered
            </div>
            <div className="mt-1.5">
              <span className="text-2xl font-bold">5</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Major markets across Kenya
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border/50 bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last Updated
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-sm font-semibold text-amber-400">Indicative</span>
              <span className="text-xs text-muted-foreground">Weekly</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Prices updated every week
            </div>
          </div>
        </div>

        <MarketTable initialData={marketData} />

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Price Trends</h3>
              </div>
              <Badge variant="outline" className="text-xs">This week</Badge>
            </div>
            <div className="space-y-3">
              {[
                { name: "Eggs", price: "KES 430", change: "+4.2%", trend: "up" },
                { name: "Broilers", price: "KES 395", change: "-1.2%", trend: "down" },
                { name: "Layers", price: "KES 850", change: "0%", trend: "stable" },
                { name: "Feed", price: "KES 68", change: "+2.3%", trend: "up" },
              ].map((product) => (
                <div key={product.name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground/80">{product.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{product.price}</span>
                    <span className={cn(
                      "text-xs font-medium",
                      product.trend === "up" ? "text-emerald-400" :
                      product.trend === "down" ? "text-red-400" :
                      "text-muted-foreground"
                    )}>
                      {product.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Market Insights</h3>
              </div>
              <Badge variant="outline" className="text-xs">Today</Badge>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-foreground/80">
                  <span className="font-medium">Egg prices</span> are trending up this week.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <span className="text-foreground/80">
                  <span className="font-medium">Broiler prices</span> are softening.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-foreground/80">
                  <span className="font-medium">Feed costs</span> are rising.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================
            CTA
        ======================================== */}

        <div className="mt-12 text-center bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-2xl border border-border/50 p-8 md:p-12">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Know the Market
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              Make smarter selling decisions
            </h3>
            <p className="text-muted-foreground text-sm mt-2">
              Get access to verified poultry prices, market trends, and insights to help you sell at the right time.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-amber-400 text-[#070B14] hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/25 transition-all duration-300"
              >
                <Link href="/register">
                  Start tracking prices
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/features/market">
                  Learn about market intelligence
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-400" />
                Updated weekly
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Verified prices
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}