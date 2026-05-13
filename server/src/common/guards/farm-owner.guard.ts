import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from '../../farms/entities/farm.entity';

@Injectable()
export class FarmOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const farmId = request.params.farmId ?? request.params.id;

    if (!farmId) return true; // no farm-scoped route

    const farm = await this.farmRepo.findOne({
      where: { id: farmId },
      select: ['id', 'ownerId'],
    });

    if (!farm) throw new NotFoundException(`Farm ${farmId} not found`);

    if (farm.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this farm');
    }

    request.farm = farm;
    return true;
  }
}