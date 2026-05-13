import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FinanceService } from '../finance/finance.service';
import { InventoryService } from '../inventory/inventory.service';
import { CostCategory } from '../finance/enums/cost-category.enum';
import { AnimalType } from '../health-event/entities/health-event.entity';

// ============================================================================
// EVENT INTERFACES
// ============================================================================

export interface PurchaseCreatedEvent {
  purchaseId: string;
  farmId: string;
  itemId: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  invoiceNumber?: string;
  purchaseDate: Date;
  batchNumber?: string;
}

export interface ConsumptionRecordedEvent {
  consumptionId: string;
  farmId: string;
  itemId: string;
  quantity: number;
  unit: string;
  consumedDate: Date;
  relatedProductionLogId: string;
  relationType:
    | 'flock_record'
    | 'lactation_record'
    | 'health_event'
    | 'crop_activity';
}

export interface AdjustmentCreatedEvent {
  adjustmentId: string;
  farmId: string;
  itemId: string;
  adjustmentType: 'spoilage' | 'expired' | 'theft' | 'damaged' | 'recount';
  quantity: number;
  unit: string;
  adjustmentDate: Date;
  reason: string;
  details?: string;
  recordedBy: string;
  supplier?: string;
  invoiceNumber?: string;
}

export interface PaymentRecordedEvent {
  farmId: string;
  purchaseId: string;
  amountPaid: number;
  paidDate: Date;
}

export interface HealthEventMedicationEvent {
  healthEventId: string;
  farmId: string;
  medicationId: string;
  quantity: number;
  animalId: string;
  animalType: AnimalType;
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  eventDate: Date;
  recordedBy: string;
  invoiceNumber?: string;
  supplier: string;
}

export interface FlockRecordCreatedEvent {
  flockRecordId: string;
  farmId: string;
  feedItemId: string;
  feedConsumedKg: number;
  eggsProduced: number;
  recordDate: Date;
  mortalityCount: number;
  invoiceNumber?: string;
  supplier: string;
}

export interface LactationRecordCreatedEvent {
  lactationRecordId: string;
  farmId: string;
  concentrateItemId: string;
  concentrateUsedKg: number;
  milkProducedLitres: number;
  recordDate: Date;
  invoiceNumber?: string;
  supplier: string;
}

// ============================================================================
// INTEGRATION SERVICE
// ============================================================================

@Injectable()
export class InventoryFinanceIntegrationService {
  private readonly logger = new Logger(InventoryFinanceIntegrationService.name);

  constructor(
    private readonly financeService: FinanceService,
    private readonly inventoryService: InventoryService,
  ) {}

  @OnEvent('inventory.purchase.created')
  async onPurchaseCreated(event: PurchaseCreatedEvent) {
    this.logger.log(
      `📦 Purchase created: ${event.quantity} ${event.unit} of ${event.itemId}`,
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

      const costEntry = await this.financeService.recordCost(
        event.farmId,
        'system',
        {
          category,
          description: `${stockItem.name} - ${event.supplier || 'Unknown supplier'}, Invoice #${event.invoiceNumber || 'N/A'}`,
          incurredDate: event.purchaseDate.toISOString().split('T')[0],
          quantity: event.quantity,
          unit: event.unit,
          unitCost: event.unitCost,
          supplier: event.supplier,
          invoiceNumber: event.invoiceNumber,
          relatedInventoryPurchaseId: event.purchaseId,
          notes: `Auto-created from inventory purchase. Batch: ${event.batchNumber || 'N/A'}`,
        },
      );

      this.logger.log(
        `✅ Cost entry created: ${costEntry.totalCost} KES (Purchase ID: ${event.purchaseId})`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to create cost entry for purchase: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('inventory.consumption.recorded')
  async onConsumptionRecorded(event: ConsumptionRecordedEvent) {
    this.logger.log(
      `📉 Consumption recorded: ${event.quantity} ${event.unit} of ${event.itemId}`,
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

      let unitCost = 0;
      try {
        const purchases = await this.inventoryService.getPurchases(
          event.farmId,
          event.itemId,
        );
        if (purchases.length > 0) {
          const totalCost = purchases.reduce(
            (sum, p) => sum + p.quantity * p.costPerUnit,
            0,
          );
          const totalQuantity = purchases.reduce(
            (sum, p) => sum + p.quantity,
            0,
          );
          unitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        }
      } catch (error: any) {
        this.logger.warn(`Could not calculate average cost: ${error.message}`);
      }

      const costEntry = await this.financeService.recordCost(
        event.farmId,
        'system',
        {
          category,
          description: `Daily consumption: ${stockItem.name} (${event.relationType})`,
          incurredDate: event.consumedDate.toISOString().split('T')[0],
          quantity: event.quantity,
          unit: event.unit,
          unitCost: unitCost,
          relatedInventoryConsumptionId: event.consumptionId,
          relatedProductionLogId: event.relatedProductionLogId,
          notes: `Auto-created from daily operations. Type: ${event.relationType}`,
        },
      );

      this.logger.log(
        `✅ Consumption cost recorded: ${costEntry.totalCost} KES (Consumption ID: ${event.consumptionId})`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to create consumption cost: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('inventory.adjustment.created')
  async onAdjustmentCreated(event: AdjustmentCreatedEvent) {
    this.logger.log(
      `⚠️ Adjustment recorded: ${event.quantity} ${event.unit} (${event.adjustmentType})`,
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

      let unitCost = 0;
      try {
        const purchases = await this.inventoryService.getPurchases(
          event.farmId,
          event.itemId,
        );
        if (purchases.length > 0) {
          const totalCost = purchases.reduce(
            (sum, p) => sum + p.quantity * p.costPerUnit,
            0,
          );
          const totalQuantity = purchases.reduce(
            (sum, p) => sum + p.quantity,
            0,
          );
          unitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        }
      } catch (error: any) {
        this.logger.warn(`Could not calculate unit cost: ${error.message}`);
      }

      const costEntry = await this.financeService.recordCost(
        event.farmId,
        event.recordedBy,
        {
          category: CostCategory.MISCELLANEOUS,
          description: `Inventory ${event.adjustmentType}: ${stockItem.name} - ${event.reason}`,
          incurredDate: event.adjustmentDate.toISOString().split('T')[0],
          quantity: event.quantity,
          unit: event.unit,
          unitCost: unitCost,
          supplier: event.supplier,
          invoiceNumber: event.invoiceNumber,
          relatedInventoryAdjustmentId: event.adjustmentId,
          notes: `Loss/adjustment: ${event.reason}. Details: ${event.details || 'N/A'}`,
        },
      );

      this.logger.log(
        `✅ Adjustment cost recorded: ${costEntry.totalCost} KES loss (Adjustment ID: ${event.adjustmentId})`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to record adjustment cost: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('poultry.flock_record.created')
  async onFlockRecordCreated(event: FlockRecordCreatedEvent) {
    this.logger.log(
      `🐔 Flock record: ${event.feedConsumedKg} kg feed consumed`,
    );

    try {
      if (!event.feedConsumedKg || !event.feedItemId) {
        return;
      }

      const consumption = await this.inventoryService.autoRecordConsumption(
        event.farmId,
        event.feedItemId,
        event.feedConsumedKg,
        event.flockRecordId,
        'flock_record',
      );

      if (!consumption) {
        this.logger.warn(
          `Feed item ${event.feedItemId} not tracked in inventory`,
        );
        return;
      }

      const stockItems = await this.inventoryService.getStockItems(
        event.farmId,
      );
      const feedItem = stockItems.find((item) => item.id === event.feedItemId);

      if (!feedItem) {
        this.logger.warn(`Feed item ${event.feedItemId} not found`);
        return;
      }

      let unitCost = 0;
      try {
        const purchases = await this.inventoryService.getPurchases(
          event.farmId,
          event.feedItemId,
        );
        if (purchases.length > 0) {
          const totalCost = purchases.reduce(
            (sum, p) => sum + p.quantity * p.costPerUnit,
            0,
          );
          const totalQuantity = purchases.reduce(
            (sum, p) => sum + p.quantity,
            0,
          );
          unitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        }
      } catch (error: any) {
        this.logger.warn(`Could not calculate feed cost: ${error.message}`);
      }

      const costEntry = await this.financeService.recordCost(
        event.farmId,
        'system',
        {
          category: CostCategory.FEED,
          description: `Daily feed: ${feedItem.name} - Flock consumption`,
          incurredDate: event.recordDate.toISOString().split('T')[0],
          quantity: event.feedConsumedKg,
          unit: 'kg',
          unitCost: unitCost,
          invoiceNumber: event.invoiceNumber,
          supplier: event.supplier,
          relatedInventoryConsumptionId: consumption.id,
          relatedProductionLogId: event.flockRecordId,
          notes: `${event.feedConsumedKg} kg consumed. Production: ${event.eggsProduced} eggs`,
        },
      );

      this.logger.log(
        `✅ Feed cost recorded: ${costEntry.totalCost} KES (Flock Record ID: ${event.flockRecordId})`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to process flock record: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('dairy.lactation_record.created')
  async onLactationRecordCreated(event: LactationRecordCreatedEvent) {
    this.logger.log(
      `🥛 Lactation record: ${event.concentrateUsedKg} kg concentrate`,
    );

    try {
      if (!event.concentrateUsedKg || !event.concentrateItemId) {
        return;
      }

      const consumption = await this.inventoryService.autoRecordConsumption(
        event.farmId,
        event.concentrateItemId,
        event.concentrateUsedKg,
        event.lactationRecordId,
        'lactation_record',
      );

      if (!consumption) {
        this.logger.warn(
          `Concentrate item ${event.concentrateItemId} not tracked in inventory`,
        );
        return;
      }

      const stockItems = await this.inventoryService.getStockItems(
        event.farmId,
      );
      const concentrate = stockItems.find(
        (item) => item.id === event.concentrateItemId,
      );

      if (!concentrate) {
        this.logger.warn(
          `Concentrate item ${event.concentrateItemId} not found`,
        );
        return;
      }

      let unitCost = 0;
      try {
        const purchases = await this.inventoryService.getPurchases(
          event.farmId,
          event.concentrateItemId,
        );
        if (purchases.length > 0) {
          const totalCost = purchases.reduce(
            (sum, p) => sum + p.quantity * p.costPerUnit,
            0,
          );
          const totalQuantity = purchases.reduce(
            (sum, p) => sum + p.quantity,
            0,
          );
          unitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        }
      } catch (error: any) {
        this.logger.warn(
          `Could not calculate concentrate cost: ${error.message}`,
        );
      }

      const costEntry = await this.financeService.recordCost(
        event.farmId,
        'system',
        {
          category: CostCategory.SUPPLEMENT,
          description: `Daily concentrate: ${concentrate.name} - Dairy cow feeding`,
          incurredDate: event.recordDate.toISOString().split('T')[0],
          quantity: event.concentrateUsedKg,
          unit: 'kg',
          unitCost: unitCost,
          invoiceNumber: event.invoiceNumber,
          supplier: event.supplier,
          relatedInventoryConsumptionId: consumption.id,
          relatedProductionLogId: event.lactationRecordId,
          notes: `${event.concentrateUsedKg} kg concentrate. Milk yield: ${event.milkProducedLitres} liters`,
        },
      );

      this.logger.log(
        `✅ Concentrate cost recorded: ${costEntry.totalCost} KES (Lactation Record ID: ${event.lactationRecordId})`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to process lactation record: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('health.event_with_medication')
  async onHealthEventWithMedication(event: HealthEventMedicationEvent) {
    this.logger.log(
      `💊 Health event with medication: ${event.medicationId} x${event.quantity}`,
    );

    try {
      const consumption = await this.inventoryService.autoRecordConsumption(
        event.farmId,
        event.medicationId,
        event.quantity,
        event.healthEventId,
        'health_event',
      );

      if (!consumption) {
        this.logger.warn(
          `Medication ${event.medicationId} not tracked in inventory`,
        );
        return;
      }

      const stockItems = await this.inventoryService.getStockItems(
        event.farmId,
      );
      const medication = stockItems.find(
        (item) => item.id === event.medicationId,
      );

      if (!medication) {
        this.logger.warn(`Medication ${event.medicationId} not found`);
        return;
      }

      let unitCost = 0;
      try {
        const purchases = await this.inventoryService.getPurchases(
          event.farmId,
          event.medicationId,
        );
        if (purchases.length > 0) {
          const totalCost = purchases.reduce(
            (sum, p) => sum + p.quantity * p.costPerUnit,
            0,
          );
          const totalQuantity = purchases.reduce(
            (sum, p) => sum + p.quantity,
            0,
          );
          unitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        }
      } catch (error: any) {
        this.logger.warn(
          `Could not calculate medication cost: ${error.message}`,
        );
      }

      const costEntry = await this.financeService.recordCost(
        event.farmId,
        event.recordedBy,
        {
          category: CostCategory.MEDICATION,
          description: `Medication for ${event.animalType.toLowerCase()}: ${medication.name} - Treatment of ${event.condition}`,
          incurredDate: event.eventDate.toISOString().split('T')[0],
          quantity: event.quantity,
          unit: medication.unit,
          unitCost: unitCost,
          supplier: event.supplier,
          invoiceNumber: event.invoiceNumber,
          relatedHealthEventId: event.healthEventId,
          relatedAnimalId: event.animalId,
          relatedInventoryConsumptionId: consumption.id,
          notes: `Health event treatment. Condition: ${event.condition}, Severity: ${event.severity}`,
        },
      );

      this.logger.log(
        `✅ Medication cost recorded: ${costEntry.totalCost} KES (Health Event ID: ${event.healthEventId})`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to process health event medication: ${error.message}`,
        error.stack,
      );
    }
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  private mapStockCategoryToCostCategory(stockCategory: string): CostCategory {
    const mapping: Record<string, CostCategory> = {
      feed: CostCategory.FEED,
      vaccine: CostCategory.VACCINE,
      medication: CostCategory.MEDICATION,
      supplement: CostCategory.SUPPLEMENT,
      fertilizer: CostCategory.FERTILIZER,
      pesticide: CostCategory.PESTICIDE,
      seed: CostCategory.SEED,
      equipment: CostCategory.EQUIPMENT_MAINTENANCE,
    };
    return mapping[stockCategory?.toLowerCase()] || CostCategory.MISCELLANEOUS;
  }

  async verifyConsistency(
    farmId: string,
    period: string,
  ): Promise<{
    isConsistent: boolean;
    issues: string[];
    summary: {
      totalPurchases: number;
      linkedToCosts: number;
      orphanedPurchases: number;
      totalConsumptions: number;
      linkedConsumptions: number;
      orphanedConsumptions: number;
    };
  }> {
    this.logger.log(`🔍 Verifying inventory-finance consistency for ${period}`);

    try {
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);

      const costs = await this.financeService.getCosts(
        farmId,
        startDate,
        endDate,
      );
      const stockItems = await this.inventoryService.getStockItems(farmId);
      let totalPurchases = 0;
      let linkedToCosts = 0;

      for (const item of stockItems) {
        const purchases = await this.inventoryService.getPurchases(
          farmId,
          item.id,
        );
        const periodPurchases = purchases.filter(
          (p) =>
            new Date(p.purchaseDate) >= startDate &&
            new Date(p.purchaseDate) <= endDate,
        );

        for (const purchase of periodPurchases) {
          totalPurchases++;
          const hasCostLink = costs.some(
            (c) => c.relatedInventoryPurchaseId === purchase.id,
          );
          if (hasCostLink) linkedToCosts++;
        }
      }

      const issues: string[] = [];
      const orphanedPurchases = totalPurchases - linkedToCosts;
      if (orphanedPurchases > 0) {
        issues.push(
          `${orphanedPurchases} purchases not linked to cost entries`,
        );
      }

      return {
        isConsistent: issues.length === 0,
        issues,
        summary: {
          totalPurchases,
          linkedToCosts,
          orphanedPurchases,
          totalConsumptions: 0,
          linkedConsumptions: 0,
          orphanedConsumptions: 0,
        },
      };
    } catch (error: any) {
      this.logger.error(`❌ Consistency check failed: ${error.message}`);
      throw error;
    }
  }
}
