# Farm Status Implementation Roadmap

**Objective**: Build Farm Status dashboard using 85% existing backend intelligence  
**Timeline**: 7-10 days total  
**Effort**: 2 backend engineers + 2 frontend engineers

---

## PHASE 1: BACKEND AGGREGATION (2 Days)

### Goal

Create single `/farms/{id}/status/overview` endpoint that aggregates all farm status signals.

### What Exists (Use As-Is)

- ✅ Financial health scoring
- ✅ Livestock tracking per module
- ✅ Health event aggregation
- ✅ Inventory status calculation
- ✅ Disease risk evaluation
- ✅ Recommendations generation

### What to Build

#### Step 1.1: Create DTO Files (2 hours)

**File**: `server/src/farms/dto/farm-status-overview.dto.ts`

```typescript
export interface FarmStatusOverviewDto {
  farmId: UUID;
  farmName: string;
  generatedAt: string; // ISO8601

  financialHealth: {
    score: number; // 0-100
    status: "healthy" | "at-risk" | "critical";
    riskLevel: "low" | "medium" | "high";
    message: string;
    trend: "improving" | "stable" | "declining";
    thisMonth: {
      revenue: number;
      expenses: number;
      profit: number;
      margin: number;
    };
  };

  livestockStatus: {
    poultry: {
      totalFlocks: number;
      activeFlocks: number;
      totalBirds: number;
      productionRate: number; // %
      avgFCR: number;
      healthRiskScore: number; // 0-100
      nextHarvestDate: string | null;
      alerts: { count: number; critical: number; high: number };
      revenue: number; // This month
      cost: number; // This month
    };
    dairy: {
      totalCows: number;
      lactatingCows: number;
      totalMilkYield: number; // liters/day
      pregnantCows: number;
      nextCalvingDate: string | null;
      healthRiskScore: number;
      activeHealthIssues: number;
      revenue: number;
      cost: number;
    };
    ruminants: {
      totalAnimals: number;
      goats: number;
      sheep: number;
      readyForMarket: number;
      pregnantAnimals: number;
      healthIssues: number;
    };
  };

  operations: {
    inventory: {
      criticalItems: number;
      lowStockItems: number;
      expiredItems: number;
      status: "healthy" | "warning" | "critical";
    };
    healthIssues: {
      active: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
      cost: number;
      animalsUnderWithdrawal: number;
    };
    diseaseAlerts: {
      total: number;
      critical: number;
      high: number;
    };
  };

  recommendations: Array<{
    id: string;
    priority: "critical" | "high" | "medium" | "low";
    title: string;
    source: string;
  }>;

  cashFlow: {
    sevenDayOutlook: number;
    thirtyDayOutlook: number;
    estimatedRunway: number;
    status: "healthy" | "warning" | "critical";
  };
}
```

#### Step 1.2: Create Status Service (4 hours)

**File**: `server/src/farms/services/status.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { UUID } from "typeorm/driver/types/UUIDType";
import { FinanceService } from "../../finance/finance.service";
import { HealthEventService } from "../../health-event/services/health-event.service";
import { InventoryService } from "../../inventory/inventory.service";
import { DiseaseEngineService } from "../../disease-engine/disease-engine.service";
import { PoultryService } from "../../poultry/poultry.service";
import { DairyService } from "../../dairy/dairy.service";
import { SmallRuminantService } from "../../smallruminants/smallruminants.service";
import { RecommendationsService } from "../../recommendations/recommendations.service";
import { FarmsService } from "./farms.service";
import { FarmStatusOverviewDto } from "../dto/farm-status-overview.dto";

@Injectable()
export class StatusService {
  constructor(
    private financeService: FinanceService,
    private healthService: HealthEventService,
    private inventoryService: InventoryService,
    private diseaseEngine: DiseaseEngineService,
    private poultryService: PoultryService,
    private dairyService: DairyService,
    private ruminantService: SmallRuminantService,
    private recommendationsService: RecommendationsService,
    private farmsService: FarmsService,
  ) {}

  async getFarmStatusOverview(
    farmId: UUID,
    currentCash?: number,
  ): Promise<FarmStatusOverviewDto> {
    // Load farm metadata
    const farm = await this.farmsService.findOne(farmId);
    if (!farm) throw new NotFoundException("Farm not found");

    // Fetch all signals in parallel
    const [
      financialHealth,
      healthSummary,
      inventory,
      diseaseAlerts,
      dairyData,
      dairyCows,
      poultryFlocks,
      ruminantData,
      recommendations,
      cashFlow,
    ] = await Promise.all([
      this.financeService.getFinancialHealth(farmId, currentCash),
      this.healthService.getHealthSummary(farmId),
      this.inventoryService.getFarmInventory(farmId),
      this.diseaseEngine.evaluateFarm(farm, farm.ownerId),
      this.dairyService.getFarmSummary(farmId),
      this.dairyService.getFarmCows(farmId),
      this.poultryService.getFarmFlocks(farmId),
      this.ruminantService.getFarmSummary(farmId),
      this.recommendationsService.getForFarm(farmId, {
        take: 5,
        unreadOnly: true,
      }),
      this.financeService.getCashFlowSummary(farmId, currentCash),
    ]);

    // Calculate current month for finance queries
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const financialSummary = await this.financeService.getFinancialSummary(
      farmId,
      currentMonth,
    );

    // Process livestock data
    const livestockStatus = {
      poultry: {
        totalFlocks: poultryFlocks.length,
        activeFlocks: poultryFlocks.filter((f) => f.status === "ACTIVE").length,
        totalBirds: poultryFlocks.reduce((sum, f) => sum + f.currentCount, 0),
        productionRate: this.calculatePoultryProductionRate(poultryFlocks),
        avgFCR: this.calculateAvgFCR(poultryFlocks),
        healthRiskScore: Math.max(
          ...poultryFlocks.map((f) => f.healthRiskScore || 0),
        ),
        nextHarvestDate: this.getNextPoultryHarvest(poultryFlocks),
        alerts: { count: 0, critical: 0, high: 0 }, // Populated below
        revenue: financialSummary.revenueByCategory?.LIVE_BIRDS || 0,
        cost: financialSummary.costByCategory?.POULTRY_FEED || 0,
      },
      dairy: {
        totalCows: dairyCows.length,
        lactatingCows: dairyCows.filter((c) => c.isCurrentlyLactating).length,
        totalMilkYield: dairyData.totalMilkYield,
        pregnantCows: dairyCows.filter((c) => c.isPregnant).length,
        nextCalvingDate: dairyData.nextExpectedCalving,
        healthRiskScore: 0, // Calculate from health events for dairy
        activeHealthIssues: healthSummary.byAnimalType?.dairy || 0,
        revenue: financialSummary.revenueByCategory?.MILK || 0,
        cost: financialSummary.costByCategory?.DAIRY_FEED || 0,
      },
      ruminants: {
        totalAnimals: ruminantData.totalAnimals,
        goats: ruminantData.goats,
        sheep: ruminantData.sheep,
        readyForMarket: ruminantData.readyForMarket,
        pregnantAnimals: ruminantData.pregnantAnimals,
        healthIssues: ruminantData.healthIssues,
      },
    };

    // Process inventory data
    const criticalItems = inventory.filter((i) => i.status === "CRITICAL");
    const lowItems = inventory.filter((i) => i.status === "LOW");
    const expiredItems = inventory.filter(
      (i) => i.expiryDate && i.expiryDate < new Date(),
    );

    const operations = {
      inventory: {
        criticalItems: criticalItems.length,
        lowStockItems: lowItems.length,
        expiredItems: expiredItems.length,
        status:
          criticalItems.length > 0
            ? "critical"
            : lowItems.length > 5
              ? "warning"
              : "healthy",
      },
      healthIssues: {
        active: healthSummary.totalActive,
        critical: healthSummary.bySeverity?.critical || 0,
        high: healthSummary.bySeverity?.high || 0,
        medium: healthSummary.bySeverity?.medium || 0,
        low: healthSummary.bySeverity?.low || 0,
        cost: healthSummary.totalCost,
        animalsUnderWithdrawal: 0, // Calculate from withdrawals
      },
      diseaseAlerts: {
        total: diseaseAlerts.length,
        critical: diseaseAlerts.filter((a) => a.severity === "CRITICAL").length,
        high: diseaseAlerts.filter((a) => a.severity === "HIGH").length,
      },
    };

    // Assemble final DTO
    const status: FarmStatusOverviewDto = {
      farmId,
      farmName: farm.name,
      generatedAt: new Date().toISOString(),
      financialHealth: {
        score: financialHealth.score,
        status:
          financialHealth.score > 70
            ? "healthy"
            : financialHealth.score > 40
              ? "at-risk"
              : "critical",
        riskLevel: financialHealth.riskLevel,
        message: this.generateFinancialMessage(financialHealth.score),
        trend: this.compareTrend(financialHealth.trends),
        thisMonth: {
          revenue: financialSummary.totalRevenue,
          expenses: financialSummary.totalCosts,
          profit: financialSummary.netProfit,
          margin:
            (financialSummary.netProfit / financialSummary.totalRevenue) *
              100 || 0,
        },
      },
      livestockStatus,
      operations,
      recommendations: recommendations.map((r) => ({
        id: r.id,
        priority: r.priority,
        title: r.title,
        source: r.source,
      })),
      cashFlow: {
        sevenDayOutlook: cashFlow.sevenDayOutlook,
        thirtyDayOutlook: cashFlow.thirtyDayOutlook,
        estimatedRunway: cashFlow.estimatedRunway,
        status:
          cashFlow.estimatedRunway < 7
            ? "critical"
            : cashFlow.estimatedRunway < 30
              ? "warning"
              : "healthy",
      },
    };

    return status;
  }

  private calculatePoultryProductionRate(flocks: Flock[]): number {
    if (flocks.length === 0) return 0;
    const totalBirds = flocks.reduce((sum, f) => sum + f.currentCount, 0);
    if (totalBirds === 0) return 0;
    // Average production rate across flocks weighted by bird count
    return (
      flocks.reduce(
        (sum, f) => sum + (f.productionRate || 0) * f.currentCount,
        0,
      ) / totalBirds
    );
  }

  private calculateAvgFCR(flocks: Flock[]): number {
    if (flocks.length === 0) return 0;
    return (
      flocks.reduce((sum, f) => sum + (f.avgFCR || 2.0), 0) / flocks.length
    );
  }

  private getNextPoultryHarvest(flocks: Flock[]): string | null {
    const activeFlock = flocks.find(
      (f) => f.status === "ACTIVE" && f.harvestDate,
    );
    return activeFlock?.harvestDate?.toISOString() || null;
  }

  private generateFinancialMessage(score: number): string {
    if (score > 70) return "Farm is financially healthy";
    if (score > 40) return "Farm needs attention to profitability";
    return "Farm is at critical financial risk";
  }

  private compareTrend(trends: any): "improving" | "stable" | "declining" {
    if (trends.profitChange > 5) return "improving";
    if (trends.profitChange < -5) return "declining";
    return "stable";
  }
}
```

#### Step 1.3: Create Controller Endpoint (1 hour)

**File**: `server/src/farms/controllers/status.controller.ts`

```typescript
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { StatusService } from "../services/status.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { FarmAccessGuard } from "../../auth/guards/farm-access.guard";
import { FarmStatusOverviewDto } from "../dto/farm-status-overview.dto";
import { UUID } from "typeorm/driver/types/UUIDType";

@Controller("farms")
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class StatusController {
  constructor(private statusService: StatusService) {}

  @Get(":farmId/status/overview")
  async getFarmStatusOverview(
    @Param("farmId") farmId: UUID,
  ): Promise<FarmStatusOverviewDto> {
    return this.statusService.getFarmStatusOverview(farmId);
  }
}
```

#### Step 1.4: Register in Module (30 minutes)

**Update**: `server/src/farms/farms.module.ts`

```typescript
import { StatusService } from "./services/status.service";
import { StatusController } from "./controllers/status.controller";

@Module({
  imports: [
    /* existing imports */
  ],
  controllers: [
    FarmsController,
    StatusController, // Add
  ],
  providers: [
    FarmsService,
    StatusService, // Add
  ],
  exports: [FarmsService, StatusService],
})
export class FarmsModule {}
```

#### Step 1.5: Testing (2 hours)

**File**: `server/src/farms/services/status.service.spec.ts`

```typescript
describe("StatusService", () => {
  let service: StatusService;

  it("should return complete farm status overview", async () => {
    const farmId = "test-farm-id";
    const overview = await service.getFarmStatusOverview(farmId);

    expect(overview).toHaveProperty("farmId");
    expect(overview).toHaveProperty("financialHealth");
    expect(overview.financialHealth).toHaveProperty("score");
    expect(overview).toHaveProperty("livestockStatus");
    expect(overview).toHaveProperty("operations");
    expect(overview).toHaveProperty("recommendations");
  });

  it("should calculate financial health correctly", async () => {
    const overview = await service.getFarmStatusOverview("test-farm");
    expect(overview.financialHealth.score).toBeBetween(0, 100);
    expect(["low", "medium", "high"]).toContain(
      overview.financialHealth.riskLevel,
    );
  });

  it("should aggregate livestock data", async () => {
    const overview = await service.getFarmStatusOverview("test-farm");
    expect(overview.livestockStatus.poultry.totalFlocks).toBeGreaterThanOrEqual(
      0,
    );
    expect(overview.livestockStatus.dairy.totalCows).toBeGreaterThanOrEqual(0);
  });
});
```

### Deliverables

- [ ] `farm-status-overview.dto.ts` created
- [ ] `status.service.ts` implemented with all aggregation logic
- [ ] `status.controller.ts` created with endpoint
- [ ] Module registration updated
- [ ] Unit tests passing
- [ ] Integration tests passing

---

## PHASE 2: FRONTEND DASHBOARD (2-3 Days)

### Goal

Create responsive Farm Status dashboard displaying all signals.

### Components to Build

#### Step 2.1: Status Overview Page Component (4 hours)

**File**: `client/app/dashboard/components/FarmStatus/FarmStatusOverview.tsx`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { FinancialHealthCard } from './cards/FinancialHealthCard';
import { LivestockCard } from './cards/LivestockCard';
import { HealthStatusCard } from './cards/HealthStatusCard';
import { StockStatusCard } from './cards/StockStatusCard';
import { RecommendationsCard } from './cards/RecommendationsCard';
import { DiseaseAlertCard } from './cards/DiseaseAlertCard';
import { CashFlowCard } from './cards/CashFlowCard';
import { Skeleton } from '@/components/ui/skeleton';

export function FarmStatusOverview() {
  const { farmId } = useParams();

  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ['farm-status', farmId],
    queryFn: async () => {
      const response = await fetch(`/api/farms/${farmId}/status/overview`);
      if (!response.ok) throw new Error('Failed to fetch farm status');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // 5 minute auto-refresh
  });

  if (isLoading) return <StatusSkeleton />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Farm Status</h1>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Refresh
        </button>
      </div>

      {/* Critical Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FinancialHealthCard data={status.financialHealth} />
        <HealthStatusCard data={status.operations.healthIssues} />
        <StockStatusCard data={status.operations.inventory} />
      </div>

      {/* Livestock & Operations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LivestockCard data={status.livestockStatus} />
        <DiseaseAlertCard data={status.operations.diseaseAlerts} />
      </div>

      {/* Supporting Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecommendationsCard recommendations={status.recommendations} />
        <CashFlowCard data={status.cashFlow} />
      </div>
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <p className="text-red-800">Failed to load farm status: {error.message}</p>
    </div>
  );
}
```

#### Step 2.2: Individual Status Cards (8 hours)

**File**: `client/app/dashboard/components/FarmStatus/cards/FinancialHealthCard.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FinancialHealthProps {
  score: number;
  status: 'healthy' | 'at-risk' | 'critical';
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'declining';
  thisMonth: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  };
}

export function FinancialHealthCard({ data }: { data: FinancialHealthProps }) {
  const getScoreColor = (score: number) => {
    if (score > 70) return 'text-green-600';
    if (score > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Financial Health</span>
          {getTrendIcon(data.trend)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Gauge */}
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(data.score)}`}>
            {data.score}
          </div>
          <p className="text-sm text-gray-600">{data.riskLevel} risk</p>
        </div>

        {/* Monthly P&L */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Revenue</p>
            <p className="font-semibold">{data.thisMonth.revenue.toLocaleString()} KES</p>
          </div>
          <div>
            <p className="text-gray-600">Expenses</p>
            <p className="font-semibold">{data.thisMonth.expenses.toLocaleString()} KES</p>
          </div>
          <div>
            <p className="text-gray-600">Profit</p>
            <p className={`font-semibold ${data.thisMonth.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.thisMonth.profit.toLocaleString()} KES
            </p>
          </div>
        </div>

        {/* Margin */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <p className="text-gray-600">Profit Margin</p>
            <p className="font-semibold">{data.thisMonth.margin.toFixed(1)}%</p>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${data.thisMonth.margin > 25 ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${Math.min(data.thisMonth.margin, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Similar files for other cards**:

- `HealthStatusCard.tsx`
- `LivestockCard.tsx`
- `StockStatusCard.tsx`
- `DiseaseAlertCard.tsx`
- `RecommendationsCard.tsx`
- `CashFlowCard.tsx`

#### Step 2.3: Data Fetching Hook (2 hours)

**File**: `client/lib/hooks/useFarmStatus.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { FarmStatusOverviewDto } from "@/types/farm-status";

export function useFarmStatus(farmId: string) {
  return useQuery({
    queryKey: ["farm-status", farmId],
    queryFn: async (): Promise<FarmStatusOverviewDto> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/farms/${farmId}/status/overview`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch farm status");
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}
```

#### Step 2.4: Types & Interfaces (1 hour)

**File**: `client/types/farm-status.ts`

```typescript
export interface FarmStatusOverviewDto {
  farmId: string;
  farmName: string;
  generatedAt: string;
  financialHealth: FinancialHealthDto;
  livestockStatus: LivestockStatusDto;
  operations: OperationsStatusDto;
  recommendations: RecommendationDto[];
  cashFlow: CashFlowDto;
}

export interface FinancialHealthDto {
  score: number;
  status: "healthy" | "at-risk" | "critical";
  riskLevel: "low" | "medium" | "high";
  trend: "improving" | "stable" | "declining";
  thisMonth: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
  };
}

// ... other interfaces
```

### Deliverables

- [ ] `FarmStatusOverview.tsx` main component
- [ ] 6 individual status card components
- [ ] `useFarmStatus` hook
- [ ] Type definitions
- [ ] Responsive layout (mobile/tablet/desktop)
- [ ] Error handling & loading states
- [ ] Manual refresh button
- [ ] Auto-refresh @ 5 min interval

---

## PHASE 3: INTEGRATION & TESTING (1-2 Days)

### Backend Integration Tests

```bash
# Test aggregation endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/farms/{farmId}/status/overview
```

**Verification Checklist**:

- [ ] All service calls complete in < 2 seconds total
- [ ] All fields populated correctly
- [ ] Error handling for missing data
- [ ] Caching working (5 min TTL)
- [ ] Financial calculations accurate

### Frontend Integration Tests

```bash
# Start dev server
npm run dev

# Navigate to dashboard
# http://localhost:3000/dashboard/status
```

**Verification Checklist**:

- [ ] Page loads within 3 seconds
- [ ] All cards render without errors
- [ ] Data displays correctly
- [ ] Refresh button works
- [ ] Auto-refresh @ 5 min works
- [ ] Responsive on mobile/tablet/desktop
- [ ] Error state displays gracefully

### End-to-End Tests

**Scenario 1**: Healthy Farm

- Financial score 70+
- No critical alerts
- Stock healthy
- Recommendations visible

**Scenario 2**: At-Risk Farm

- Financial score 40-70
- Some health issues
- Low stock items
- Urgent recommendations highlighted

**Scenario 3**: Crisis Farm

- Financial score < 40
- Critical health issues
- Critical stock items
- Red warning indicators

---

## PHASE 4: OPTIMIZATION & POLISH (1 Day)

### Performance Optimization

- [ ] Add response caching (5 min)
- [ ] Compress responses (gzip)
- [ ] Lazy load card components
- [ ] Optimize images
- [ ] Code splitting

### UX Improvements

- [ ] Add loading skeleton for each card
- [ ] Smooth transitions between states
- [ ] Hover effects on clickable elements
- [ ] Keyboard shortcuts (R for refresh)
- [ ] Accessibility (ARIA labels)

### Monitoring

- [ ] Add logging for endpoint calls
- [ ] Track API response times
- [ ] Monitor frontend errors
- [ ] Set up alerts for farm status changes

---

## DEPLOYMENT CHECKLIST

### Backend

- [ ] Code merged to main branch
- [ ] All tests passing
- [ ] Docker image built
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Deployed to staging
- [ ] Smoke tests passing
- [ ] Deployed to production

### Frontend

- [ ] Code merged to main branch
- [ ] All tests passing
- [ ] Built for production
- [ ] Deployed to CDN
- [ ] Cache headers configured
- [ ] Verified in production

### Monitoring

- [ ] Dashboard metrics captured
- [ ] Error tracking active
- [ ] Performance monitoring active
- [ ] User feedback form visible

---

## SUCCESS CRITERIA

### Backend

- ✅ Single aggregation endpoint returns all farm status signals
- ✅ Response time < 2 seconds (p95)
- ✅ 99.9% uptime
- ✅ All service integrations working
- ✅ Financial calculations accurate

### Frontend

- ✅ Dashboard loads in < 3 seconds
- ✅ All 6 status cards render correctly
- ✅ Data refreshes automatically @ 5 min
- ✅ Mobile responsive
- ✅ Error states display gracefully

### User Impact

- ✅ Farmer can see farm status at a glance
- ✅ All critical alerts visible
- ✅ Action items recommended
- ✅ No need to navigate multiple modules for status

---

## RISK MITIGATION

| Risk                          | Probability | Impact | Mitigation                          |
| ----------------------------- | ----------- | ------ | ----------------------------------- |
| Aggregation endpoint too slow | Medium      | High   | Cache responses, optimize queries   |
| Missing data from services    | Low         | Medium | Add fallback values, error handling |
| Frontend performance issues   | Medium      | Medium | Lazy load, code split, optimize     |
| Data inconsistency            | Low         | High   | Add validation, monitoring          |
| User confusion with new UI    | Medium      | Low    | Clear labeling, tooltips, help docs |

---

## TIMELINE

| Phase | Tasks                 | Days | Start | End    |
| ----- | --------------------- | ---- | ----- | ------ |
| **1** | Backend aggregation   | 2    | Day 1 | Day 2  |
| **2** | Frontend components   | 2-3  | Day 3 | Day 5  |
| **3** | Integration & testing | 1-2  | Day 6 | Day 7  |
| **4** | Optimization & polish | 1    | Day 8 | Day 8  |
| **5** | Deployment            | 1-2  | Day 9 | Day 10 |

**Total**: 7-10 days

---

## NEXT STEPS

1. ✅ **Approve Design** (this audit)
2. **Create Tickets** in project management tool
3. **Assign Team Members** (2 backend, 2 frontend)
4. **Set Up Branch** for feature development
5. **Begin Phase 1** backend aggregation
6. **Weekly Standups** to track progress

---

**Prepared by**: Backend Architecture Team  
**Date**: June 2, 2026  
**For**: Product stakeholders
