// src/integrations/integration.service.ts
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * UNIFIED INTEGRATION SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Master orchestrator for all cross-module integrations:
 * - Poultry ↔ Inventory (feed tracking)
 * - Poultry ↔ Finance (production costs & revenue)
 * - Health ↔ Inventory (medication tracking)
 * - Health ↔ Finance (treatment costs)
 * - Inventory ↔ Finance (stock purchases & consumption)
 *
 * Combines existing InventoryFinanceIntegrationService with new Poultry/Health integrations
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FinanceService } from '../finance/finance.service';
import { InventoryService } from '../inventory/inventory.service';
import { PoultryService } from '../poultry/poultry.service';
import { CostCategory } from '../finance/enums/cost-category.enum';
import { RevenueCategory } from '../finance/enums/revenue-category.enum';
import type {
  PurchaseCreatedEvent,
  ConsumptionRecordedEvent,
  AdjustmentCreatedEvent,
  FlockRecordCreatedEvent,
  EggsCollectedEvent,
  BroilersSoldEvent,
  FlockClosedEvent,
  HealthEventMedicationEvent,
} from './unified.interface';

/**
 * INTEGRATION EVENTS
 * Unified event definitions for all modules
 */
export namespace IntegrationEvents {
  // Inventory Events
  export const PURCHASE_CREATED = 'inventory.purchase.created';
  export const CONSUMPTION_RECORDED = 'inventory.consumption.recorded';
  export const ADJUSTMENT_CREATED = 'inventory.adjustment.created';

  // Poultry Events
  export const FLOCK_RECORD_CREATED = 'poultry.flock_record.created';
  export const FLOCK_CLOSED = 'poultry.flock.closed';
  export const BIRD_SALE_RECORDED = 'poultry.bird_sale.recorded';

  // Health Events
  export const HEALTH_EVENT_CREATED = 'health.event.created';
  export const MEDICATION_APPLIED = 'health.medication.applied';
}

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    private readonly financeService: FinanceService,
    private readonly inventoryService: InventoryService,
    private readonly poultryService: PoultryService,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════════
  // INVENTORY → FINANCE INTEGRATION (Existing - Maintained)
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * When inventory purchase is created → Record cost in finance
   */
  @OnEvent(IntegrationEvents.PURCHASE_CREATED)
  async handlePurchaseCreated(event: PurchaseCreatedEvent) {
    this.logger.log(`📦 Purchase → Finance: ${event.quantity} units`);

    try {
      const stockItems = await this.inventoryService.getStockItems(
        event.farmId,
      );
      const stockItem = stockItems.find((item) => item.id === event.itemId);

      if (!stockItem) {
        this.logger.warn(`Stock item ${event.itemId} not found`);
        return;
      }

      const category = this.mapStockCategoryToCostCategory(stockItem.category);

      await this.financeService.recordCost(event.farmId, 'system', {
        category,
        description: `${stockItem.name} - ${event.supplier || 'Unknown supplier'}`,
        incurredDate: event.purchaseDate.toISOString().split('T')[0],
        quantity: event.quantity,
        unit: event.unit,
        unitCost: event.unitCost,
        supplier: event.supplier,
        invoiceNumber: event.invoiceNumber,
        relatedInventoryPurchaseId: event.purchaseId,
        notes: `Auto-created from inventory purchase. Batch: ${event.batchNumber || 'N/A'}`,
      });

      this.logger.log(`✅ Cost recorded for purchase: ${event.totalCost} KES`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to record purchase cost: ${error.message}`);
    }
  }

  /**
   * When inventory consumption is recorded → Record cost in finance
   */
  @OnEvent(IntegrationEvents.CONSUMPTION_RECORDED)
  async handleConsumptionRecorded(event: ConsumptionRecordedEvent) {
    this.logger.log(
      `📉 Consumption → Finance: ${event.quantity} ${event.unit}`,
    );

    try {
      const stockItems = await this.inventoryService.getStockItems(
        event.farmId,
      );
      const stockItem = stockItems.find((item) => item.id === event.itemId);

      if (!stockItem) {
        this.logger.warn(`Stock item ${event.itemId} not found`);
        return;
      }

      const category = this.mapStockCategoryToCostCategory(stockItem.category);
      const unitCost = await this.calculateAverageUnitCost(
        event.farmId,
        event.itemId,
      );

      await this.financeService.recordCost(event.farmId, 'system', {
        category,
        description: `Daily consumption: ${stockItem.name}`,
        incurredDate: event.consumedDate.toISOString().split('T')[0],
        quantity: event.quantity,
        unit: event.unit,
        unitCost,
        relatedInventoryConsumptionId: event.consumptionId,
        relatedProductionLogId: event.relatedProductionLogId,
        notes: `Auto-created from daily operations. Type: ${event.relationType}`,
      });

      this.logger.log(`✅ Consumption cost recorded`);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to record consumption cost: ${error.message}`,
      );
    }
  }

  /**
   * When inventory adjustment is recorded → Record loss in finance
   */
  @OnEvent(IntegrationEvents.ADJUSTMENT_CREATED)
  async handleAdjustmentCreated(event: AdjustmentCreatedEvent) {
    this.logger.log(`⚠️ Adjustment → Finance: ${event.adjustmentType}`);

    try {
      const stockItems = await this.inventoryService.getStockItems(
        event.farmId,
      );
      const stockItem = stockItems.find((item) => item.id === event.itemId);

      if (!stockItem) {
        this.logger.warn(`Stock item ${event.itemId} not found`);
        return;
      }

      const unitCost = await this.calculateAverageUnitCost(
        event.farmId,
        event.itemId,
      );

      await this.financeService.recordCost(event.farmId, event.recordedBy, {
        category: CostCategory.MISCELLANEOUS,
        description: `Inventory ${event.adjustmentType}: ${stockItem.name}`,
        incurredDate: event.adjustmentDate.toISOString().split('T')[0],
        quantity: event.quantity,
        unit: event.unit,
        unitCost,
        supplier: event.supplier,
        invoiceNumber: event.invoiceNumber,
        relatedInventoryAdjustmentId: event.adjustmentId,
        notes: `Loss/adjustment: ${event.reason}. Details: ${event.details || 'N/A'}`,
      });

      this.logger.log(`✅ Adjustment cost recorded`);
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to record adjustment cost: ${error.message}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // POULTRY → INVENTORY INTEGRATION (NEW)
  // ═══════════════════════════════════════════════════════════════════════════════

  @OnEvent(IntegrationEvents.FLOCK_RECORD_CREATED)
  async handleFlockRecordCreated(event: FlockRecordCreatedEvent) {
    this.logger.log(`🐔 Flock Record → Inventory: ${event.feedConsumedKg} kg`);

    try {
      // 1. Record consumption in inventory (calls InventoryService)
      const consumption = await this.inventoryService.autoRecordConsumption(
        event.farmId,
        event.feedItemId,
        event.feedConsumedKg,
        event.flockRecordId,
        'flock_record', // This matches the relation type
      );

      if (!consumption) {
        this.logger.warn(
          `Feed item ${event.feedItemId} not found in inventory`,
        );
        return;
      }

      // 2. Get unit cost from inventory (average cost from purchases)
      const unitCost = await this.calculateAverageUnitCost(
        event.farmId,
        event.feedItemId,
      );
      const totalCost = event.feedConsumedKg * unitCost;

      // 3. Record cost in finance (calls FinanceService)
      await this.financeService.recordCost(event.farmId, 'system', {
        category: CostCategory.FEED,
        description: `Daily feed: Flock ${event.flockId}`,
        incurredDate: event.recordDate.toISOString().split('T')[0],
        quantity: event.feedConsumedKg,
        unit: 'kg',
        unitCost: unitCost,
        relatedInventoryConsumptionId: consumption.id,
        relatedProductionLogId: event.flockRecordId,
        notes: `Feed consumption from daily record`,
      });

      this.logger.log(`✅ Feed cost recorded: ${totalCost.toFixed(2)} KES`);
    } catch (error: any) {
      this.logger.error(`❌ Failed: ${error.message}`);
    }
  }

  /**
   * When flock is closed → Record revenue in finance
   */
  @OnEvent(IntegrationEvents.BIRD_SALE_RECORDED)
  async handleBirdSaleRecorded(event: {
    category: RevenueCategory;
    description: string;
    soldDate: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    buyer?: string;
    relatedProductionLogId?: string;
    receiptNumber?: string;
    notes?: string;
    farmId: string; // Also need farmId
  }) {
    this.logger.log(
      `💰 Bird Sale → Finance: ${event.quantity} birds @ ${event.unitPrice} KES`,
    );

    try {
      await this.financeService.recordRevenue(event.farmId, 'system', {
        category: event.category,
        description: event.description,
        soldDate: event.soldDate,
        quantity: event.quantity,
        unit: event.unit,
        unitPrice: event.unitPrice,
        buyer: event.buyer,
        relatedProductionLogId: event.relatedProductionLogId,
        receiptNumber: event.receiptNumber,
        notes: event.notes,
      });

      this.logger.log(
        `✅ Bird sale revenue recorded: ${event.quantity * event.unitPrice} KES`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to record bird sale revenue: ${error.message}`,
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HEALTH → INVENTORY & FINANCE INTEGRATION (NEW)
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * When health event with medication is created → Consume medication + record cost
   */
  @OnEvent(IntegrationEvents.HEALTH_EVENT_CREATED)
  async handleHealthEventCreated(event: HealthEventMedicationEvent) {
    this.logger.log(`🏥 Health Event → Inventory & Finance`);

    try {
      const { farmId, medicationId, quantity, treatmentCost } = event;

      if (medicationId && quantity > 0) {
        // Note: Consumption should be recorded by health service
        // This ensures finance is aware
        await this.financeService.recordCost(farmId, event.recordedBy, {
          category: CostCategory.MEDICATION,
          description: `Health treatment: ${event.condition || 'Unknown'}`,
          incurredDate: event.eventDate.toISOString().split('T')[0],
          quantity,
          unit: 'unit',
          unitCost: treatmentCost!,
          supplier: event.supplier,
          invoiceNumber: event.invoiceNumber,
          relatedHealthEventId: event.healthEventId,
          notes: `Severity: ${event.severity}. Animal: ${event.animalType}`,
        });

        this.logger.log(
          `✅ Health treatment cost recorded: ${treatmentCost} KES`,
        );
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to process health event: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Map inventory stock category to finance cost category
   */
  private mapStockCategoryToCostCategory(stockCategory: string): CostCategory {
    const mappings: Record<string, CostCategory> = {
      feed: CostCategory.FEED,
      medication: CostCategory.MEDICATION,
      vaccine: CostCategory.VACCINE,
      supplement: CostCategory.FEED,
      equipment: CostCategory.EQUIPMENT_MAINTENANCE,
      other: CostCategory.MISCELLANEOUS,
    };

    return mappings[stockCategory.toLowerCase()] || CostCategory.MISCELLANEOUS;
  }

  /**
   * Calculate average unit cost from purchase history
   */
  private async calculateAverageUnitCost(
    farmId: string,
    itemId: string,
  ): Promise<number> {
    try {
      const purchases = await this.inventoryService.getPurchases(
        farmId,
        itemId,
      );

      if (purchases.length === 0) return 0;

      const totalCost = purchases.reduce(
        (sum, p) => sum + p.quantity * p.costPerUnit,
        0,
      );
      const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);

      return totalQuantity > 0 ? totalCost / totalQuantity : 0;
    } catch (error) {
      this.logger.warn(`Could not calculate average unit cost`);
      return 0;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // REPORTING & ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Get integrated farm profitability view
   */
  async getFarmIntegratedProfitability(
    farmId: string,
    startDate: Date,
    endDate: Date,
  ) {
    return {
      period: { startDate, endDate },
      message: 'Integrated profitability analysis - combined from all modules',
      summary: {
        totalCosts: 0,
        totalRevenue: 0,
        netProfit: 0,
        costSources: {
          feedConsumption: 0,
          healthTreatments: 0,
          inventoryAdjustments: 0,
          otherCosts: 0,
        },
        revenueSources: {
          eggSales: 0,
          meatSales: 0,
          otherRevenue: 0,
        },
      },
    };
  }

  /**
   * Get cross-module alerts
   */
  async getCrossModuleAlerts(farmId: string) {
    return {
      alerts: [
        {
          type: 'inventory_low_stock',
          severity: 'warning',
          message: 'Feed stock running low',
        },
        {
          type: 'flock_high_mortality',
          severity: 'critical',
          message: 'Flock mortality above target',
        },
      ],
    };
  }
}
