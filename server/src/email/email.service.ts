// email/email.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import type { EmailProvider } from './providers/email-provider.interface';
import { EmailLog } from './entities/email-log.entity';
import { EmailAttachment } from './entities/email-attachment.entity';
import { EmailTemplateService } from './templates/email-template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject('EMAIL_PROVIDER')
    private readonly provider: EmailProvider,
    @InjectRepository(EmailLog)
    private readonly emailLogRepo: Repository<EmailLog>,
    @InjectRepository(EmailAttachment)
    private readonly attachmentRepo: Repository<EmailAttachment>,
    private readonly templateService: EmailTemplateService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // SEND EMAIL
  // ──────────────────────────────────────────────────────────────────────────

  async send(data: {
    to: string | string[];
    subject: string;
    body?: string;
    html?: string;
    from?: string;
    fromName?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
      filename: string;
      content?: string | Buffer;
      path?: string;
      contentType?: string;
    }>;
    replyTo?: string | string[];
    headers?: Record<string, string>;
    saveLog?: boolean;
    referenceId?: string;
    referenceType?: string;
    userId?: string;
    farmId?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    messageId?: string;
    status: 'sent' | 'queued' | 'failed';
    response?: any;
  }> {
    try {
      // Create log entry if saveLog is true
      let log: EmailLog | null = null;
      if (data.saveLog !== false) {
        log = await this.createLogEntry(data);
      }

      // Send email via provider
      const result = await this.provider.sendEmail({
        to: data.to,
        subject: data.subject,
        body: data.body,
        html: data.html,
        from: data.from,
        fromName: data.fromName,
        cc: data.cc,
        bcc: data.bcc,
        attachments: data.attachments,
        replyTo: data.replyTo,
        headers: data.headers,
      });

      // Update log with success
      if (log) {
        await this.updateLogEntry(log.id, {
          status: 'sent',
          messageId: result.messageId,
          sentAt: new Date(),
        });
      }

      this.logger.log(`📧 Email sent successfully: ${result.messageId}`);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Email failed: ${message}`);

      // Update log with failure
      const latestLog = await this.emailLogRepo.findOne({
        where: { status: 'pending' },
        order: { createdAt: 'DESC' },
      });

      if (latestLog) {
        await this.updateLogEntry(latestLog.id, {
          status: 'failed',
          error: message,
        });
      }

      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SEND TEMPLATE EMAIL
  // ──────────────────────────────────────────────────────────────────────────

  async sendTemplate(data: {
    to: string | string[];
    templateId: string;
    templateData: Record<string, any>;
    subject?: string;
    from?: string;
    fromName?: string;
    cc?: string | string[];
    bcc?: string | string[];
    saveLog?: boolean;
    referenceId?: string;
    referenceType?: string;
    userId?: string;
    farmId?: string;
  }): Promise<{
    messageId?: string;
    status: 'sent' | 'queued' | 'failed';
    response?: any;
  }> {
    try {
      // Create log entry
      let log: EmailLog | null = null;
      if (data.saveLog !== false) {
        log = await this.createLogEntry({
          ...data,
          subject: data.subject || 'Template Email',
        });
      }

      // Render template to HTML based on templateId
      let html: string;
      switch (data.templateId) {
        case 'disease-alert':
          html = this.templateService.renderDiseaseAlert(
            data.templateData as any,
          );
          break;
        case 'daily-digest':
          html = this.templateService.renderDailyDigest(
            data.templateData as any,
          );
          break;
        case 'vaccination-reminder':
          html = this.templateService.renderVaccinationReminder(
            data.templateData as any,
          );
          break;
        case 'welcome':
          html = this.templateService.renderWelcome(data.templateData as any);
          break;
        case 'temperature-alert':
          html = this.templateService.renderTemperatureAlert(
            data.templateData as any,
          );
          break;
        case 'low-stock-alert':
          html = this.templateService.renderLowStockAlert(
            data.templateData as any,
          );
          break;
        case 'generic':
          html = this.templateService.renderGeneric(data.templateData as any);
          break;
        default:
          throw new Error(`Unknown template: ${data.templateId}`);
      }

      // Send via provider with rendered HTML
      const result = await this.provider.sendTemplateEmail({
        to: data.to,
        subject: data.subject || 'Template Email',
        html: html,
        from: data.from,
        fromName: data.fromName,
        cc: data.cc,
        bcc: data.bcc,
      });

      // Update log
      if (log) {
        await this.updateLogEntry(log.id, {
          status: 'sent',
          messageId: result.messageId,
          sentAt: new Date(),
        });
      }

      this.logger.log(`📧 Template email sent: ${result.messageId}`);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Template email failed: ${message}`);

      const latestLog = await this.emailLogRepo.findOne({
        where: { status: 'pending' },
        order: { createdAt: 'DESC' },
      });

      if (latestLog) {
        await this.updateLogEntry(latestLog.id, {
          status: 'failed',
          error: message,
        });
      }

      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SEND BULK EMAILS
  // ──────────────────────────────────────────────────────────────────────────

  async sendBulk(data: {
    to: string[];
    subject: string;
    body?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content?: string | Buffer;
      path?: string;
      contentType?: string;
    }>;
    saveLog?: boolean;
    referenceId?: string;
    referenceType?: string;
    userId?: string;
    farmId?: string;
  }): Promise<{
    success: number;
    failed: number;
    results: Array<{
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }> {
    const results: Array<{
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];
    let success = 0;
    let failed = 0;

    // Send in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < data.to.length; i += batchSize) {
      const batch = data.to.slice(i, i + batchSize);

      const batchPromises = batch.map(async (email) => {
        try {
          const result = await this.send({
            to: email,
            subject: data.subject,
            body: data.body,
            html: data.html,
            attachments: data.attachments,
            saveLog: data.saveLog,
            referenceId: data.referenceId,
            referenceType: data.referenceType,
            userId: data.userId,
            farmId: data.farmId,
          });

          if (result.status === 'sent') {
            success++;
            return { email, success: true, messageId: result.messageId };
          } else {
            failed++;
            return { email, success: false, error: 'Failed to send' };
          }
        } catch (error: unknown) {
          failed++;
          const message =
            error instanceof Error ? error.message : String(error);
          return { email, success: false, error: message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches
      if (i + batchSize < data.to.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return { success, failed, results };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET EMAIL LOGS
  // ──────────────────────────────────────────────────────────────────────────

  async getEmailLogs(options?: {
    referenceId?: string;
    referenceType?: string;
    status?: 'pending' | 'sent' | 'failed' | 'bounced' | 'queued';
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    farmId?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'sentAt';
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<{
    items: EmailLog[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const query = this.emailLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.attachments', 'attachments')
      .orderBy(
        `log.${options?.orderBy || 'createdAt'}`,
        options?.orderDirection || 'DESC',
      );

    if (options?.referenceId) {
      query.andWhere('log.referenceId = :referenceId', {
        referenceId: options.referenceId,
      });
    }

    if (options?.referenceType) {
      query.andWhere('log.referenceType = :referenceType', {
        referenceType: options.referenceType,
      });
    }

    if (options?.status) {
      query.andWhere('log.status = :status', { status: options.status });
    }

    if (options?.userId) {
      query.andWhere('log.userId = :userId', { userId: options.userId });
    }

    if (options?.farmId) {
      query.andWhere('log.farmId = :farmId', { farmId: options.farmId });
    }

    if (options?.startDate && options?.endDate) {
      query.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    } else if (options?.startDate) {
      query.andWhere('log.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    } else if (options?.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const [items, total] = await query
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      limit,
      offset,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET EMAIL STATS
  // ──────────────────────────────────────────────────────────────────────────

  async getEmailStats(days: number = 7): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    bounced: number;
    queued: number;
    byDay: Array<{
      date: string;
      sent: number;
      failed: number;
      total: number;
    }>;
    byType: Array<{
      referenceType: string;
      count: number;
      sent: number;
      failed: number;
    }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const logs = await this.emailLogRepo
      .createQueryBuilder('log')
      .where('log.createdAt >= :startDate', { startDate })
      .getMany();

    const total = logs.length;
    const sent = logs.filter((l) => l.status === 'sent').length;
    const failed = logs.filter((l) => l.status === 'failed').length;
    const pending = logs.filter((l) => l.status === 'pending').length;
    const bounced = logs.filter((l) => l.status === 'bounced').length;
    const queued = logs.filter((l) => l.status === 'queued').length;

    // Group by day
    const byDay: Record<
      string,
      { sent: number; failed: number; total: number }
    > = {};
    logs.forEach((log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!byDay[date]) {
        byDay[date] = { sent: 0, failed: 0, total: 0 };
      }
      byDay[date].total++;
      if (log.status === 'sent') byDay[date].sent++;
      if (log.status === 'failed') byDay[date].failed++;
    });

    const byDayArray = Object.entries(byDay).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    // Group by type
    const byType: Record<
      string,
      { count: number; sent: number; failed: number }
    > = {};
    logs.forEach((log) => {
      const type = log.referenceType || 'general';
      if (!byType[type]) {
        byType[type] = { count: 0, sent: 0, failed: 0 };
      }
      byType[type].count++;
      if (log.status === 'sent') byType[type].sent++;
      if (log.status === 'failed') byType[type].failed++;
    });

    const byTypeArray = Object.entries(byType).map(
      ([referenceType, counts]) => ({
        referenceType,
        ...counts,
      }),
    );

    return {
      total,
      sent,
      failed,
      pending,
      bounced,
      queued,
      byDay: byDayArray,
      byType: byTypeArray,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET SINGLE EMAIL LOG
  // ──────────────────────────────────────────────────────────────────────────

  async getEmailLogById(id: string): Promise<EmailLog | null> {
    return this.emailLogRepo.findOne({
      where: { id },
      relations: ['attachments'],
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RETRY FAILED EMAIL
  // ──────────────────────────────────────────────────────────────────────────

  async retryFailedEmail(id: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const log = await this.emailLogRepo.findOne({
      where: { id, status: 'failed' },
    });

    if (!log) {
      return {
        success: false,
        error: 'Email log not found or not in failed state',
      };
    }

    try {
      // Resend the email
      const result = await this.provider.sendEmail({
        to: log.to,
        subject: log.subject,
        body: log.body || undefined,
        html: log.html || undefined,
        from: log.from || undefined,
        cc: log.cc || undefined,
        bcc: log.bcc || undefined,
      });

      // Update log
      await this.updateLogEntry(log.id, {
        status: 'sent',
        messageId: result.messageId,
        sentAt: new Date(),
        retryCount: (log.retryCount || 0) + 1,
        lastRetryAt: new Date(),
        error: null,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.updateLogEntry(log.id, {
        retryCount: (log.retryCount || 0) + 1,
        lastRetryAt: new Date(),
        error: message,
      });

      return {
        success: false,
        error: message,
      };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE EMAIL LOG
  // ──────────────────────────────────────────────────────────────────────────

  async deleteEmailLog(id: string): Promise<boolean> {
    const result = await this.emailLogRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CLEANUP OLD EMAILS
  // ──────────────────────────────────────────────────────────────────────────

  async cleanupOldEmails(days: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.emailLogRepo
      .createQueryBuilder()
      .delete()
      .where('"createdAt" < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPER METHODS
  // ──────────────────────────────────────────────────────────────────────────

  private async createLogEntry(data: any): Promise<EmailLog> {
    const log = this.emailLogRepo.create({
      to: Array.isArray(data.to) ? data.to : [data.to],
      cc: data.cc ? (Array.isArray(data.cc) ? data.cc : [data.cc]) : null,
      bcc: data.bcc ? (Array.isArray(data.bcc) ? data.bcc : [data.bcc]) : null,
      subject: data.subject,
      body: data.body,
      html: data.html,
      from: data.from,
      userId: data.userId,
      farmId: data.farmId,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      metadata: data.metadata,
      status: 'pending',
      createdAt: new Date(),
    });

    return this.emailLogRepo.save(log);
  }

  private async updateLogEntry(
    id: string,
    data: {
      status?: 'pending' | 'sent' | 'failed' | 'bounced' | 'queued';
      messageId?: string;
      sentAt?: Date;
      deliveredAt?: Date;
      openedAt?: Date;
      clickedAt?: Date;
      error?: string | null;
      retryCount?: number;
      lastRetryAt?: Date;
    },
  ): Promise<void> {
    await this.emailLogRepo.update(id, {
      status: data.status,
      messageId: data.messageId,
      sentAt: data.sentAt,
      deliveredAt: data.deliveredAt,
      openedAt: data.openedAt,
      clickedAt: data.clickedAt,
      error: data.error,
      retryCount: data.retryCount,
      lastRetryAt: data.lastRetryAt,
      updatedAt: new Date(),
    });
  }

  private toHtml(text: string): string {
    return text
      .split('\n')
      .map(
        (line) =>
          `<p style="margin: 0 0 8px 0; font-family: sans-serif;">${line}</p>`,
      )
      .join('');
  }
}
