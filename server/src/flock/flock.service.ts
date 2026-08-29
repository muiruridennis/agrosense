import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  Repository,
} from 'typeorm';

import { Flock } from './entities/flock.entity';
import { FlockStage, FlockStatus } from './enums';

import {
  CloseFlockDto,
  CreateFlockDto,
  UpdateFlockDto,
} from './dtos/flock.dto';

import { PoultryHousesService } from '../poultry-houses/poultry-houses.service';

@Injectable()
export class FlockService {
  constructor(
    @InjectRepository(Flock)
    private readonly flockRepo: Repository<Flock>,

    private readonly poultryHousesService: PoultryHousesService,

    private readonly dataSource: DataSource,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════════════════════

  async createFlock(
    farmId: string,
    houseId: string,
    dto: CreateFlockDto,
  ): Promise<Flock> {
    // This simultaneously verifies:
    // 1. house exists
    // 2. house belongs to farm
    const house = await this.poultryHousesService.getHouse(
      houseId,
      farmId,
    );

    // Verifies:
    // - not occupied
    // - not under maintenance
    // - not decommissioned
    // - rest period completed
    await this.poultryHousesService.assertAvailableForPlacement(
      house.id,
    );

    // Capacity is a house-level invariant and belongs here because
    // we're placing a flock into the house.
    if (dto.initialCount > house.capacity) {
      throw new BadRequestException(
        `Flock contains ${dto.initialCount} birds, but house "${house.name}" ` +
          `has a capacity of ${house.capacity}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const flockRepo = manager.getRepository(Flock);

      const flock = flockRepo.create({
        houseId: house.id,

        name: dto.name?.trim() || null,

        type: dto.type,
        breed: dto.breed.trim(),

        status: FlockStatus.ACTIVE,
        stage: dto.stage ?? FlockStage.PLACED,

        initialCount: dto.initialCount,
        currentCount: dto.initialCount,

        placementDate: new Date(dto.placementDate),

        ageAtPlacementWeeks:
          dto.ageAtPlacementWeeks ?? 0,

        notes: dto.notes?.trim() || null,
      });

      const savedFlock = await flockRepo.save(flock);

      // Both flock creation and house occupancy happen
      // inside the same transaction.
      await this.poultryHousesService.markOccupied(
        house.id,
        savedFlock.id,
        manager,
      );

      return savedFlock;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READ MANY
  // ═══════════════════════════════════════════════════════════════════════

  async getFlocks(
    farmId: string,
    status?: FlockStatus,
  ): Promise<Flock[]> {
    const houses =
      await this.poultryHousesService.getHouses(farmId);

    const houseIds = houses.map((house) => house.id);

    if (!houseIds.length) {
      return [];
    }

    const query = this.flockRepo
      .createQueryBuilder('flock')
      .leftJoinAndSelect('flock.house', 'house')
      .where('flock.houseId IN (:...houseIds)', {
        houseIds,
      });

    if (status) {
      query.andWhere('flock.status = :status', {
        status,
      });
    }

    return query
      .orderBy('flock.placementDate', 'DESC')
      .getMany();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // READ ONE
  // ═══════════════════════════════════════════════════════════════════════

  async getFlock(
    flockId: string,
    farmId?: string,
  ): Promise<Flock> {
    const flock = await this.flockRepo.findOne({
      where: {
        id: flockId,
      },
      relations: {
        house: true,
      },
    });

    if (!flock) {
      throw new NotFoundException(
        `Flock ${flockId} not found`,
      );
    }

    if (
      farmId &&
      flock.house.farmId !== farmId
    ) {
      throw new ForbiddenException(
        'This flock does not belong to the specified farm',
      );
    }

    return flock;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // POPULATION
  // ═══════════════════════════════════════════════════════════════════════

  async adjustPopulation(
    flockId: string,
    delta: number,
    manager?: EntityManager,
  ): Promise<Flock> {
    const repo = manager
      ? manager.getRepository(Flock)
      : this.flockRepo;

    const flock = await repo.findOne({
      where: {
        id: flockId,
      },
    });

    if (!flock) {
      throw new NotFoundException(
        `Flock ${flockId} not found`,
      );
    }

    const newCount =
      flock.currentCount + delta;

    if (newCount < 0) {
      throw new BadRequestException(
        'Population cannot be reduced below zero',
      );
    }

    flock.currentCount = newCount;

    return repo.save(flock);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════════════════════════════════

  async updateFlock(
    flockId: string,
    farmId: string,
    dto: UpdateFlockDto,
  ): Promise<Flock> {
    const flock = await this.getFlock(
      flockId,
      farmId,
    );

    this.assertEditable(flock);

    if (dto.name !== undefined) {
      flock.name =
        dto.name.trim() || null;
    }

    if (dto.breed !== undefined) {
      flock.breed =
        dto.breed.trim();
    }

    if (dto.type !== undefined) {
      flock.type = dto.type;
    }

    if (dto.placementDate !== undefined) {
      flock.placementDate =
        new Date(dto.placementDate);
    }

    if (dto.ageAtPlacementWeeks !== undefined) {
      flock.ageAtPlacementWeeks =
        dto.ageAtPlacementWeeks;
    }

    if (dto.notes !== undefined) {
      flock.notes =
        dto.notes.trim() || null;
    }

    return this.flockRepo.save(flock);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE
  // ═══════════════════════════════════════════════════════════════════════

  async updateStage(
    flockId: string,
    farmId: string,
    stage: FlockStage,
  ): Promise<Flock> {
    const flock = await this.getFlock(
      flockId,
      farmId,
    );

    if (flock.status === FlockStatus.CLOSED) {
      throw new ConflictException(
        'A closed flock cannot change stage',
      );
    }

    flock.stage = stage;

    return this.flockRepo.save(flock);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SUSPEND
  // ═══════════════════════════════════════════════════════════════════════

  async suspendFlock(
    flockId: string,
    farmId: string,
  ): Promise<Flock> {
    const flock = await this.getFlock(
      flockId,
      farmId,
    );

    if (flock.status === FlockStatus.CLOSED) {
      throw new ConflictException(
        'A closed flock cannot be suspended',
      );
    }

    if (flock.status === FlockStatus.SUSPENDED) {
      throw new ConflictException(
        'Flock is already suspended',
      );
    }

    flock.status = FlockStatus.SUSPENDED;

    return this.flockRepo.save(flock);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REACTIVATE
  // ═══════════════════════════════════════════════════════════════════════

  async reactivateFlock(
    flockId: string,
    farmId: string,
  ): Promise<Flock> {
    const flock = await this.getFlock(
      flockId,
      farmId,
    );

    if (flock.status === FlockStatus.CLOSED) {
      throw new ConflictException(
        'A closed flock cannot be reactivated',
      );
    }

    if (flock.status === FlockStatus.ACTIVE) {
      throw new ConflictException(
        'Flock is already active',
      );
    }

    flock.status = FlockStatus.ACTIVE;

    return this.flockRepo.save(flock);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CLOSE
  // ═══════════════════════════════════════════════════════════════════════

  async closeFlock(
    flockId: string,
    farmId: string,
    dto: CloseFlockDto,
  ): Promise<Flock> {
    const flock = await this.getFlock(
      flockId,
      farmId,
    );

    if (flock.status === FlockStatus.CLOSED) {
      throw new ConflictException(
        'Flock is already closed',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const flockRepo =
        manager.getRepository(Flock);

      flock.status = FlockStatus.CLOSED;
      flock.closedAt = new Date();

      flock.closureReason =
        dto.reason?.trim() || null;

      const savedFlock =
        await flockRepo.save(flock);

      await this.poultryHousesService.markVacated(
        flock.houseId,
        manager,
      );

      return savedFlock;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DELETE
  // ═══════════════════════════════════════════════════════════════════════

  async deleteFlock(
    flockId: string,
    farmId: string,
  ): Promise<void> {
    const flock = await this.getFlock(
      flockId,
      farmId,
    );

    if (flock.status !== FlockStatus.CLOSED) {
      throw new ConflictException(
        'Only closed flocks can be deleted',
      );
    }

    await this.flockRepo.remove(flock);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE
  // ═══════════════════════════════════════════════════════════════════════

  private assertEditable(
    flock: Flock,
  ): void {
    if (flock.status === FlockStatus.CLOSED) {
      throw new ConflictException(
        'A closed flock cannot be modified',
      );
    }
  }
}