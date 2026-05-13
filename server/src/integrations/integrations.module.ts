// src/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryFinanceIntegrationService } from './inventory-finance.integration.service';

@Module({
  imports: [FinanceModule, InventoryModule],
  providers: [InventoryFinanceIntegrationService],
  exports: [InventoryFinanceIntegrationService],
})
export class IntegrationsModule {}