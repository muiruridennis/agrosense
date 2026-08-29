export interface SmsProvider {
  sendSms(data: {
    to: string;
    message: string;
  }): Promise<{ messageId: string; status: string }>;

  sendBulk(data: {
    to: string[];
    message: string;
  }): Promise<{
    success: number;
    failed: number;
    results: Array<{
      recipient: string;
      messageId?: string;
      status?: string;
      error?: string;
    }>;
  }>;
}

