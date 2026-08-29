import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UsersService } from '../users/users.service';
import { FarmMembersService } from '../farm-members/farm-members.service';
import { PostgresErrorCode } from '../database/postgresErrorCodes.enum';

import { CreateFarmDto, UpdateFarmDto } from './dto/create-farm.dto';
import { Farm } from './entities/farm.entity';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,

    private readonly usersService: UsersService,

    @Inject(forwardRef(() => FarmMembersService))
    private readonly farmMembersService: FarmMembersService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────

  async create(ownerId: string, dto: CreateFarmDto): Promise<Farm> {
    const queryRunner =
      this.farmRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const owner = await this.usersService.getById(ownerId);

      const farm = queryRunner.manager.create(Farm, {
        name: dto.name,
        description: dto.description ?? null,

        areaHectares: dto.areaHectares ?? null,

        country: dto.country,
        region: dto.region,
        subRegion: dto.subRegion ?? null,

        timezone: dto.timezone ?? 'Africa/Nairobi',

        ownerId: owner.id,

        geoPoint: dto.location
          ? {
              type: 'Point',
              coordinates: [dto.location.longitude, dto.location.latitude],
            }
          : null,

        boundary: dto.boundary ?? null,
      });

      const savedFarm = await queryRunner.manager.save(Farm, farm);

      /*
       * Farm creation and owner membership must succeed together.
       */
      await this.farmMembersService.addOwnerAsMember(
        savedFarm.id,
        ownerId,
        queryRunner,
      );

      await queryRunner.commitTransaction();

      return savedFarm;
    } catch (err: any) {
      await queryRunner.rollbackTransaction();

      if (err?.code === PostgresErrorCode.UniqueViolation) {
        throw new ConflictException(
          'You already have a farm with this name. Please choose a different name.',
        );
      }

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────────────

  async findAllByOwner(ownerId: string): Promise<Farm[]> {
    return this.farmRepository.find({
      where: {
        ownerId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: {
        id,
      },
    });

    if (!farm) {
      throw new NotFoundException(`Farm ${id} not found`);
    }

    if (farm.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have access to this farm');
    }

    return farm;
  }

  async findOneById(id: string): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: {
        id,
      },
    });

    if (!farm) {
      throw new NotFoundException(`Farm ${id} not found`);
    }

    return farm;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  async update(id: string, ownerId: string, dto: UpdateFarmDto): Promise<Farm> {
    const farm = await this.findOne(id, ownerId);

    const { location, boundary, ...farmData } = dto;

    Object.assign(farm, farmData);

    if (location) {
      farm.geoPoint = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      };
    }

    if (boundary !== undefined) {
      farm.boundary = {
        type: 'Polygon',
        coordinates: boundary.coordinates,
      };
    }

    return this.farmRepository.save(farm);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────

  async remove(id: string, ownerId: string): Promise<void> {
    const farm = await this.findOne(id, ownerId);

    await this.farmRepository.remove(farm);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // OWNERSHIP
  // ─────────────────────────────────────────────────────────────────────────

  async transferOwnership(
    id: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<Farm> {
    const farm = await this.findOne(id, currentOwnerId);

    /*
     * Don't allow transferring to a non-existent user.
     */
    await this.usersService.getById(newOwnerId);

    farm.ownerId = newOwnerId;

    return this.farmRepository.save(farm);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GEOLOCATION
  // ─────────────────────────────────────────────────────────────────────────

  async findNearbyFarms(
    longitude: number,
    latitude: number,
    radiusKm: number,
  ): Promise<Farm[]> {
    return this.farmRepository
      .createQueryBuilder('farm')
      .where(
        `ST_DWithin(
          farm."geoPoint"::geography,
          ST_SetSRID(
            ST_MakePoint(:longitude, :latitude),
            4326
          )::geography,
          :radius
        )`,
        {
          longitude,
          latitude,
          radius: radiusKm * 1000,
        },
      )
      .getMany();
  }
}
