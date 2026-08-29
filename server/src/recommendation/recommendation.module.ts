
import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { InsightModule } from '../insight/insight.module';
import { FlockModule } from '../flock/flock.module';
import { FarmMembersModule } from '../farm-members/farm-members.module';


@Module({
  imports: [
    InsightModule, 
    FlockModule,
    FarmMembersModule
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
