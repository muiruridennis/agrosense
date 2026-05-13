import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmMembersModule } from '../farm-members/farm-members.module';
import { InventoryModule } from '../inventory/inventory.module';
import { FinanceModule } from '../finance/finance.module';

// Entities
import { HealthEvent } from './entities/health-event.entity';
import { Treatment } from './entities/treatment.entity';
import { Diagnostic } from './entities/diagnostic.entity';
import { Withdrawal } from './entities/withdrawal.entity';
import { Quarantine } from './entities/quarantine.entity';
import { Vaccination } from './entities/vaccination.entity';
import { FlockOutbreak } from './entities/flock-outbreak.entity';

// Services
import { HealthEventService } from './services/health-event.service';
import { HealthOrchestratorService } from './services/health-orchestrator.service';
import { VaccinationService } from './services/vaccination.service';
import { FlockOutbreakService } from './services/flock-outbreak.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HealthEvent,
      Treatment,
      Diagnostic,
      Withdrawal,
      Quarantine,
      Vaccination,
      FlockOutbreak,
    ]),
    FarmMembersModule,
    InventoryModule,   // For auto-consuming medications
    FinanceModule,     // For auto-creating cost entries
  ],
  providers: [
    HealthEventService,
    HealthOrchestratorService,
    VaccinationService,
    FlockOutbreakService,
  ],
  exports: [
    HealthEventService,
    HealthOrchestratorService,
    VaccinationService,
    FlockOutbreakService,
  ],
})
export class HealthEventModule {}