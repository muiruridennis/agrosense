import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CropCycle } from './entities/crop-cycle.entity';
import { CropCyclesService } from './crops.service';
import { FarmsModule } from '../farms/farms.module';
import { PlotsModule } from '../plots/plots.module';
import { CropCyclesController } from './crops.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CropCycle]), FarmsModule, forwardRef(() => PlotsModule),],
  providers: [CropCyclesService],
  controllers: [CropCyclesController],
  exports: [CropCyclesService],
})
export class CropsModule {}
