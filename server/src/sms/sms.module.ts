// sms/sms.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { AfricasTalkingProvider } from './providers/africas-talking.provider';
import { SMS_PROVIDER } from './sms.constants';

@Module({
  imports: [HttpModule],
  providers: [
    SmsService,
    AfricasTalkingProvider,
    {
      provide: SMS_PROVIDER,
      useClass: AfricasTalkingProvider,
    },
  ],
  controllers: [SmsController],
  exports: [SmsService],
})
export class SmsModule {}