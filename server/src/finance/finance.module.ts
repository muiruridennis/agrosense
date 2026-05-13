import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { BudgetLine, CashFlowForecast, CostEntry, FinancialSummary, ProductionMetrics, RevenueEntry } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { FinanceController } from './finance.controller';
import { FarmMembersModule } from '../farm-members/farm-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CostEntry,
      RevenueEntry,
      FinancialSummary,
      ProductionMetrics,
      CashFlowForecast,
      BudgetLine,
    ]),
    FarmMembersModule
  ],
  providers: [FinanceService],
  controllers: [FinanceController],
  exports: [FinanceService],
})
export class FinanceModule {}
