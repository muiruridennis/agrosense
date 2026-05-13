import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateStockItemDto,
  UpdateStockItemDto,
  CreateStockPurchaseDto,
  CreateStockConsumptionDto,
  CreateStockAdjustmentDto,
  CurrentStockDto,
  StockStatusSummaryDto,
  StockAlertDto,
} from './dtos/inventory.dto';
import { StockItem } from './entities';
import { StockCategory } from './enums/stock.enums';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { FarmAccessGuard } from '../auth/guards/farm-access.guard';
import { FarmRoleGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/guards/roles.guard';
import { FarmMemberRole } from '../farm-members/entities/farm-member.entity';

@Controller('farms/:farmId/inventory')
@UseGuards(JwtAuthenticationGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // STOCK ITEMS - Define what the farm stocks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /farms/:farmId/inventory/items
   * Create a new stock item (e.g., "Layer Mash 16%", "Newcastle Vaccine")
   * Only manager/owner
   */
  @Post('items')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async createStockItem(
    @Param('farmId') farmId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateStockItemDto,
  ): Promise<StockItem> {
    return this.inventoryService.createStockItem(farmId, dto);
  }

  /**
   * GET /farms/:farmId/inventory/items
   * Get all stock items for the farm
   * Optional filter by category
   */
  @Get('items')
  @UseGuards(FarmAccessGuard)
  async getStockItems(
    @Param('farmId') farmId: string,
    @Query('category') category?: StockCategory,
  ): Promise<StockItem[]> {
    return this.inventoryService.getStockItems(farmId, category);
  }

  /**
   * PUT /farms/:farmId/inventory/items/:itemId
   * Update stock item (thresholds, min levels, etc)
   */
  @Put('items/:itemId')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(FarmMemberRole.MANAGER, FarmMemberRole.OWNER)
  async updateStockItem(
    @Param('farmId') farmId: string,
    @Param('itemId') itemId: string,
    @Req() req: RequestWithUser,
    @Body() dto: UpdateStockItemDto,
  ): Promise<StockItem> {
    return this.inventoryService.updateStockItem(farmId, itemId, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PURCHASES - Record when stock comes in
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /farms/:farmId/inventory/purchases
   * Record a purchase (adds stock to farm)
   * Captures: date, supplier, quantity, cost, batch, expiry, quality
   */
  @Post('purchases')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(
    FarmMemberRole.WORKER,
    FarmMemberRole.MANAGER,
    FarmMemberRole.OWNER,
  )
  async recordPurchase(
    @Param('farmId') farmId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateStockPurchaseDto,
  ) {
    return this.inventoryService.recordPurchase(farmId, req.user.id, dto);
  }

  /**
   * GET /farms/:farmId/inventory/purchases
   * Get all purchases for an item
   */
  @Get('purchases/:itemId')
  @UseGuards(FarmAccessGuard)
  async getPurchases(
    @Param('farmId') farmId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.inventoryService.getPurchases(farmId, itemId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONSUMPTION - Record when stock gets used
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /farms/:farmId/inventory/consumption
   * Record consumption (removes stock from farm)
   * Can be manual or auto-linked to daily logs
   */
  @Post('consumption')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(
    FarmMemberRole.WORKER,
    FarmMemberRole.MANAGER,
    FarmMemberRole.OWNER,
  )
  async recordConsumption(
    @Param('farmId') farmId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateStockConsumptionDto,
  ) {
    return this.inventoryService.recordConsumption(farmId, req.user.id, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADJUSTMENTS - Manual stock corrections
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /farms/:farmId/inventory/adjustments
   * Record manual adjustment
   * Reasons: spoilage, loss, theft, expired, damaged, recount
   */
  @Post('adjustments')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(
    FarmMemberRole.WORKER,
    FarmMemberRole.MANAGER,
    FarmMemberRole.OWNER,
  )
  async recordAdjustment(
    @Param('farmId') farmId: string,
    @Req() req: RequestWithUser,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    return this.inventoryService.recordAdjustment(farmId, req.user.id, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CURRENT STOCK - Real-time inventory status
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /farms/:farmId/inventory/current
   * Get all current stock for farm (inventory dashboard)
   * Shows: quantity on hand, days supply, status, expiry, etc
   */
  @Get('current')
  @UseGuards(FarmAccessGuard)
  async getFarmInventory(
    @Param('farmId') farmId: string,
    @Query('category') category?: StockCategory,
  ): Promise<CurrentStockDto[]> {
    return this.inventoryService.getFarmInventory(farmId, category);
  }

  /**
   * GET /farms/:farmId/inventory/current/:itemId
   * Get current stock for a specific item
   */
  @Get('current/:itemId')
  @UseGuards(FarmAccessGuard)
  async getCurrentStock(
    @Param('farmId') farmId: string,
    @Param('itemId') itemId: string,
  ): Promise<CurrentStockDto> {
    return this.inventoryService.getCurrentStock(farmId, itemId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ALERTS - Stock notifications
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /farms/:farmId/inventory/alerts
   * Get all active inventory alerts
   * Shows: low stock, critical stock, expiry warnings, quality issues
   */
  @Get('alerts')
  @UseGuards(FarmAccessGuard)
  async getFarmAlerts(
    @Param('farmId') farmId: string,
  ): Promise<StockAlertDto[]> {
    return this.inventoryService.getFarmAlerts(farmId);
  }

  /**
   * PUT /farms/:farmId/inventory/alerts/:alertId/acknowledge
   * Mark alert as acknowledged (user saw it)
   */
  @Put('alerts/:alertId/acknowledge')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(
    FarmMemberRole.WORKER,
    FarmMemberRole.MANAGER,
    FarmMemberRole.OWNER,
  )
  async acknowledgeAlert(
    @Param('farmId') farmId: string,
    @Param('alertId') alertId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.inventoryService.acknowledgeAlert(farmId, req.user.id, alertId);
  }

  /**
   * PUT /farms/:farmId/inventory/alerts/:alertId/resolve
   * Mark alert as resolved (action taken)
   */
  @Put('alerts/:alertId/resolve')
  @UseGuards(FarmRoleGuard)
  @RequiredRoles(
    FarmMemberRole.WORKER,
    FarmMemberRole.MANAGER,
    FarmMemberRole.OWNER,
  )
  async resolveAlert(
    @Param('farmId') farmId: string,
    @Param('alertId') alertId: string,
    @Req() req: RequestWithUser,
    @Body() body?: { notes?: string },
  ) {
    return this.inventoryService.resolveAlert(
      farmId,
      req.user.id,
      alertId,
      body?.notes,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTING & SUMMARY
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /farms/:farmId/inventory/summary
   * Get inventory summary dashboard
   * Shows: stock status counts, items needing reorder, items nearing expiry
   */
  @Get('summary')
  @UseGuards(FarmAccessGuard)
  async getInventorySummary(
    @Param('farmId') farmId: string,
  ): Promise<StockStatusSummaryDto> {
    return this.inventoryService.getInventorySummary(farmId);
  }
}
