// src/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { IntegrationService } from './integration.service';
import { PoultryModule } from '../poultry/poultry.module';

@Module({
  imports: [FinanceModule, InventoryModule, PoultryModule],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationsModule {}