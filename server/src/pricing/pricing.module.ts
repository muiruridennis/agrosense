// pricing/pricing.module.ts
import {  Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PricingTier } from './entities/pricing-tier.entity';
import { PricingHistory } from './entities/pricing-history.entity';
import { RecordPricingSnapshot } from './entities/record-pricing-snapshot.entity';
import { BullModule } from '@nestjs/bull';
import { PRICING_QUEUE } from '../jobs/jobs.constants';

@Module({
  imports: [TypeOrmModule.forFeature([PricingTier, PricingHistory, RecordPricingSnapshot]),
      BullModule.registerQueue({ name: PRICING_QUEUE }), // ← Register queue directly

],
  providers: [PricingService],
  controllers: [PricingController],
  exports: [PricingService], // Export so PoultryService can inject it
})
export class PricingModule {}