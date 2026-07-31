// pricing/pricing.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PricingService } from './pricing.service';
import {
  CreatePricingTierDto,
  PricingHistoryQueryDto,
} from './dto/pricing.dto';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-authentication.guard';
import { 
  PRICING_QUEUE, 
  ACTIVATE_SCHEDULED_PRICING_JOB 
} from '../jobs/jobs.constants';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';


@Controller('/farms/:farmId/pricing')
@UseGuards(JwtAuthenticationGuard)
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    @InjectQueue(PRICING_QUEUE) private readonly pricingQueue: Queue,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // CREATE NEW VERSION (Every price change creates new version)
  // ───────────────────────────────────────────────────────────────────────────

  @Post('/')
  async createVersion(
    @Param('farmId') farmId: string,
    @Body() dto: CreatePricingTierDto,
    @Req() req: any,
  ) {
    const pricing = await this.pricingService.createPricingVersion(
      farmId,
      dto,
      req.user.id,
    );

    return pricing;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GET ACTIVE PRICING
  // ───────────────────────────────────────────────────────────────────────────

  @Get('/current')
  async getCurrentPricing(@Param('farmId') farmId: string) {
    const pricing = await this.pricingService.getActivePricingForFarm(farmId);

    return pricing;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GET ALL VERSIONS (Price book history)
  // ───────────────────────────────────────────────────────────────────────────

  @Get('/versions')
  async getAllVersions(@Param('farmId') farmId: string) {
    const versions = await this.pricingService.getAllVersionsForFarm(farmId);

    return {
      data: versions,
      meta: {
        totalVersions: versions.length,
        activeVersion: versions.find((v) => v.status === 'active')?.version,
        archivedCount: versions.filter((v) => v.status === 'archived').length,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GET VERSION LIFECYCLE EVENTS (Audit trail)
  // ───────────────────────────────────────────────────────────────────────────

  @Get('/history')
  async getHistory(
    @Param('farmId') farmId: string,
    @Query() query: PricingHistoryQueryDto,
  ) {
    const result = await this.pricingService.getPricingHistory(farmId, query);

    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: Math.ceil(result.total / result.limit),
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUSPEND / RESTORE (Rare admin operations)
  // ───────────────────────────────────────────────────────────────────────────

  @Patch('/:tierId/suspend')
  async suspendPricing(
    @Param('farmId') farmId: string,
    @Param('tierId') tierId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    await this.pricingService.suspendPricing(tierId, body.reason, req.user.id);

    return {
      message: `✅ Pricing tier suspended. Reason: ${body.reason}`,
    };
  }

  @Patch('/:tierId/restore')
  async restorePricing(
    @Param('farmId') farmId: string,
    @Param('tierId') tierId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    await this.pricingService.restorePricing(tierId, body.reason, req.user.id);

    return {
      success: true,
      message: `✅ Pricing tier restored.`,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CREATE SCHEDULED VERSION
  // ───────────────────────────────────────────────────────────────────────────

  @Post('/schedule')
  async scheduleVersion(
    @Param('farmId') farmId: string,
    @Body() dto: CreatePricingTierDto,
    @Req() req: any,
  ) {
    // Extract effectiveDate from DTO or require it for scheduled versions
    if (!dto.effectiveDate) {
      throw new BadRequestException(
        'effectiveDate is required for scheduled pricing',
      );
    }

    const pricing = await this.pricingService.createScheduledVersion(
      farmId,
      dto,
      req.user.id,
      dto.effectiveDate,
    );

    return {
      success: true,
      message: `✅ Pricing version ${pricing.version} scheduled for ${dto.effectiveDate}`,
      data: pricing,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MANUAL ACTIVATION
  // ───────────────────────────────────────────────────────────────────────────

  @Post('/:tierId/activate')
  async activateVersionManually(
    @Param('farmId') farmId: string,
    @Param('tierId') tierId: string,
    @Body() body: { reason?: string },
    @Req() req: RequestWithUser,
  ) {
    // Verify the tier belongs to this farm
    const tier = await this.pricingService.getPricingTierById(tierId);
    if (tier.farmId !== farmId) {
      throw new ForbiddenException(
        'This pricing tier does not belong to this farm',
      );
    }

    const activated = await this.pricingService.activateVersionManually(
      tierId,
      req.user.id,
      body.reason,
    );

    return {
      message: `✅ Version ${activated.version} activated successfully`,
      data: activated,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TRIGGER SCHEDULED CHECK (Background Job)
  // ───────────────────────────────────────────────────────────────────────────

  @Post('/check-scheduled')
  async checkAndActivateScheduled(
    @Param('farmId') farmId: string,
    @Req() req: any,
  ) {
    // Trigger the background job directly via Bull queue
    await this.pricingQueue.add(
      ACTIVATE_SCHEDULED_PRICING_JOB,
      { farmId },
      { 
        attempts: 2, 
        backoff: { type: 'exponential', delay: 5000 } 
      }
    );

    return {
      success: true,
      message: '✅ Scheduled pricing check triggered',
      note: 'This runs asynchronously. Check the pricing history for results.',
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GET UPCOMING SCHEDULED VERSIONS
  // ───────────────────────────────────────────────────────────────────────────

  @Get('/scheduled')
  async getUpcomingScheduledVersions(@Param('farmId') farmId: string) {
    const versions =
      await this.pricingService.getUpcomingScheduledVersions(farmId);

    return {
      data: versions,
      meta: {
        total: versions.length,
        nextActivation: versions[0]?.effectiveDate ?? null,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CANCEL SCHEDULED VERSION
  // ───────────────────────────────────────────────────────────────────────────

  @Patch('/:tierId/cancel-scheduled')
  async cancelScheduledVersion(
    @Param('farmId') farmId: string,
    @Param('tierId') tierId: string,
    @Body() body: { reason: string },
    @Req() req: RequestWithUser,
  ) {
    await this.pricingService.cancelScheduledVersion(
      tierId,
      req.user.id,
      body.reason,
    );

    return {
      success: true,
      message: `✅ Scheduled version cancelled: ${body.reason}`,
    };
  }
}