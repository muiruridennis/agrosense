import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from './entities/farm.entity';
import { FarmsService } from './farms.service';
import { FarmsController } from './farms.controller';
import { FarmOwnerGuard } from '../common/guards/farm-owner.guard';
import { UsersModule } from '../users/users.module';
import { PlotsModule } from '../plots/plots.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farm]),
    UsersModule,
    forwardRef(() => FarmMembersModule),
    forwardRef(() => PlotsModule),
  ],
  providers: [FarmsService, FarmOwnerGuard],
  controllers: [FarmsController],
  exports: [FarmsService, FarmOwnerGuard],
})
export class FarmsModule {}
