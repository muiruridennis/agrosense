import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InAppNotification } from './entities/inapp-notification.entity';
import { InAppService } from './inapp.service';

@Module({
  imports: [TypeOrmModule.forFeature([InAppNotification])],
  providers: [ InAppService],
  exports: [InAppService],
})
export class InAppModule {}