export class VerifyOtpDto {
  destination!: string;
  channel!: 'sms' | 'push';
  otp!: string;
}
