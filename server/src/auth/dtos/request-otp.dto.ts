export class RequestOtpDto {
  email!: string;
  phoneNumber!: string;
  channel!: 'sms' | 'push';
}
