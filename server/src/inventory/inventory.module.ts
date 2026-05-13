import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmsModule } from '../farms/farms.module';
import { UsersModule } from '../users/users.module';

import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { StockItem } from './entities/stock-item.entity';
import { StockPurchase } from './entities/stock-purchase.entity';
import { StockConsumption } from './entities/stock-consumption.entity';
import { StockAdjustment } from './entities/stock-adjustment.entity';
import { CurrentStock } from './entities/current-stock.entity';
import { StockAlert } from './entities/stock-alert.entity';
import { FarmMembersModule } from '../farm-members/farm-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockItem,
      StockPurchase,
      StockConsumption,
      StockAdjustment,
      CurrentStock,
      StockAlert,
    ]),
    FarmsModule,
    UsersModule,
    FarmMembersModule
  ],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule {}
