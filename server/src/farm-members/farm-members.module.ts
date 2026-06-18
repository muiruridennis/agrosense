import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmMember } from './entities/farm-member.entity';
import { FarmInvitation } from './entities/farm-invitation.entity';
import { FarmMembersService } from './farm-members.service';
import {
  FarmMembersController,
  FarmInvitationsController,
  UserFarmController,
} from './farm-members.controller';
import { UsersModule } from '../users/users.module';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FarmMember, FarmInvitation]),
    forwardRef(() => FarmsModule), // ✅ Wrap with forwardRef
    UsersModule,
  ],
  controllers: [
    FarmMembersController,
    FarmInvitationsController,
    UserFarmController,
  ],
  providers: [FarmMembersService],
  exports: [FarmMembersService],
})
export class FarmMembersModule {}
