export interface SmsProvider {
  send(phoneNumber: string, message: string): Promise<SmsResult>;
  sendOtp(phoneNumber: string, otp: string): Promise<SmsResult>;
  getName(): string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}
