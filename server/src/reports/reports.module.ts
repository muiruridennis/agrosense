import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PdfService } from './pdf.service';
import { RecordsModule } from '../records/records.module';
import { FarmsModule } from '../farms/farms.module';
import { CropsModule } from '../crops/crops.module';

@Module({
  imports: [RecordsModule, FarmsModule, CropsModule],
  providers: [ReportsService, PdfService],
  controllers: [ReportsController],
})
export class ReportsModule {}
