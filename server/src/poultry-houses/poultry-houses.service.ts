import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PoultryHouse } from './entities/poultry-house.entity';
import { DEFAULT_MINIMUM_REST_DAYS, HouseStatus } from './enums';
import {
  CreatePoultryHouseDto,
  UpdateHouseStatusDto,
  UpdatePoultryHouseDto,
} from './dto/poultry-house.dto';

@Injectable()
export class PoultryHousesService {
  constructor(
    @InjectRepository(PoultryHouse)
    private readonly houseRepo: Repository<PoultryHouse>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════
  // FARMER-FACING CRUD
  // ═══════════════════════════════════════════════════════════════════════

  async createHouse(
    farmId: string,
    dto: CreatePoultryHouseDto,
  ): Promise<PoultryHouse> {
    const house = this.houseRepo.create({
      ...dto,
      farmId,
      minimumRestDays: dto.minimumRestDays ?? DEFAULT_MINIMUM_REST_DAYS,
      status: HouseStatus.AVAILABLE,
      totalFlocksHosted: 0,
    });
    return this.houseRepo.save(house);
  }

  async getHouses(
    farmId: string,
    status?: HouseStatus,
  ): Promise<PoultryHouse[]> {
    return this.houseRepo.find({
      where: { farmId, ...(status ? { status } : {}) },
      order: { name: 'ASC' },
    });
  }

  async getHouse(houseId: string, farmId?: string): Promise<PoultryHouse> {
    const house = await this.houseRepo.findOne({ where: { id: houseId } });
    if (!house) {
      throw new NotFoundException(`Poultry house ${houseId} not found`);
    }
    if (farmId && house.farmId !== farmId) {
      throw new ForbiddenException(
        'This house does not belong to the specified farm',
      );
    }
    return house;
  }

  async updateHouse(
    houseId: string,
    farmId: string,
    dto: UpdatePoultryHouseDto,
  ): Promise<PoultryHouse> {
    const house = await this.getHouse(houseId, farmId);

    // Shrinking design capacity mid-batch is how you end up with more birds
    // than the house can actually hold — block it while occupied.
    if (
      dto.capacity !== undefined &&
      dto.capacity < house.capacity &&
      house.status === HouseStatus.OCCUPIED
    ) {
      throw new BadRequestException(
        'Cannot reduce capacity while this house holds an active flock',
      );
    }

    Object.assign(house, dto);
    return this.houseRepo.save(house);
  }

  /**
   * The only manual status transitions a farmer makes: putting a house into
   * or out of maintenance, or retiring it. Occupancy itself is never set
   * here — see markOccupied/markVacated below.
   */
  async updateStatus(
    houseId: string,
    farmId: string,
    dto: UpdateHouseStatusDto,
  ): Promise<PoultryHouse> {
    const house = await this.getHouse(houseId, farmId);

    if (house.status === HouseStatus.OCCUPIED) {
      throw new ConflictException(
        `House "${house.name}" currently holds an active flock — close the flock before changing its status`,
      );
    }

    house.status = dto.status as unknown as HouseStatus;
    house.statusReason = dto.reason ?? null;
    return this.houseRepo.save(house);
  }

  /**
   * A house that has ever hosted a flock carries production history that
   * other records point back to — deleting it would silently orphan or
   * cascade-delete that history. Only a house that was created by mistake
   * and never used can actually be removed; anything else gets decommissioned
   * through updateStatus() instead, which keeps the record but takes it out
   * of rotation.
   */
  async deleteHouse(houseId: string, farmId: string): Promise<void> {
    const house = await this.getHouse(houseId, farmId);

    if (house.totalFlocksHosted > 0) {
      throw new ConflictException(
        `House "${house.name}" has hosted ${house.totalFlocksHosted} flock(s) and can't be deleted — ` +
          `use the decommission status instead to preserve its production history`,
      );
    }

    await this.houseRepo.remove(house);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INTEGRATION POINTS FOR FlockModule
  // These are the only two places house occupancy changes. FlockService
  // calls assertAvailableForPlacement() before creating a flock, then
  // markOccupied() right after; and markVacated() when a flock closes.
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Enforces every rule about whether a flock can actually go into this
   * house right now: not decommissioned, not under repair, not already
   * holding a flock, and — critically — not still inside its post-flock
   * biosecurity rest period. Throws with a clear reason if any rule fails;
   * returns the house if placement is safe.
   */
  async assertAvailableForPlacement(houseId: string): Promise<PoultryHouse> {
    const house = await this.getHouse(houseId);

    if (house.status === HouseStatus.DECOMMISSIONED) {
      throw new BadRequestException(
        `House "${house.name}" is decommissioned and can't receive flocks`,
      );
    }
    if (house.status === HouseStatus.MAINTENANCE) {
      throw new BadRequestException(
        `House "${house.name}" is under maintenance`,
      );
    }
    if (house.status === HouseStatus.OCCUPIED) {
      throw new ConflictException(
        `House "${house.name}" already holds an active flock`,
      );
    }
    if (!house.isRestComplete) {
      throw new ConflictException(
        `House "${house.name}" is still resting — ${house.daysRemainingInRest} day(s) left ` +
          `of its ${house.minimumRestDays}-day biosecurity downtime before it's safe to restock`,
      );
    }

    return house;
  }

  /** Called immediately after FlockService creates a flock in this house */
  async markOccupied(
    houseId: string,
    flockId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(PoultryHouse) : this.houseRepo;

    const house = await repo.findOne({
      where: { id: houseId },
    });

    if (!house) {
      throw new NotFoundException(`Poultry house ${houseId} not found`);
    }

    house.status = HouseStatus.OCCUPIED;
    house.currentFlockId = flockId;
    house.totalFlocksHosted += 1;

    await repo.save(house);
  }

  /** Called when FlockService closes a flock — starts the rest-period clock */
  async markVacated(houseId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(PoultryHouse) : this.houseRepo;

    const house = await repo.findOne({
      where: { id: houseId },
    });

    if (!house) {
      throw new NotFoundException(`Poultry house ${houseId} not found`);
    }

    house.status = HouseStatus.AVAILABLE;
    house.currentFlockId = null;
    house.lastDepopulatedAt = new Date();

    await repo.save(house);
  }
}
