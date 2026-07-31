import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlag } from './entities/feature-flag.entity';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flag.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureFlag])],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
  // Exported so JobsModule (NotificationsProcessor) and anywhere else that
  // needs isEnabled() checks can import this module and inject the service.
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}