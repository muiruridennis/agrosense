import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Repository, LessThan, MoreThan, IsNull, Not, Between } from 'typeorm';

import {
  CreateStockItemDto,
  UpdateStockItemDto,
  CreateStockPurchaseDto,
  CreateStockConsumptionDto,
  CreateStockAdjustmentDto,
  CurrentStockDto,
  StockStatusSummaryDto,
  StockAlertDto,
  SupplierPerformanceDto,
  InventoryCostReportDto,
  InventoryForecastDto,
} from './dtos/inventory.dto';
import { FarmMembersService } from '../farm-members/farm-members.service';
import {
  CurrentStock,
  StockAdjustment,
  StockAlert,
  StockConsumption,
  StockItem,
  StockPurchase,
} from './entities';
import {
  StockCategory,
  StockStatus,
  StockAlertType,
  StockAdjustmentReason,
  StockAlertSeverity,
} from './enums/stock.enums';

/**
 * InventoryService
 *
 * Core inventory management for AgroSense
 * Handles:
 * - Stock item definitions
 * - Purchase tracking
 * - Consumption tracking (linked to operations)
 * - Stock balance calculations
 * - Alerts and thresholds
 * - Cost analysis
 * - Supplier performance
 * - Forecasting
 *
 * Key principle: Inventory is tied to farm operations
 * - Consumption comes from daily logs, health events, breeding records
 * - Stock alerts correlate with operational issues
 * - Cost analysis links to production metrics
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockItem)
    private readonly itemRepo: Repository<StockItem>,

    @InjectRepository(StockPurchase)
    private readonly purchaseRepo: Repository<StockPurchase>,

    @InjectRepository(StockConsumption)
    private readonly consumptionRepo: Repository<StockConsumption>,

    @InjectRepository(StockAdjustment)
    private readonly adjustmentRepo: Repository<StockAdjustment>,

    @InjectRepository(CurrentStock)
    private readonly currentStockRepo: Repository<CurrentStock>,

    @InjectRepository(StockAlert)
    private readonly alertRepo: Repository<StockAlert>,

    private readonly farmMembersService: FarmMembersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // STOCK ITEM MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Define a new stock item for the farm
   * Example: "Layer Mash 16%", "Newcastle Vaccine", "Ivermectin"
   */
  async createStockItem(
    farmId: string,
    dto: CreateStockItemDto,
  ): Promise<StockItem> {
    const item = this.itemRepo.create({
      ...dto,
      farmId,
    });

    return this.itemRepo.save(item);
  }

  /**
   * Get all stock items for a farm
   */
  async getStockItems(
    farmId: string,
    category?: StockCategory,
  ): Promise<StockItem[]> {
    const where: any = { farmId, isActive: true };
    if (category) {
      where.category = category;
    }

    return this.itemRepo.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Update stock item details
   */
  async updateStockItem(
    farmId: string,
    itemId: string,
    dto: UpdateStockItemDto,
  ): Promise<StockItem> {
    const item = await this.itemRepo.findOne({
      where: { id: itemId, farmId },
    });

    if (!item) {
      throw new NotFoundException(`Stock item not found`);
    }

    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STOCK PURCHASES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record a purchase
   * This adds stock to the farm
   */
  async recordPurchase(
    farmId: string,
    userId: string,
    dto: CreateStockPurchaseDto,
  ): Promise<StockPurchase> {
    const item = await this.itemRepo.findOne({
      where: { id: dto.itemId, farmId },
    });
    if (!item) {
      throw new NotFoundException(`Stock item not found`);
    }

    const purchase = this.purchaseRepo.create({
      ...dto,
      farmId,
      purchaseDate: new Date(dto.purchaseDate),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
      totalCost: dto.quantity * dto.costPerUnit,
      recordedBy: userId,
    });
    // EMIT EVENT for Finance integration

    const saved = await this.purchaseRepo.save(purchase);
    this.eventEmitter.emit('inventory.purchase.created', {
      purchaseId: saved.id,
      farmId: saved.farmId,
      itemId: saved.itemId,
      quantity: saved.quantity,
      unit: item.unit,
      unitCost: saved.costPerUnit,
      totalCost: saved.totalCost,
      supplier: saved.supplierName,
      invoiceNumber: saved.invoiceNumber,
      purchaseDate: saved.purchaseDate,
      batchNumber: saved.batchNumber,
    });

    // Update current stock
    await this.recalculateStockBalance(farmId, dto.itemId);

    // Check for alerts
    await this.evaluateStockAlerts(farmId, dto.itemId);

    return saved;
  }

  /**
   * Get all purchases for an item
   */
  async getPurchases(farmId: string, itemId: string): Promise<StockPurchase[]> {
    return this.purchaseRepo.find({
      where: { farmId, itemId },
      order: { purchaseDate: 'DESC' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STOCK CONSUMPTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record consumption
   * Can be auto-linked to daily logs, health events, etc
   * Or manual entry for items not auto-tracked
   */
  async recordConsumption(
    farmId: string,
    userId: string,
    dto: CreateStockConsumptionDto,
  ): Promise<StockConsumption> {
    // Verify item exists
    const item = await this.itemRepo.findOne({
      where: { id: dto.itemId, farmId },
    });
    if (!item) {
      throw new NotFoundException(`Stock item not found`);
    }

    const consumption = this.consumptionRepo.create({
      ...dto,
      farmId,
      consumptionDate: new Date(dto.consumptionDate),
      recordedBy: userId,
    });

    const saved = await this.consumptionRepo.save(consumption);
    this.eventEmitter.emit('inventory.consumption.recorded', {
      consumptionId: saved.id,
      farmId: saved.farmId,
      itemId: saved.itemId,
      quantity: saved.quantity,
      unit: item.unit,
      consumedDate: saved.consumptionDate,
      relatedProductionLogId:
        saved.relatedFlockRecordId || saved.relatedHealthEventId,
      relationType: this.getRelationType(saved),
    });

    // Recalculate stock balance
    await this.recalculateStockBalance(farmId, dto.itemId);

    // Check alerts
    await this.evaluateStockAlerts(farmId, dto.itemId);

    return saved;
  }

  /**
   * Auto-record consumption from daily logs
   * Called by poultry/dairy/crop services when they record daily usage
   */
  async autoRecordConsumption(
    farmId: string,
    itemId: string,
    quantity: number,
    relatedRecordId: string,
    recordType:
      | 'flock_record'
      | 'daily_log'
      | 'health_event'
      | 'breeding_record'
      | 'lactation_record',
  ): Promise<StockConsumption | null> {
    // Don't verify access here (called from internal services)

    const item = await this.itemRepo.findOne({
      where: { id: itemId, farmId },
    });
    if (!item) {
      return null; // Item not tracked in inventory, skip
    }

    const consumption = this.consumptionRepo.create({
      farmId,
      itemId,
      quantity,
      consumptionDate: new Date(),
      relatedFlockRecordId:
        recordType === 'flock_record' ? relatedRecordId : null,
      relatedDailyLogId: recordType === 'daily_log' ? relatedRecordId : null,
      relatedHealthEventId:
        recordType === 'health_event' ? relatedRecordId : null,
      relatedBreedingRecordId:
        recordType === 'breeding_record' ? relatedRecordId : null,
    });

    const saved = await this.consumptionRepo.save(consumption);
    if (recordType === 'health_event') {
      this.eventEmitter.emit('health.event_with_medication', {
        healthEventId: relatedRecordId,
        farmId,
        medicationId: itemId,
        quantity,
        animalId: 'unknown', // Should be passed from health service
        animalType: 'BIRD', // Should be passed from health service
        condition: 'unknown', // Should be passed from health service
        severity: 'moderate', // Should be passed from health service
        eventDate: new Date(),
        recordedBy: 'system',
      });
    }

    // Recalculate & alert
    await this.recalculateStockBalance(farmId, itemId);
    await this.evaluateStockAlerts(farmId, itemId);

    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STOCK ADJUSTMENTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record manual adjustment
   * For: spoilage, loss, theft, expired, damaged, recount
   */
  async recordAdjustment(
    farmId: string,
    userId: string,
    dto: CreateStockAdjustmentDto,
  ): Promise<StockAdjustment> {
    // Verify item exists
    const item = await this.itemRepo.findOne({
      where: { id: dto.itemId, farmId },
    });
    if (!item) {
      throw new NotFoundException(`Stock item not found`);
    }

    const adjustment = this.adjustmentRepo.create({
      ...dto,
      farmId,
      adjustmentDate: new Date(dto.adjustmentDate),
      recordedBy: userId,
    });

    const saved = await this.adjustmentRepo.save(adjustment);

    // Recalculate
    await this.recalculateStockBalance(farmId, dto.itemId);

    // If it's a quality issue, create alert
    if (
      [
        StockAdjustmentReason.SPOILAGE,
        StockAdjustmentReason.EXPIRED,
        StockAdjustmentReason.DAMAGED,
      ].includes(dto.reason)
    ) {
      await this.createAlert(
        farmId,
        dto.itemId,
        StockAlertType.QUALITY_ISSUE,
        `Quality adjustment: ${dto.reason} - ${dto.description}`,
        StockAlertSeverity.CRITICAL,
      );
    }
    this.eventEmitter.emit('inventory.adjustment.created', {
      adjustmentId: saved.id,
      farmId: saved.farmId,
      itemId: saved.itemId,
      adjustmentType: saved.reason,
      quantity: saved.quantityAdjusted,
      unit: item.unit,
      adjustmentDate: saved.adjustmentDate,
      reason: saved.description,
      recordedBy: saved.recordedBy,
    });

    return saved;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STOCK BALANCE CALCULATION & ALERTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calculate current stock balance
   * Formula: Total Purchases - Total Consumptions - Total Adjustments
   */
  async recalculateStockBalance(
    farmId: string,
    itemId: string,
  ): Promise<CurrentStock> {
    // Get all purchases
    const purchases = await this.purchaseRepo.find({
      where: { farmId, itemId },
    });
    const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);

    // Get all consumptions
    const consumptions = await this.consumptionRepo.find({
      where: { farmId, itemId },
    });
    const totalConsumed = consumptions.reduce((sum, c) => sum + c.quantity, 0);

    // Get all adjustments
    const adjustments = await this.adjustmentRepo.find({
      where: { farmId, itemId },
    });
    const totalAdjusted = adjustments.reduce(
      (sum, a) => sum + a.quantityAdjusted,
      0,
    );

    // Calculate balance
    const quantityOnHand = totalPurchased - totalConsumed + totalAdjusted;

    // Get item for threshold info
    const item = await this.itemRepo.findOne({
      where: { id: itemId, farmId },
    });
    if (!item) {
      throw new NotFoundException(`Stock item not found`);
    }

    // Calculate daily consumption (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentConsumptions = consumptions.filter(
      (c) => new Date(c.consumptionDate) >= sevenDaysAgo,
    );
    const avgDailyConsumption =
      recentConsumptions.length > 0
        ? recentConsumptions.reduce((sum, c) => sum + c.quantity, 0) / 7
        : null;

    // Calculate daily consumption (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthConsumptions = consumptions.filter(
      (c) => new Date(c.consumptionDate) >= thirtyDaysAgo,
    );
    const avgDailyConsumption30Days =
      monthConsumptions.length > 0
        ? monthConsumptions.reduce((sum, c) => sum + c.quantity, 0) / 30
        : null;

    // Calculate days supply
    const daysSupply =
      avgDailyConsumption && avgDailyConsumption > 0
        ? quantityOnHand / avgDailyConsumption
        : null;

    // Estimate runout date
    const estimatedRunoutDate =
      daysSupply && daysSupply > 0
        ? new Date(Date.now() + daysSupply * 24 * 60 * 60 * 1000)
        : null;

    // Determine status
    let status: StockStatus = StockStatus.UNKNOWN;
    if (quantityOnHand === 0) {
      status = StockStatus.CRITICAL;
    } else if (daysSupply) {
      if (daysSupply < item.minStockLevel / 30) {
        status = StockStatus.CRITICAL;
      } else if (daysSupply < item.minStockLevel / 15) {
        status = StockStatus.LOW;
      } else if (daysSupply > item.optimalStockDays * 1.5) {
        status = StockStatus.EXCESS;
      } else {
        status = StockStatus.ADEQUATE;
      }
    }

    // Get latest purchase info
    const latestPurchase =
      purchases.length > 0
        ? purchases.sort(
            (a, b) =>
              new Date(b.purchaseDate).getTime() -
              new Date(a.purchaseDate).getTime(),
          )[0]
        : null;

    // Update or create current stock record
    let currentStock = await this.currentStockRepo.findOne({
      where: { farmId, itemId },
    });

    if (!currentStock) {
      currentStock = this.currentStockRepo.create({
        farmId,
        itemId,
      });
    }

    currentStock.quantityOnHand = quantityOnHand;
    currentStock.lastUpdated = new Date();
    currentStock.daysSupply = daysSupply;
    currentStock.estimatedRunoutDate = estimatedRunoutDate;
    currentStock.status = status;
    currentStock.latestPurchaseId = latestPurchase?.id || null;
    currentStock.latestExpiryDate = latestPurchase?.expiryDate || null;
    currentStock.latestBatchNumber = latestPurchase?.batchNumber || null;
    currentStock.avgDailyConsumption = avgDailyConsumption;
    currentStock.avgDailyConsumption30Days = avgDailyConsumption30Days;

    return this.currentStockRepo.save(currentStock);
  }

  /**
   * Get current stock status for an item
   */
  async getCurrentStock(
    farmId: string,
    itemId: string,
  ): Promise<CurrentStockDto> {
    const stock = await this.currentStockRepo.findOne({
      where: { farmId, itemId },
      relations: ['item'],
    });

    if (!stock) {
      throw new NotFoundException(`Stock not found`);
    }

    return this.mapCurrentStockToDto(stock);
  }

  /**
   * Get all current stock for farm
   */
  async getFarmInventory(
    farmId: string,
    category?: StockCategory,
  ): Promise<CurrentStockDto[]> {
    const where: any = { farmId };
    if (category) {
      where.item = { category };
    }

    const stocks = await this.currentStockRepo.find({
      where,
      relations: ['item'],
      order: { item: { category: 'ASC', name: 'ASC' } },
    });

    return stocks.map((s) => this.mapCurrentStockToDto(s));
  }

  /**
   * Evaluate and create alerts for a stock item
   */
  private async evaluateStockAlerts(
    farmId: string,
    itemId: string,
  ): Promise<void> {
    const stock = await this.currentStockRepo.findOne({
      where: { farmId, itemId },
      relations: ['item'],
    });

    if (!stock) return;

    const item = stock.item;

    // Remove old active alerts for this item
    await this.alertRepo.delete({
      farmId,
      itemId,
      alertStatus: 'active',
    });

    // Create new alerts based on status
    if (stock.status === StockStatus.CRITICAL) {
      await this.createAlert(
        farmId,
        itemId,
        StockAlertType.CRITICAL_STOCK,
        `CRITICAL: ${item.name} stock is ${stock.quantityOnHand} ${item.unit}. Reorder immediately.`,
        StockAlertSeverity.CRITICAL,
      );
    } else if (stock.status === StockStatus.LOW) {
      const daysUntilRunout = stock.daysSupply
        ? Math.floor(stock.daysSupply)
        : 'unknown';
      await this.createAlert(
        farmId,
        itemId,
        StockAlertType.LOW_STOCK,
        `${item.name} stock is low (${daysUntilRunout} days supply). Plan to reorder.`,
        StockAlertSeverity.WARNING,
      );
    }

    // Expiry warning
    if (
      stock.latestExpiryDate &&
      new Date(stock.latestExpiryDate) < new Date()
    ) {
      await this.createAlert(
        farmId,
        itemId,
        StockAlertType.EXPIRED,
        `${item.name} (Batch ${stock.latestBatchNumber}) has expired. Discard immediately.`,
        StockAlertSeverity.CRITICAL,
      );
    } else if (stock.latestExpiryDate) {
      const daysUntilExpiry = Math.ceil(
        (new Date(stock.latestExpiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysUntilExpiry <= 7) {
        await this.createAlert(
          farmId,
          itemId,
          StockAlertType.EXPIRY_WARNING,
          `${item.name} (Batch ${stock.latestBatchNumber}) expires in ${daysUntilExpiry} days.`,
          StockAlertSeverity.WARNING,
        );
      }
    }

    // Excess stock
    if (stock.status === StockStatus.EXCESS) {
      await this.createAlert(
        farmId,
        itemId,
        StockAlertType.OVERSTOCK,
        `${item.name} stock is excessive (${Math.floor(stock.daysSupply || 0)} days supply). Check storage conditions.`,
        StockAlertSeverity.INFO,
      );
    }
  }

  /**
   * Create a stock alert
   */
  private async createAlert(
    farmId: string,
    itemId: string,
    alertType: StockAlertType,
    message: string,
    severity: StockAlertSeverity,
  ): Promise<StockAlert> {
    // Check if alert already exists
    const existing = await this.alertRepo.findOne({
      where: {
        farmId,
        itemId,
        alertType,
        alertStatus: Not('resolved'),
      },
    });

    if (existing) {
      return existing; // Don't create duplicate
    }

    const alert = this.alertRepo.create({
      farmId,
      itemId,
      alertType,
      message,
      severity,
      alertStatus: 'active',
    });

    return this.alertRepo.save(alert);
  }

  /**
   * Get active alerts for farm
   */
  async getFarmAlerts(farmId: string): Promise<StockAlertDto[]> {
    const alerts = await this.alertRepo.find({
      where: { farmId, alertStatus: 'active' },
      relations: ['item'],
      order: { severity: 'DESC', createdAt: 'DESC' },
    });

    return alerts.map((a) => this.mapAlertToDto(a));
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    farmId: string,
    userId: string,
    alertId: string,
  ): Promise<StockAlert> {
    const alert = await this.alertRepo.findOne({
      where: { id: alertId, farmId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert not found`);
    }

    alert.alertStatus = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    return this.alertRepo.save(alert);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    farmId: string,
    userId: string,
    alertId: string,
    notes?: string,
  ): Promise<StockAlert> {
    const alert = await this.alertRepo.findOne({
      where: { id: alertId, farmId },
    });

    if (!alert) {
      throw new NotFoundException(`Alert not found`);
    }

    alert.alertStatus = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolutionNotes = notes || null;

    return this.alertRepo.save(alert);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTING & ANALYSIS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get farm inventory summary/dashboard
   */
  async getInventorySummary(farmId: string): Promise<StockStatusSummaryDto> {
    const stocks = await this.currentStockRepo.find({
      where: { farmId },
      relations: ['item'],
    });

    const summary: StockStatusSummaryDto = {
      totalItems: stocks.length,
      adequateStock: stocks.filter((s) => s.status === StockStatus.ADEQUATE)
        .length,
      lowStock: stocks.filter((s) => s.status === StockStatus.LOW).length,
      criticalStock: stocks.filter((s) => s.status === StockStatus.CRITICAL)
        .length,
      excessStock: stocks.filter((s) => s.status === StockStatus.EXCESS).length,
      unknownStatus: stocks.filter((s) => s.status === StockStatus.UNKNOWN)
        .length,

      itemsNeeringExpiry: stocks
        .filter(
          (s) =>
            s.latestExpiryDate &&
            new Date(s.latestExpiryDate) > new Date() &&
            new Date(s.latestExpiryDate).getTime() - Date.now() <
              7 * 24 * 60 * 60 * 1000,
        )
        .map((s) => ({
          itemId: s.itemId,
          itemName: s.item.name,
          expiryDate: s.latestExpiryDate!,
          daysUntilExpiry: Math.ceil(
            (new Date(s.latestExpiryDate!).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ),
        })),

      itemsNeedingReorder: stocks
        .filter(
          (s) =>
            s.status === StockStatus.LOW || s.status === StockStatus.CRITICAL,
        )
        .map((s) => ({
          itemId: s.itemId,
          itemName: s.item.name,
          currentStock: s.quantityOnHand,
          minLevel: s.item.minStockLevel,
          daysSupply: s.daysSupply || 0,
        })),
    };

    return summary;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────

  private mapCurrentStockToDto(stock: CurrentStock): CurrentStockDto {
    return {
      id: stock.id,
      farmId: stock.farmId,
      itemId: stock.itemId,
      itemName: stock.item.name,
      category: stock.item.category,
      unit: stock.item.unit,
      quantityOnHand: stock.quantityOnHand,
      lastUpdated: stock.lastUpdated,
      daysSupply: stock.daysSupply,
      estimatedRunoutDate: stock.estimatedRunoutDate,
      status: stock.status,
      latestExpiryDate: stock.latestExpiryDate,
      latestBatchNumber: stock.latestBatchNumber,
      avgDailyConsumption: stock.avgDailyConsumption,
      avgDailyConsumption30Days: stock.avgDailyConsumption30Days,
      minStockLevel: stock.item.minStockLevel,
      optimalStockDays: stock.item.optimalStockDays,
    };
  }

  private mapAlertToDto(alert: StockAlert): StockAlertDto {
    return {
      id: alert.id,
      farmId: alert.farmId,
      itemId: alert.itemId,
      itemName: alert.item.name,
      alertType: alert.alertType,
      message: alert.message,
      details: alert.details,
      severity: alert.severity,
      alertStatus: alert.alertStatus,
      acknowledgedAt: alert.acknowledgedAt,
      acknowledgedBy: alert.acknowledgedBy,
      resolvedAt: alert.resolvedAt,
      resolutionNotes: alert.resolutionNotes,
      createdAt: alert.createdAt,
    };
  }
  private getRelationType(consumption: StockConsumption): string {
    if (consumption.relatedFlockRecordId) return 'flock_record';
    if (consumption.relatedHealthEventId) return 'health_event';
    if (consumption.relatedBreedingRecordId) return 'breeding_record';
    return 'crop_activity';
  }
}
