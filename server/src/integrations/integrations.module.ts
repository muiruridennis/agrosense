// src/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { IntegrationService } from './integration.service';

@Module({
  imports: [FinanceModule, InventoryModule],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationsModule {}