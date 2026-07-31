// email/providers/email-provider.interface.ts

/**
 * Email Provider Interface
 * Defines the contract for all email service providers
 * This allows us to swap providers (Nodemailer, SendGrid, etc.) easily
 */
export interface EmailProvider {
  /**
   * Send an email
   * @param data - Email data including recipients, subject, body, etc.
   * @returns Promise with message ID and status
   */
  sendEmail(data: {
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
      cid?: string; // For inline images
    }>;
    replyTo?: string | string[];
    headers?: Record<string, string>;
  }): Promise<{
    messageId?: string;
    status: 'sent' | 'queued' | 'failed';
    response?: any;
  }>;

  /**
   * Send a templated email (uses pre-rendered HTML)
   * @param data - Email data with pre-rendered HTML
   * @returns Promise with message ID and status
   */
  sendTemplateEmail(data: {
    to: string | string[];
    subject: string;
    html: string;
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
  }): Promise<{
    messageId?: string;
    status: 'sent' | 'queued' | 'failed';
    response?: any;
  }>;

  /**
   * Send bulk emails to multiple recipients
   * @param data - Bulk email data
   * @returns Results for each recipient
   */
  sendBulk?(data: {
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
  }): Promise<{
    success: number;
    failed: number;
    results: Array<{
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }>;

  /**
   * Verify the connection to the email service
   * @returns True if connection is successful
   */
  verifyConnection?(): Promise<boolean>;

  /**
   * Get the underlying transporter/connection
   * Useful for debugging or advanced operations
   */
  getTransporter?(): any;
}
