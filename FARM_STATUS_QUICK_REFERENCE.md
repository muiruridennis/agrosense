# AgroSense Farm Status: Quick Reference Guide

## API ENDPOINTS FOR FARM STATUS

### CRITICAL (Must Use)

```bash
# Financial Health Assessment
GET /finance/farms/{farmId}/health
# Response: {score: 0-100, riskLevel: "high"|"medium"|"low", trends: {...}, actionItems: [...]}

# Monthly Financial Performance
GET /finance/farms/{farmId}/summary/{period}
# Example: /finance/farms/{farmId}/summary/2026-06
# Response: {totalCosts, totalRevenue, netProfit, profitMargin, costsByCategory, revenueByCategory}

# Livestock Inventory - Dairy
GET /dairy/farms/{farmId}/summary
# Response: {totalCows, lactatingCows, avgMilkYield, pregnantCows, activeHealthIssues, ...}

# Livestock Inventory - Dairy Detail
GET /dairy/farms/{farmId}/cows
# Response: Array of Cow entities with lactation/breeding status

# Livestock Inventory - Poultry
GET /poultry/houses/{houseId}/flocks
# Response: Array of Flock entities with KPIs

# Livestock Inventory - Small Ruminants
GET /farms/{farmId}/ruminants
# Response: Array of Ruminant entities (goats/sheep)

# Livestock Summary - Small Ruminants
GET /farms/{farmId}/ruminants/summary
# Response: {totalAnimals, goats, sheep, readyForMarket, pregnant, healthIssues}

# Health Status Summary
GET /farms/{farmId}/health-summary
# Response: {totalActive, bySeverity: {critical, high, medium, low}, byCondition: {...}, totalCost, totalLoss}

# Active Health Events
GET /farms/{farmId}/active-health-events
# Response: Array of HealthEvent entities (unresolved)

# Disease Risk Assessment
GET /farms/{farmId}/alerts
# Response: Array of DiseaseAlert {severity, type, message, affectedAnimals, recommendation}

# Stock & Resource Status
GET /farms/{farmId}/inventory/current
# Response: Array of CurrentStockDto {quantity, daysSupply, status: "CRITICAL"|"LOW"|"ADEQUATE"|"EXCESS", estimatedRunoutDate}

# Stock Alerts
GET /farms/{farmId}/inventory/alerts
# Response: Array of StockAlert {type: "low_stock"|"expired"|"quality_issue", severity, message}

# Recommendations & Action Items
GET /farms/{farmId}/recommendations
# Response: Array of Recommendation {type, priority, title, description, source, expiresAt}

# Unread Recommendations Count
GET /farms/{farmId}/recommendations/unread-count
# Response: {count: number}
```

### HIGH PRIORITY (Recommended)

```bash
# Profit & Loss Detail
GET /finance/farms/{farmId}/pl/{period}
# Response: {revenue, expenses, profit, margins, costsByType%, revenueByType%, breakEvenAnalysis}

# Period Comparison
GET /finance/farms/{farmId}/compare?current=2026-06&previous=2026-05
# Response: {costChange%, revenueChange%, profitChange%, trend}

# Cash Flow Forecast
GET /finance/farms/{farmId}/cashflow/summary
# Response: {sevenDayOutlook, thirtyDayOutlook, ninetyDayForecast, estimatedRunway}

# Dairy Breeding Calendar
GET /dairy/farms/{farmId}/breeding-calendar
# Response: Array of {eventDate, eventType: "mating"|"pregnancy_check"|"birth", cow: {...}, expectedCalving}

# Individual Flock Performance
GET /poultry/flocks/{flockId}/summary
# Response: {mortality%, productionRate%, avgFCR, healthRiskScore, nextHarvestDate, profitMetrics}

# Dairy Cow Details
GET /dairy/cows/{cowId}/summary
# Response: {lactationStatus, breedingStatus, healthAlerts, productionMetrics, isPregnant, nextCalvingDate}

# Seasonal Performance Summary
GET /farms/{farmId}/records/season-summary
# Response: {aggregatedMetrics, trendAnalysis, comparison}
```

### SUPPORTING (Context)

```bash
# Basic Farm Metadata
GET /farms/{farmId}
# Response: Farm entity {id, name, areaHectares, location, timezone, ...}

# Individual Animal Under Withdrawal
GET /farms/{farmId}/health/animals-under-withdrawal
# Response: Array of {animalId, productType: "milk"|"eggs"|"meat", withdrawalEndDate}

# Animals Locked from Breeding
GET /farms/{farmId}/health/animals-locked-from-breeding
# Response: Array of {animalId, condition, breedingLockUntil}
```

---

## SERVICE METHODS FOR FARM STATUS

### FinanceService

| Method                      | Call                                                                   | Returns               | Use                         |
| --------------------------- | ---------------------------------------------------------------------- | --------------------- | --------------------------- |
| `getFinancialHealth()`      | `financeService.getFinancialHealth(farmId, currentCash)`               | `FinancialHealthDto`  | **Overall viability score** |
| `getFinancialSummary()`     | `financeService.getFinancialSummary(farmId, "2026-06")`                | `FinancialSummaryDto` | Monthly P&L                 |
| `getProfitAndLoss()`        | `financeService.getProfitAndLoss(farmId, "2026-06")`                   | `ProfitAndLossDto`    | Detailed breakdown          |
| `getCashFlowSummary()`      | `financeService.getCashFlowSummary(farmId, currentCash)`               | `CashFlowSummaryDto`  | Liquidity forecast          |
| `compareFinancialPeriods()` | `financeService.compareFinancialPeriods(farmId, "2026-06", "2026-05")` | `ComparisonDto`       | Trend analysis              |

### HealthEventService

| Method                           | Call                                                 | Returns                              | Use                        |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------ | -------------------------- |
| `getHealthSummary()`             | `healthService.getHealthSummary(farmId)`             | Health aggregation object            | **Active issues overview** |
| `getFarmActiveHealthEvents()`    | `healthService.getFarmActiveHealthEvents(farmId)`    | `HealthEvent[]`                      | Unresolved issues          |
| `getAnimalsUnderWithdrawal()`    | `healthService.getAnimalsUnderWithdrawal(farmId)`    | `{animalId, productType, endDate}[]` | Production locked animals  |
| `getAnimalsLockedFromBreeding()` | `healthService.getAnimalsLockedFromBreeding(farmId)` | `{animalId, condition, lockUntil}[]` | Breeding-locked animals    |

### InventoryService

| Method                      | Call                                                       | Returns             | Use                        |
| --------------------------- | ---------------------------------------------------------- | ------------------- | -------------------------- |
| `getFarmInventory()`        | `inventoryService.getFarmInventory(farmId, category?)`     | `CurrentStockDto[]` | **Stock status all items** |
| `recalculateStockBalance()` | `inventoryService.recalculateStockBalance(farmId, itemId)` | `CurrentStock`      | Per-item availability      |
| `evaluateStockAlerts()`     | `inventoryService.evaluateStockAlerts(farmId, itemId)`     | void                | Generates alerts           |

### DiseaseEngineService

| Method                     | Call                                       | Returns          | Use                         |
| -------------------------- | ------------------------------------------ | ---------------- | --------------------------- |
| `evaluateFarm()`           | `diseaseEngine.evaluateFarm(farm, userId)` | `DiseaseAlert[]` | **Disease risk profile**    |
| `evaluateRuleForPoultry()` | Internal call                              | Boolean          | Poultry-specific evaluation |
| `evaluateRuleForDairy()`   | Internal call                              | Boolean          | Dairy-specific evaluation   |

### PoultryService

| Method                       | Call                                   | Returns      | Use                      |
| ---------------------------- | -------------------------------------- | ------------ | ------------------------ |
| `getFarmFlocks()`            | `poultryService.getFarmFlocks(farmId)` | `Flock[]`    | Flock inventory + KPIs   |
| `calculateRecordKPIs()`      | Internal call                          | KPI object   | Daily efficiency metrics |
| `calculateHealthRiskScore()` | Internal call                          | 0-100 number | Health risk scoring      |

### DairyService

| Method             | Call                                  | Returns               | Use                           |
| ------------------ | ------------------------------------- | --------------------- | ----------------------------- |
| `getFarmCows()`    | `dairyService.getFarmCows(farmId)`    | `Cow[]`               | Cow inventory + status        |
| `getFarmSummary()` | `dairyService.getFarmSummary(farmId)` | `DairyFarmSummaryDto` | **Farm-level dairy overview** |
| `getCowSummary()`  | `dairyService.getCowSummary(cowId)`   | `CowSummaryDto`       | Individual status             |

### SmallRuminantService

| Method             | Call                                     | Returns                  | Use                     |
| ------------------ | ---------------------------------------- | ------------------------ | ----------------------- |
| `getFarmAnimals()` | `ruminantService.getFarmAnimals(farmId)` | `Ruminant[]`             | Ruminant inventory      |
| `getFarmSummary()` | `ruminantService.getFarmSummary(farmId)` | `RuminantFarmSummaryDto` | **Farm-level overview** |

### RecommendationsService

| Method             | Call                                            | Returns            | Use                |
| ------------------ | ----------------------------------------------- | ------------------ | ------------------ |
| `getForFarm()`     | `recommendationsService.getForFarm(farmId)`     | `Recommendation[]` | Action items       |
| `getUnreadCount()` | `recommendationsService.getUnreadCount(farmId)` | `{count: number}`  | Quick status badge |

---

## CALCULATION FORMULAS

### Financial Health Score

```
Components:
- Profitability = (margin / 30) × 100        [normalized to 30% target]
- Liquidity = (cash / monthlyPayable) × 100  [cash available vs due]
- Solvency = 80                              [constant placeholder]
- Efficiency = 100 - (costs/(costs+profit))×100 [cost control measure]

Overall Score = (Profitability + Liquidity + Solvency + Efficiency) / 4

Risk Level:
- HIGH: score < 40
- MEDIUM: 40 ≤ score ≤ 70
- LOW: score > 70
```

### Poultry Health Risk Score

```
Base Scores (out of 100):
- Sick birds: (sickBirds / liveBirds) × 100 × 0.4        [max 40 points]
- Mortality: (deadBirds / batchSize) × 100 × 0.3         [max 30 points]
- Temperature anomaly: |temp - 24°C| / 24 × 100 × 0.2   [max 20 points]
- Overcrowding: |capacity - birds| / capacity × 100 × 0.1 [max 10 points]

Health Risk Score = Sum of all components (0-100)
```

### Feed Conversion Ratio (FCR)

```
FCR = Total Feed Consumed (kg) / Gross Weight Gained (kg)

Lower is better:
- Standard: 1.8-2.2 (industry average)
- Good: < 1.8
- Excellent: < 1.7
- Poor: > 2.5

Cost Impact: Each kg feed = 35 KES
Cost per unit output = (feed consumed × 35) / eggs OR meat weight
```

### Stock Days Supply

```
Calculation:
1. Average Daily Consumption = Total consumed last 7 days / 7
2. Days Supply = Current Stock Quantity / Average Daily Consumption
3. Estimated Runout Date = Today + Days Supply

Status Classifications:
- CRITICAL: Days Supply < 1 OR Quantity = 0
- LOW: Days Supply < (Minimum Stock Level / 15)
- ADEQUATE: Days Supply ≥ Minimum AND < Optimal × 1.5
- EXCESS: Days Supply > Optimal × 1.5
```

### Dairy Lactation Metrics

```
Lactation Cycle:
- Start Date = Calving Date
- Expected End Date = Start + 305 days (standard lactation)
- Peak Production = Days 30-60 post-calving
- Persistency = Milk in month 6 / Milk in month 2

Breeding Timeline:
- Service/Insemination Date = First breeding attempt
- Expected Calving Date = Service Date + 280 days (gestation)
- Conception Rate = (Pregnancies Confirmed / Services) × 100
```

---

## SIGNAL RANKING BY BUSINESS CRITICALITY

### 🔴 CRITICAL (Cannot operate without)

| Rank | Signal                   | Source                                              | Frequency  | Action If Red                      |
| ---- | ------------------------ | --------------------------------------------------- | ---------- | ---------------------------------- |
| 1    | **Financial Viability**  | `/finance/farms/{}/health`                          | Monthly    | Raise capital, cut costs, or exit  |
| 2    | **Active Livestock**     | `/dairy/farms/{}/cows`, `/poultry/houses/{}/flocks` | Real-time  | No income possible                 |
| 3    | **Active Health Issues** | `/farms/{}/health-summary`                          | Real-time  | Intervene immediately              |
| 4    | **Critical Stock**       | `/farms/{}/inventory/current` filter CRITICAL       | Real-time  | Stop operations or order emergency |
| 5    | **Disease Risk**         | `/farms/{}/alerts`                                  | Daily @6AM | Implement prevention               |

### 🟠 HIGH (Core Operations)

| Rank | Signal              | Source                                         | Frequency | Action If Alert                |
| ---- | ------------------- | ---------------------------------------------- | --------- | ------------------------------ |
| 6    | **Production KPIs** | Daily records (poultry/dairy)                  | Per entry | Investigate efficiency drop    |
| 7    | **Breeding Status** | Breeding records + breeding calendar           | Real-time | Plan breeding/resources        |
| 8    | **Monthly P&L**     | `/finance/farms/{}/summary/{}`                 | Monthly   | Adjust pricing or reduce costs |
| 9    | **Stock Runway**    | `/farms/{}/inventory/current` daysSupply field | Daily     | Plan procurement               |
| 10   | **Active Alerts**   | Multiple sources                               | Real-time | Route to notifications         |

### 🟡 MEDIUM (Supporting)

| Rank | Signal                 | Source                               | Frequency   | Action If Alert          |
| ---- | ---------------------- | ------------------------------------ | ----------- | ------------------------ |
| 11   | **Growth Trends**      | SmallRuminant growth records         | Periodic    | Adjust nutrition         |
| 12   | **Withdrawal Periods** | Health events with production locks  | Event-based | Adjust revenue forecasts |
| 13   | **Treatment Costs**    | Finance aggregation                  | Real-time   | Cost control             |
| 14   | **Recommendations**    | `/farms/{}/recommendations`          | Daily       | Implement suggestions    |
| 15   | **Cash Flow**          | `/finance/farms/{}/cashflow/summary` | Monthly     | Plan borrowing           |

---

## EXAMPLE FARM STATUS SCENARIOS

### Scenario 1: Farm in Crisis

```
Financial Health: Score 25 (RED)
├─ Profitability: 10 (severe losses)
├─ Liquidity: 0 (no cash)
├─ Efficiency: 15 (overspending)

Livestock: 200 birds + 3 cows
├─ Bird production: 80% (normal)
└─ Cow milk: 15L/day (low)

Health: 8 active issues
├─ Critical: 2 (outbreak risk)
├─ High: 3 (productivity affecting)
└─ Cost: 50,000 KES this month

Stock: 3 critical items
├─ Feed: 0 days supply (ORDER NOW)
├─ Medicine: 0.5 days supply
└─ Impact: Cannot feed animals today

RECOMMENDATION: IMMEDIATE ACTION REQUIRED
- Order feed today (emergency supplier)
- Get treatment for critically ill animals
- Consider emergency capital infusion
- Or sell non-productive animals
```

### Scenario 2: Healthy, Growing Farm

```
Financial Health: Score 78 (GREEN)
├─ Profitability: 85 (strong margins)
├─ Liquidity: 95 (good cash position)
├─ Efficiency: 88 (costs controlled)

Livestock: 500 birds (3 active flocks) + 8 cows (6 lactating)
├─ Poultry production: 95% with FCR 1.9 (excellent)
├─ Dairy production: 45L/day (strong)
├─ 2 cows pregnant (next calving in 90 days)

Health: 1 active issue (low severity)
└─ Cost: 5,000 KES (manageable)

Stock: All adequate
├─ Feed: 28 days supply (healthy)
├─ Medicine: 45 days supply
└─ Status: No procurement needed for 2 weeks

Disease Risk: 1 medium-severity alert
└─ Recommendation: Vaccination schedule (preventive)

RECOMMENDATION: STEADY STATE - FOCUS ON OPTIMIZATION
- Monitor production metrics (on track)
- Plan next breeding cycle (timing good)
- Invest in farm improvement (margin supports it)
- Build cash reserves (strong position)
```

### Scenario 3: Recovery Path

```
Financial Health: Score 52 (YELLOW - improving)
├─ Last month: 38 (was bad)
├─ Trend: +14 points (improving)
├─ Trajectory: Green in 2 months (if sustained)

Livestock: 300 birds + 5 cows (+ 1 recovering from illness)
├─ Bird production: 85% (up from 60% last month)
├─ Cow milk: 28L/day (down due to sick cow)

Health: 3 moderate issues (down from 7 last month)
├─ Main issue: Recovering animal
└─ Treatment cost: 8,000 KES (declining)

Stock: 1 low-stock item (feed)
└─ Status: 8 days supply (adequate for now)

Disease Risk: 2 medium-severity alerts
└─ Seasonal issues (monsoon period)

RECOMMENDATION: STAY THE COURSE - MONITOR RECOVERY
- Project profitability positive in 1 month
- Reduce operational stress (animal recovering)
- Prepare for next breeding cycle (good timing)
- Build buffer inventory (feed reserves up 50%)
```

---

## INTEGRATION CHECKLIST FOR FRONTEND

- [ ] Call `/farms/{id}/status/overview` OR call individual endpoints below
- [ ] Display Financial Health card with FinancialHealthDto
- [ ] Display Livestock card aggregating:
  - `/dairy/farms/{id}/summary`
  - `/poultry/houses/{id}/flocks`
  - `/farms/{id}/ruminants/summary`
- [ ] Display Health Status card with health-summary
- [ ] Display Stock Status card with inventory/current (filter CRITICAL/LOW)
- [ ] Display Disease Alerts card with `/farms/{id}/alerts`
- [ ] Display Recommendations with top 5 from `/farms/{id}/recommendations`
- [ ] Add refresh button to manually refresh each card
- [ ] Implement 5-minute auto-refresh
- [ ] Route CRITICAL alerts to modal/toast notification
- [ ] Link each card to detail view in respective module

---

## NOTES FOR DEVELOPERS

### Performance Optimization

1. **Cache Status Overview** (5 min TTL)
   - Don't recalculate every request
   - Manual refresh button for immediate update

2. **Parallel API Calls**
   - Call all endpoints in parallel (not sequential)
   - Reduces perceived latency from N × 500ms to ~500ms

3. **Filter Early**
   - `/farms/{id}/inventory/current?status=CRITICAL,LOW` (if backend supports)
   - Reduces data payload

### Error Handling

- If `/finance/farms/{id}/health` fails: Show "Unable to calculate financial health"
- If `/farms/{id}/alerts` fails: Show "Disease evaluation pending"
- If `/dairy/farms/{id}/summary` fails: Show flock count only
- Graceful degradation for each component

### Production Behavior

- **6 AM UTC**: Disease engine runs (`daily-advisory` job)
- **After 6 AM**: New alerts appear on dashboard
- **7 AM UTC**: Weather advisories generated
- **Real-time**: Health events, inventory changes, sales recorded

---

## TROUBLESHOOTING

| Symptom                                         | Likely Cause                | Fix                                 |
| ----------------------------------------------- | --------------------------- | ----------------------------------- |
| Financial score very high but farm losing money | Profitability formula bug   | Check current P&L endpoint directly |
| Disease alerts not updating                     | Daily job didn't run        | Check Bull queue status             |
| Stock daysSupply wrong                          | Consumption calculation     | Verify last 7 days transactions     |
| Breeding dates not shown                        | Data not recorded           | Ensure breeding record created      |
| Health cost missing                             | Integration event not fired | Check IntegrationService handlers   |
| Production rate = 0                             | No records entered today    | Check date/farm filter              |

---

**Last Updated**: June 2, 2026  
**Version**: 1.0  
**Maintainer**: Backend Architecture Team
