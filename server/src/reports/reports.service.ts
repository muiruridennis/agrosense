import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PdfService } from './pdf.service';
import { RecordsService } from '../records/records.service';
import { FarmsService } from '../farms/farms.service';
import { User } from '../users/entities/user.entity';
import { CropCyclesService } from '../crops/crops.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly recordsService: RecordsService,
    private readonly farmsService: FarmsService,
    private readonly cropCyclesService: CropCyclesService,
  ) {}

  async generateSeasonPdf(
    farmId: string,
    owner: User,
    fromDate: string,
    toDate: string,
  ): Promise<Buffer> {
    const farm = await this.farmsService.findOne(farmId, owner.id);

    const [summary, cropSummary] = await Promise.all([
      this.recordsService.getSeasonSummary(farmId, owner.id, fromDate, toDate),
      this.cropCyclesService.getSummaryByFarm(farmId, owner.id),
    ]);

    const pdfData = {
      farmName: farm.name,
      ownerName: owner.fullName,
      fromDate,
      toDate,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netProfit: summary.netProfit,
      currency: 'KES',
      breakdown: summary.breakdown,
      cropSummary: cropSummary.map((c: any) => ({
        cropType: c.cropType,
        status: c.status,
        count: Number(c.count),
        totalYieldKg: Number(c.totalYieldKg ?? 0),
      })),
    };

    return this.pdfService.generateSeasonReport(pdfData);
  }
}