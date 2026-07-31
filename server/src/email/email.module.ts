// email/email.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailTemplateService } from './templates/email-template.service';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { EmailLog } from './entities/email-log.entity';
import { EmailAttachment } from './entities/email-attachment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailLog, EmailAttachment]),
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailTemplateService,
    {
      provide: 'EMAIL_PROVIDER',
      useClass: NodemailerProvider,
    },
  ],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}
