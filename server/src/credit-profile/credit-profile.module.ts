import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditProfileController } from './credit-profile.controller';
import { CreditProfileService } from './credit-profile.service';
import { CreditProfile } from './entities/credit-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreditProfile])],
  controllers: [CreditProfileController],
  providers: [CreditProfileService],
  exports: [CreditProfileService],
})
export class CreditProfileModule {}
