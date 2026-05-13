// health-event/services/vaccination.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Vaccination } from '../entities/vaccination.entity';
import { AnimalType } from '../entities/health-event.entity';
import { CreateVaccinationDto } from '../dto/vaccination.dto';



@Injectable()
export class VaccinationService {
  private readonly logger = new Logger(VaccinationService.name);

  constructor(
    @InjectRepository(Vaccination)
    private readonly vaccinationRepo: Repository<Vaccination>,
  ) {}

  async recordVaccination(dto: CreateVaccinationDto): Promise<Vaccination> {
    const vaccination = this.vaccinationRepo.create(dto);
    return this.vaccinationRepo.save(vaccination);
  }

  async getAnimalVaccinationHistory(
    animalType: AnimalType,
    animalId: string,
  ): Promise<Vaccination[]> {
    return this.vaccinationRepo.find({
      where: { animalType, animalId },
      order: { administeredDate: 'DESC' },
    });
  }

  async getUpcomingBoosters(farmId: string, daysAhead: number = 30): Promise<Vaccination[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    return this.vaccinationRepo.find({
      where: {
        farmId,
        nextBoosterDue: Between(today, futureDate),
      },
      order: { nextBoosterDue: 'ASC' },
    });
  }

  async getDueVaccinations(farmId: string, animalType?: AnimalType): Promise<Vaccination[]> {
    const today = new Date();

    const where: any = {
      farmId,
      nextBoosterDue: Between(new Date(1900, 0, 1), today),
    };

    if (animalType) {
      where.animalType = animalType;
    }

    return this.vaccinationRepo.find({
      where,
      order: { nextBoosterDue: 'ASC' },
    });
  }

  async getAnimalsNeedingVaccination(
    vaccineName: string,
    farmId: string,
  ): Promise<string[]> {
    // Find all animals that have been vaccinated for this vaccine
    const existingVaccinations = await this.vaccinationRepo.find({
      where: {
        farmId,
        vaccineName,
      },
    });

    // Get animals whose immunity has expired
    const today = new Date();
    const expired = existingVaccinations.filter(
      (v) => v.immunityExpiresAt && new Date(v.immunityExpiresAt) < today,
    );

    // Also include animals that never got the vaccine
    // This requires querying the animal tables - implement as needed

    return expired.map((v) => v.animalId);
  }
}