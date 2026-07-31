import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailProvider } from './email-provider.interface';

@Injectable()
export class NodemailerProvider implements EmailProvider, OnModuleInit {
  private readonly logger = new Logger(NodemailerProvider.name);
  private transporter: Transporter | undefined;
  private defaultFrom: string;
  private fromName: string;
  private isSandbox: boolean;
  private rateLimit: number;
  private sentCount = 0;
  private rateLimitReset: Date = new Date();

  constructor(private readonly configService: ConfigService) {
    // Read only from ConfigService (which loads from .env)
    this.defaultFrom =
      this.configService.get<string>('MAIL_FROM_EMAIL') ||
      'noreply@agrosense.co.ke';
    this.fromName =
      this.configService.get<string>('MAIL_FROM_NAME') || 'AgroSense';
    this.rateLimit = this.configService.get<number>('EMAIL_RATE_LIMIT') || 100;

    // Check if SMTP credentials are configured
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    this.isSandbox = !smtpUser || !smtpPass;
  }

  async onModuleInit(): Promise<void> {
    await this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter
   */
  private async initializeTransporter(): Promise<void> {
    try {
      const host =
        this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
      const port = this.configService.get<number>('SMTP_PORT') || 587;
      const secure = this.configService.get<boolean>('SMTP_SECURE') || false;
      const user = this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('SMTP_PASS');

      this.logger.log(`📧 Email Service Initialization`);
      this.logger.log(`   SMTP Host: ${host}:${port}`);
      this.logger.log(`   Secure: ${secure}`);
      this.logger.log(`   User: ${user ? '✓ Configured' : '✗ Not configured'}`);
      this.logger.log(`   Pass: ${pass ? '✓ Configured' : '✗ Not configured'}`);

      // If credentials missing, run in sandbox mode
      if (!user || !pass) {
        this.logger.warn(`
          ⚠️  SMTP credentials not configured

          Email sending is DISABLED. Configure these environment variables:
          - SMTP_HOST (e.g., smtp.gmail.com)
          - SMTP_PORT (e.g., 587)
          - SMTP_USER (e.g., your-email@gmail.com)
          - SMTP_PASS (Gmail App Password from myaccount.google.com/apppasswords)

          For now, emails will be logged to console only (SANDBOX MODE).
        `);
        this.isSandbox = true;
        return;
      }

      // Create transporter with credentials
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
        greetingTimeout: 30000,
        pool: {
          maxConnections: 10,
          maxMessages: 100,
          rateDelta: 1000,
          rateLimit: 14,
        },
      } as any);

      // Verify connection
      try {
        await this.transporter.verify();
        this.logger.log(`✅ Email service ready! Connected to ${host}:${port}`);
        this.isSandbox = false;
      } catch (error: any) {
        this.logger.error(`❌ SMTP connection failed: ${error.message}`);
        this.isSandbox = true;
        this.transporter = undefined;
      }
    } catch (error: any) {
      this.logger.error(`❌ Email initialization failed: ${error.message}`);
      this.isSandbox = true;
    }
  }

  /**
   * Send single email
   */
  async sendEmail(data: {
    to: string | string[];
    subject: string;
    body?: string;
    html?: string;
    from?: string;
    fromName?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: any[];
    replyTo?: string | string[];
    headers?: Record<string, string>;
  }): Promise<{
    messageId?: string;
    status: 'sent' | 'failed';
    response?: any;
  }> {
    // Sandbox mode - log instead of send
    if (this.isSandbox) {
      const to = Array.isArray(data.to) ? data.to.join(', ') : data.to;
      this.logger.debug(`
        [EMAIL SANDBOX]
        To: ${to}
        Subject: ${data.subject}
        Body: ${(data.html || data.body || '').substring(0, 100)}...
      `);
      return {
        messageId: `sandbox-${Date.now()}`,
        status: 'sent',
      };
    }

    if (!this.transporter) {
      return {
        status: 'failed',
        response: { error: 'Email service not initialized' },
      };
    }

    try {
      const to = Array.isArray(data.to) ? data.to.join(', ') : data.to;
      const cc = data.cc
        ? Array.isArray(data.cc)
          ? data.cc.join(', ')
          : data.cc
        : undefined;
      const bcc = data.bcc
        ? Array.isArray(data.bcc)
          ? data.bcc.join(', ')
          : data.bcc
        : undefined;

      const fromName = data.fromName || this.fromName;
      const fromAddress = data.from || this.defaultFrom;
      const from = fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;

      const info = await this.transporter.sendMail({
        from,
        to,
        cc,
        bcc,
        subject: data.subject,
        text: data.body,
        html: data.html,
        replyTo: data.replyTo,
        headers: data.headers,
        attachments: data.attachments,
      });

      this.sentCount++;

      this.logger.log(`✅ Email sent to ${to} - MessageID: ${info.messageId}`);

      return {
        messageId: info.messageId,
        status: 'sent',
        response: info,
      };
    } catch (error: any) {
      this.logger.error(`❌ Email send failed: ${error.message}`);
      return {
        status: 'failed',
        response: { error: error.message },
      };
    }
  }

  /**
   * Send templated email
   */
  async sendTemplateEmail(data: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    fromName?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: any[];
  }): Promise<{
    messageId?: string;
    status: 'sent' | 'failed';
    response?: any;
  }> {
    return this.sendEmail(data);
  }

  /**
   * Send bulk emails
   */
  async sendBulk(data: {
    to: string[];
    subject: string;
    body?: string;
    html?: string;
    attachments?: any[];
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
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    const batchSize = 10;
    for (let i = 0; i < data.to.length; i += batchSize) {
      const batch = data.to.slice(i, i + batchSize);

      const batchPromises = batch.map(async (email) => {
        try {
          const result = await this.sendEmail({
            to: email,
            subject: data.subject,
            body: data.body,
            html: data.html,
            attachments: data.attachments,
          });

          if (result.status === 'sent') {
            success++;
            return { email, success: true, messageId: result.messageId };
          } else {
            failed++;
            return { email, success: false, error: 'Send failed' };
          }
        } catch (error: any) {
          failed++;
          return { email, success: false, error: error.message };
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

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter || this.isSandbox) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get transporter (for advanced usage)
   */
  getTransporter(): Transporter | undefined {
    return this.transporter;
  }
}
