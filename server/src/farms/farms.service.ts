import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateFarmDto, UpdateFarmDto } from './dto/create-farm.dto';
import { Farm } from './entities/farm.entity';
import { FarmMembersService } from '../farm-members/farm-members.service';
import { PostgresErrorCode } from '../database/postgresErrorCodes.enum';

@Injectable()
export class FarmsService {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => FarmMembersService)) // ✅ Use forwardRef
    private readonly farmMembersService: FarmMembersService,
  ) {}

  async create(ownerId: string, dto: CreateFarmDto): Promise<Farm> {
  const queryRunner =
    this.farmRepository.manager.connection.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const owner = await this.usersService.getById(ownerId);

    const farm = queryRunner.manager.create(Farm, {
      ...dto,
      ownerId: owner.id,
      timezone: dto.timezone ?? 'UTC',
      geoPoint: dto.location
        ? {
            type: 'Point',
            coordinates: [dto.location.longitude, dto.location.latitude],
          }
        : null,
    });

    const savedFarm = await queryRunner.manager.save(farm);

    await this.farmMembersService.addOwnerAsMember(
      savedFarm.id,
      ownerId,
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

  async findAllByOwner(ownerId: string): Promise<Farm[]> {
    return this.farmRepository.find({
      where: { ownerId },
      relations: [
        'plots',
        'plots.cropCycles',
        'cows',
        'poultryHouses',
        'ruminants',
        'stockItems',
        'members',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id },
      relations: ['plots'],
    });
    if (!farm) throw new NotFoundException(`Farm ${id} not found`);
    if (farm.ownerId !== ownerId) throw new ForbiddenException();
    return farm;
  }

  async update(id: string, ownerId: string, dto: UpdateFarmDto): Promise<Farm> {
    const farm = await this.findOne(id, ownerId);

    if (dto.location) {
      farm.geoPoint = {
        type: 'Point',
        coordinates: [dto.location.longitude, dto.location.latitude],
      };
    }

    const { location: _l, ...rest } = dto as any;
    Object.assign(farm, rest);
    return this.farmRepository.save(farm);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const farm = await this.findOne(id, ownerId);
    await this.farmRepository.remove(farm);
  }

  async transferOwnership(
    id: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<Farm> {
    const farm = await this.findOne(id, currentOwnerId);
    farm.ownerId = newOwnerId;
    return this.farmRepository.save(farm);
  }

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
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
        { lng: longitude, lat: latitude, radius: radiusKm * 1000 },
      )
      .getMany();
  }
}
